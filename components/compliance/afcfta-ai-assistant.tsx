"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Bot, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { ComplianceAssistantAnswer } from "@/lib/compliance-ai/types";

export function AfcftaAiAssistant() {
  const t = useTranslations("afcfta");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<ComplianceAssistantAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sampleQuestions = useMemo(() => {
    const rawQuestions = t.raw("sampleQuestions");

    return Array.isArray(rawQuestions)
      ? rawQuestions.filter(
          (question): question is string => typeof question === "string"
        )
      : [];
  }, [t]);

  const canSubmit = question.trim().length >= 5 && !isSubmitting;

  const submitQuestion = async (nextQuestion?: string) => {
    const value = (nextQuestion ?? question).trim();
    if (value.length < 5) {
      setError(t("validation.questionTooShort"));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/compliance/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: value }),
      });

      const payload = (await response.json()) as ComplianceAssistantAnswer & {
        error?: string;
      };

      if (!response.ok) {
        setAnswer(null);
        setError(
          response.status === 400
            ? t("validation.invalidQuestion")
            : t("error.generic")
        );
        return;
      }

      setQuestion(value);
      setAnswer(payload);
    } catch (requestError) {
      console.error("AfCFTA assistant request failed:", requestError);
      setAnswer(null);
      setError(t("error.generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              {t("title")}
            </CardTitle>
            <CardDescription className="mt-2 max-w-2xl">
              {t("description")}
            </CardDescription>
          </div>
          <Badge variant="outline" className="shrink-0">
            {t("badge")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-background/80 p-3 text-sm text-muted-foreground">
          {t("helper")}
        </div>

        <div className="space-y-3">
          <Textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            aria-label={t("form.questionLabel")}
            placeholder={t("placeholder")}
            className="min-h-28"
          />
          <div className="flex flex-wrap gap-2">
            {sampleQuestions.map((sample) => (
              <Button
                key={sample}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuestion(sample);
                  void submitQuestion(sample);
                }}
                disabled={isSubmitting}
              >
                <Sparkles className="h-4 w-4" />
                {sample}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => void submitQuestion()} disabled={!canSubmit}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("cta.asking")}
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4" />
                  {t("cta.ask")}
                </>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {answer && (
          <div className="space-y-4 rounded-xl border bg-background p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={answer.mode === "full-rag" ? "default" : "secondary"}>
                {answer.mode === "full-rag"
                  ? t("mode.fullRag")
                  : t("mode.retrievalOnly")}
              </Badge>
              <Badge variant="outline">{t(`status.${answer.status}`)}</Badge>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">{t("sections.answer")}</h3>
              <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">
                {answer.answer}
              </p>
              {answer.warning && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                  {answer.warning}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">{t("sections.citations")}</h3>
              {answer.citations.length > 0 ? (
                <div className="space-y-3">
                  {answer.citations.map((citation) => (
                    <div key={citation.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{citation.documentTitle}</p>
                          <p className="text-xs text-muted-foreground">
                            {citation.locator}
                          </p>
                        </div>
                        {citation.sourceUrl && (
                          <a
                            href={citation.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            {t("sections.source")}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {citation.excerpt}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("empty.citations")}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
