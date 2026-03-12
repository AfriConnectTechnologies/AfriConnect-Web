import { getComplianceAiConfig } from "@/lib/compliance-ai/config";
import type {
  ComplianceChunk,
  ComplianceCitation,
} from "@/lib/compliance-ai/types";

interface GeneratedAnswerPayload {
  answer: string;
  citationIds: string[];
  warning?: string;
}

const DEFAULT_PROVIDER_TIMEOUT_MS = 15000;

interface FetchWithTimeoutOptions extends RequestInit {
  timeout?: number;
  requestName?: string;
}

async function fetchWithTimeout(
  input: string | URL | globalThis.Request,
  options: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const {
    timeout = DEFAULT_PROVIDER_TIMEOUT_MS,
    requestName = "External request",
    signal,
    ...init
  } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const abortHandler = () => controller.abort();
  signal?.addEventListener("abort", abortHandler);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`${requestName} timed out after ${timeout}ms`);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener("abort", abortHandler);
  }
}

function extractJsonObject(value: string): string | null {
  const first = value.indexOf("{");
  const last = value.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    return null;
  }

  return value.slice(first, last + 1);
}

function parseGeneratedAnswer(raw: string): GeneratedAnswerPayload | null {
  const candidate = extractJsonObject(raw) ?? raw;

  try {
    const parsed = JSON.parse(candidate) as Partial<GeneratedAnswerPayload>;
    if (!parsed.answer || !Array.isArray(parsed.citationIds)) {
      return null;
    }

    return {
      answer: parsed.answer,
      citationIds: parsed.citationIds.map(String),
      warning: parsed.warning,
    };
  } catch {
    return null;
  }
}

function buildAnswerPrompt(question: string, chunks: ComplianceChunk[]): string {
  const evidence = chunks
    .map(
      (chunk) =>
        `[${chunk.id}] ${chunk.documentTitle} | ${chunk.locator}\n${chunk.text}`
    )
    .join("\n\n");

  return [
    "You are an AfCFTA compliance assistant.",
    "Answer only from the evidence below.",
    "If the evidence is insufficient, say so clearly.",
    "Do not give legal advice.",
    'Return strict JSON with keys: "answer", "citationIds", and optional "warning".',
    'The "citationIds" array must contain evidence IDs such as ["1", "3"].',
    "",
    `Question: ${question}`,
    "",
    "Evidence:",
    evidence,
  ].join("\n");
}

export async function embedComplianceQuery(question: string): Promise<number[]> {
  const config = getComplianceAiConfig();
  const response = await fetchWithTimeout("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
    requestName: "Voyage embedding request",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.voyageApiKey}`,
    },
    body: JSON.stringify({
      input: [question],
      model: config.embeddingModel,
      input_type: "query",
      output_dimension: config.embeddingDimension,
    }),
  });

  if (!response.ok) {
    throw new Error(`Voyage embedding failed with status ${response.status}`);
  }

  const data = (await response.json()) as {
    data?: Array<{ embedding: number[] }>;
  };

  const vector = data.data?.[0]?.embedding;
  if (!vector) {
    throw new Error("Voyage embedding response did not include an embedding");
  }

  return vector;
}

export async function rerankComplianceChunks(
  _question: string,
  chunks: ComplianceChunk[]
): Promise<ComplianceChunk[]> {
  return [...chunks].sort((a, b) => b.score - a.score);
}

async function generateWithOpenAi(
  apiKey: string,
  model: string,
  prompt: string
): Promise<GeneratedAnswerPayload | null> {
  const response = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
    requestName: "OpenAI generation request",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "You answer AfCFTA compliance questions only from retrieved evidence and produce valid JSON.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      body
        ? `OpenAI generation failed with status ${response.status}: ${body}`
        : `OpenAI generation failed with status ${response.status}`
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return parseGeneratedAnswer(data.choices?.[0]?.message?.content ?? "");
}

async function generateWithGemini(
  apiKey: string,
  model: string,
  prompt: string
): Promise<GeneratedAnswerPayload | null> {
  const response = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
      requestName: "Gemini generation request",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini generation failed with status ${response.status}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return parseGeneratedAnswer(text);
}

async function generateWithAnthropic(
  apiKey: string,
  model: string,
  prompt: string
): Promise<GeneratedAnswerPayload | null> {
  const response = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
    method: "POST",
    timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
    requestName: "Anthropic generation request",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 800,
      temperature: 0.1,
      system:
        "You answer AfCFTA compliance questions only from retrieved evidence and produce valid JSON.",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic generation failed with status ${response.status}`);
  }

  const data = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };

  const text =
    data.content?.find((item) => item.type === "text")?.text ?? "";
  return parseGeneratedAnswer(text);
}

export async function generateComplianceAnswer(
  question: string,
  chunks: ComplianceChunk[]
): Promise<GeneratedAnswerPayload | null> {
  const config = getComplianceAiConfig();
  if (!config.generationProvider || !config.generationModel || !config.generationApiKey) {
    return null;
  }

  const prompt = buildAnswerPrompt(question, chunks);

  switch (config.generationProvider) {
    case "openai":
      return generateWithOpenAi(
        config.generationApiKey,
        config.generationModel,
        prompt
      );
    case "gemini":
      return generateWithGemini(
        config.generationApiKey,
        config.generationModel,
        prompt
      );
    case "anthropic":
      return generateWithAnthropic(
        config.generationApiKey,
        config.generationModel,
        prompt
      );
    default:
      return null;
  }
}

export function chunkToCitation(chunk: ComplianceChunk): ComplianceCitation {
  return {
    id: chunk.id,
    documentTitle: chunk.documentTitle,
    locator: chunk.locator,
    excerpt: chunk.text.slice(0, 280),
    sourceUrl: chunk.sourceUrl,
    score: chunk.score,
  };
}
