import { getComplianceAiConfig, getComplianceAiRuntimeStatus } from "@/lib/compliance-ai/config";
import {
  chunkToCitation,
  embedComplianceQuery,
  generateComplianceAnswer,
  rerankComplianceChunks,
} from "@/lib/compliance-ai/providers";
import { QdrantSearchError, searchComplianceChunks } from "@/lib/compliance-ai/qdrant";
import type {
  ComplianceAssistantAnswer,
  ComplianceAssistantFilters,
  ComplianceChunk,
} from "@/lib/compliance-ai/types";

function buildRetrievalOnlyAnswer(chunks: ComplianceChunk[]): string {
  const topChunks = chunks.slice(0, 3);
  const bulletList = topChunks
    .map(
      (chunk) =>
        `- ${chunk.documentTitle} (${chunk.locator}): ${chunk.text.slice(0, 220).trim()}`
    )
    .join("\n");

  return [
    "I found relevant AfCFTA compliance source material, but full answer generation is not configured yet.",
    "Use the cited excerpts below as the current retrieval result:",
    bulletList,
  ].join("\n\n");
}

export function buildNotConfiguredAnswer(): ComplianceAssistantAnswer {
  const status = getComplianceAiRuntimeStatus();

  return {
    status: "not_configured",
    mode: "retrieval-only",
    answer:
      "The AfCFTA AI assistant is scaffolded, but the required Qdrant and provider environment variables are not fully configured yet.",
    citations: [],
    warning: `Missing configuration: ${status.missing.join(", ")}`,
    providerSummary: status.providerSummary,
  };
}

export async function askComplianceAssistant(
  question: string,
  filters?: ComplianceAssistantFilters
): Promise<ComplianceAssistantAnswer> {
  const status = getComplianceAiRuntimeStatus();
  if (!status.enabled || !status.retrievalReady) {
    return buildNotConfiguredAnswer();
  }

  getComplianceAiConfig();

  let vector: number[];
  let retrievedChunks: ComplianceChunk[];

  try {
    vector = await embedComplianceQuery(question);
    retrievedChunks = await searchComplianceChunks(vector, filters);
  } catch (error) {
    const warning =
      error instanceof QdrantSearchError || error instanceof Error
        ? error.message
        : "Compliance retrieval is not ready yet.";

    return {
      status: "not_configured",
      mode: "retrieval-only",
      answer:
        "The AfCFTA AI assistant is connected, but the compliance document index is not ready yet.",
      citations: [],
      warning,
      providerSummary: status.providerSummary,
    };
  }

  if (retrievedChunks.length === 0) {
    return {
      status: "no_evidence",
      mode: "retrieval-only",
      answer:
        "I could not find enough uploaded AfCFTA evidence to answer that question confidently. Try narrowing the country, document type, or wording.",
      citations: [],
      providerSummary: status.providerSummary,
    };
  }

  const rerankedChunks = await rerankComplianceChunks(question, retrievedChunks);
  let generated: Awaited<ReturnType<typeof generateComplianceAnswer>> = null;
  let generationWarning: string | undefined;

  try {
    generated = await generateComplianceAnswer(question, rerankedChunks);
  } catch (error) {
    generationWarning =
      error instanceof Error
        ? error.message
        : "Generation failed, so this response is based on retrieved evidence only.";
  }

  if (!generated) {
    return {
      status: "ready",
      mode: "retrieval-only",
      answer: buildRetrievalOnlyAnswer(rerankedChunks),
      citations: rerankedChunks.slice(0, 3).map(chunkToCitation),
      warning:
        generationWarning ??
        "Generation provider is not configured, so this response is based on retrieved evidence only.",
      providerSummary: status.providerSummary,
    };
  }

  const citationLookup = new Map(
    rerankedChunks.map((chunk) => [chunk.id, chunkToCitation(chunk)])
  );
  const citations = generated.citationIds
    .map((citationId) => citationLookup.get(citationId))
    .filter((citation): citation is NonNullable<typeof citation> => !!citation);

  return {
    status: "ready",
    mode: "full-rag",
    answer: generated.answer,
    citations: citations.length > 0
      ? citations
      : rerankedChunks.slice(0, 3).map(chunkToCitation),
    warning: generated.warning,
    providerSummary: status.providerSummary,
  };
}
