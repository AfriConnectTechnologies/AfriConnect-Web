"use client";

import { useTranslations, useLocale } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, TrendingDown, Calendar, Trash2 } from "lucide-react";

interface Rates {
  "2026": string;
  "2027": string;
  "2028": string;
  "2029": string;
  "2030": string;
}

interface ComplianceCardProps {
  hsCode: string;
  productName: string;
  productNameAmharic?: string;
  isCompliant: boolean;
  currentRate?: string;
  rates?: Rates | string;
  country?: string; // "ethiopia" or "kenya"
  onRemove?: () => void;
  showRemove?: boolean;
  compact?: boolean;
}

const countryFlags: Record<string, string> = {
  ethiopia: "🇪🇹",
  kenya: "🇰🇪",
};

export function ComplianceCard({
  hsCode,
  productName,
  productNameAmharic,
  isCompliant,
  currentRate,
  rates,
  country,
  onRemove,
  showRemove = true,
  compact = false,
}: ComplianceCardProps) {
  const t = useTranslations("compliance");
  const locale = useLocale();
  const currentYear = new Date().getFullYear();
  const countryFlag = country ? countryFlags[country] : countryFlags.ethiopia;

  // Parse rates if it's a JSON string
  const parsedRates: Rates | null = rates
    ? typeof rates === "string"
      ? JSON.parse(rates)
      : rates
    : null;

  const displayName = locale === "am" && productNameAmharic 
    ? productNameAmharic 
    : productName;

  const years = ["2026", "2027", "2028", "2029", "2030"] as const;

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-lg border p-3 bg-card">
        <div className="flex items-center gap-3 min-w-0">
          {isCompliant ? (
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
          ) : (
            <XCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
          )}
          <div className="min-w-0">
            <div className="font-medium text-sm truncate">{displayName}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <span>{countryFlag}</span>
              <span>HS: {hsCode}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isCompliant && currentRate && (
            <Badge variant="secondary" className="text-xs">
              {currentRate}%
            </Badge>
          )}
          {showRemove && onRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={cn(
      "overflow-hidden",
      isCompliant 
        ? "border-green-200 dark:border-green-900" 
        : "border-amber-200 dark:border-amber-900"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              {isCompliant ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              )}
              {displayName}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span>{countryFlag}</span>
              <span>HS Code: {hsCode}</span>
            </CardDescription>
          </div>
          <Badge 
            variant={isCompliant ? "default" : "secondary"}
            className={cn(
              isCompliant 
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
            )}
          >
            {isCompliant ? t("categoryA") : t("notCategoryA")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isCompliant && parsedRates ? (
          <>
            <div className="flex items-center gap-2 text-sm">
              <TrendingDown className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-muted-foreground">{t("tariffReduction")}</span>
            </div>
            
            {/* Rate Timeline */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {t("rateSchedule")}
              </div>
              <div className="grid grid-cols-5 gap-1">
                {years.map((year) => {
                  const rate = parsedRates[year];
                  const isCurrentYear = parseInt(year) === currentYear;
                  const isPast = parseInt(year) < currentYear;
                  
                  return (
                    <div
                      key={year}
                      className={cn(
                        "text-center p-2 rounded-md text-xs",
                        isCurrentYear 
                          ? "bg-primary text-primary-foreground font-medium" 
                          : isPast
                            ? "bg-muted text-muted-foreground"
                            : "bg-muted/50"
                      )}
                    >
                      <div className="font-medium">{year}</div>
                      <div className={cn(
                        "mt-1",
                        rate === "0" && "text-green-600 dark:text-green-400 font-semibold"
                      )}>
                        {rate}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current Year Highlight */}
            <div className="rounded-md bg-green-50 dark:bg-green-950/30 p-3">
              <div className="text-sm">
                <span className="text-muted-foreground">{t("currentYearRate")} ({currentYear}):</span>
                <span className="ml-2 font-semibold text-green-700 dark:text-green-300">
                  {currentRate || parsedRates["2026"]}%
                </span>
              </div>
              {parsedRates["2030"] === "0" && (
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {t("zeroTariffBy2030")}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 p-3">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {t("noAfcftaBenefits")}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              {t("noAfcftaBenefitsDescription")}
            </p>
          </div>
        )}

        {showRemove && onRemove && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRemove}
            className="w-full text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t("removeProduct")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
