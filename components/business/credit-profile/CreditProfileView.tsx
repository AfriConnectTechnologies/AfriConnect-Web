"use client";

import type { ComponentType } from "react";
import { useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, Building2, Download, FileText, Globe2, Printer, RefreshCw, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/config";

type BreakdownItem = {
  label: string;
  count: number;
  share: number;
};

type TopBuyer = {
  name: string;
  orderCount: number;
  revenue: number;
};

const currencyByLocale: Record<Locale, string> = {
  en: "USD",
  am: "ETB",
  sw: "KES",
};

type CreditProfileResponse = {
  access: {
    state:
      | "ready"
      | "no_business"
      | "pending_verification"
      | "rejected_verification"
      | "not_seller";
    title: string;
    message: string;
  };
  business: {
    name: string;
    category: string;
    country: string;
    verificationStatus: string;
    createdAt: number;
  } | null;
  reportMeta: {
    generatedAt: number;
    reportStart: number | null;
    reportEnd: number | null;
  } | null;
  profile: {
    profileSummary: {
      ordersCount: number;
      paidOrdersCount: number;
      uniqueBuyers: number;
      countriesRepresented: number;
      totalTransactionVolume: number;
    };
    transactionHistory: {
      totalOrders: number;
      paidOrders: number;
      totalTransactionVolume: number;
      averageOrderValue: number;
      successfulPaymentRate: number;
      recentPaidActivityAt: number | null;
      trend: Array<{
        label: string;
        days: number;
        orderCount: number;
        paidOrderCount: number;
        paidVolume: number;
      }>;
    };
    fulfillment: {
      totalOrders: number;
      processingOrders: number;
      completionRate: number;
      cancellationRate: number;
      averageFulfillmentCycleDays: number;
      payoutSuccessRate: number;
      payoutStatusCounts: {
        pending: number;
        queued: number;
        success: number;
        failed: number;
        reverted: number;
      };
    };
    buyerDiversity: {
      uniqueBuyers: number;
      repeatBuyers: number;
      buyerBusinessCoverageRate: number;
      buyersWithBusinessMetadata: number;
      topBuyerConcentrationRate: number;
      countries: BreakdownItem[];
      categories: BreakdownItem[];
      topBuyers: TopBuyer[];
      coverageNote: string;
    };
  } | null;
};

function currency(value: number, locale: string, displayCurrency: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: displayCurrency,
    maximumFractionDigits: 0,
  }).format(value);
}

function percent(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value / 100);
}

function integer(value: number, locale: string) {
  return new Intl.NumberFormat(locale).format(value);
}

function formatDate(value: number | null, locale: string, emptyLabel: string) {
  if (!value) {
    return emptyLabel;
  }

  return new Intl.DateTimeFormat(locale).format(new Date(value));
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function BreakdownList({
  title,
  emptyLabel,
  items,
  getCountLabel,
}: {
  title: string;
  emptyLabel: string;
  items: BreakdownItem[];
  getCountLabel: (count: number) => string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          items.slice(0, 5).map((item) => (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{item.label}</span>
                <span className="text-muted-foreground">
                  {getCountLabel(item.count)}
                </span>
              </div>
              <Progress value={item.share} />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function CreditProfileView({ reportMode = false }: { reportMode?: boolean }) {
  const t = useTranslations("creditProfile");
  const locale = useLocale() as Locale;
  const displayCurrency = currencyByLocale[locale] ?? "USD";
  const creditProfile = useQuery(api.creditProfiles.getMyProfile) as
    | CreditProfileResponse
    | undefined;

  if (creditProfile === undefined) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-muted-foreground">{t("loading")}</div>
      </div>
    );
  }

  const { access, business, reportMeta, profile } = creditProfile;

  if (access.state !== "ready" || !profile || !business || !reportMeta) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        {reportMode && (
          <div className="print:hidden">
            <Link href="/business/credit-profile">
              <Button variant="ghost" className="px-0">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("actions.backToProfile")}
              </Button>
            </Link>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t(`access.${access.state}.title`)}</CardTitle>
            <CardDescription>{t(`access.${access.state}.message`)}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link href="/business/profile">
              <Button>
                <Building2 className="mr-2 h-4 w-4" />
                {t("actions.openBusinessProfile")}
              </Button>
            </Link>
            {!reportMode && (
              <Link href="/business/register">
                <Button variant="outline">{t("actions.businessSetup")}</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const summary = profile.profileSummary;
  const transactionHistory = profile.transactionHistory;
  const fulfillment = profile.fulfillment;
  const buyerDiversity = profile.buyerDiversity;
  const hasOrders = transactionHistory.totalOrders > 0;
  const coverageNote =
    buyerDiversity.buyersWithBusinessMetadata === buyerDiversity.uniqueBuyers
      ? t("buyerDiversity.coverage.complete")
      : t("buyerDiversity.coverage.partial");

  return (
    <div className={cn("space-y-6", reportMode && "mx-auto max-w-5xl bg-background print:max-w-none")}>
      <div className="flex flex-col gap-4 print:hidden md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{t("badges.verifiedSeller")}</Badge>
            <Badge variant="secondary">{t("badges.platformActivity")}</Badge>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {reportMode ? t("titleReport") : t("title")}
          </h1>
          <p className="text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {reportMode ? (
            <>
              <Link href="/business/credit-profile">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t("actions.back")}
                </Button>
              </Link>
              <Button onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                {t("actions.printOrSavePdf")}
              </Button>
            </>
          ) : (
            <Link href="/business/credit-profile/report">
              <Button>
                <Download className="mr-2 h-4 w-4" />
                {t("actions.downloadableReport")}
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                {business.name}
              </div>
              <h2 className="mt-1 text-2xl font-semibold">
                {t("summary.headline", {
                  paidOrdersCount: integer(summary.paidOrdersCount, locale),
                  uniqueBuyers: integer(summary.uniqueBuyers, locale),
                })}
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                {t("summary.description")}
              </p>
            </div>

            <div className="grid gap-2 text-sm text-muted-foreground">
              <div>
                {t("summary.generated")}:{" "}
                {formatDate(reportMeta.generatedAt, locale, t("common.notAvailableYet"))}
              </div>
              <div>
                {t("summary.reportPeriodStart")}:{" "}
                {formatDate(reportMeta.reportStart, locale, t("common.notAvailableYet"))}
              </div>
              <div>
                {t("summary.latestProfileActivity")}:{" "}
                {formatDate(
                  transactionHistory.recentPaidActivityAt,
                  locale,
                  t("common.notAvailableYet")
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title={t("cards.paidTransactionVolume.title")}
              value={currency(summary.totalTransactionVolume, locale, displayCurrency)}
              description={t("cards.paidTransactionVolume.description")}
              icon={TrendingUp}
            />
            <StatCard
              title={t("cards.paidOrders.title")}
              value={integer(summary.paidOrdersCount, locale)}
              description={t("cards.paidOrders.description", {
                totalOrders: integer(transactionHistory.totalOrders, locale),
              })}
              icon={ShieldCheck}
            />
            <StatCard
              title={t("cards.uniqueBuyers.title")}
              value={integer(summary.uniqueBuyers, locale)}
              description={t("cards.uniqueBuyers.description", {
                repeatBuyers: integer(buyerDiversity.repeatBuyers, locale),
              })}
              icon={Users}
            />
            <StatCard
              title={t("cards.buyerCountries.title")}
              value={integer(summary.countriesRepresented, locale)}
              description={t("cards.buyerCountries.description", {
                buyersWithBusinessMetadata: integer(
                  buyerDiversity.buyersWithBusinessMetadata,
                  locale
                ),
              })}
              icon={Globe2}
            />
          </div>
        </CardContent>
      </Card>

      {!hasOrders && (
        <Card>
          <CardHeader>
            <CardTitle>{t("empty.title")}</CardTitle>
            <CardDescription>
              {t("empty.description")}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t("sections.transactionHistory.title")}</CardTitle>
            <CardDescription>{t("sections.transactionHistory.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title={t("cards.totalSellerOrders.title")}
                value={integer(transactionHistory.totalOrders, locale)}
                description={t("cards.totalSellerOrders.description")}
                icon={FileText}
              />
              <StatCard
                title={t("cards.successfulPaymentRate.title")}
                value={percent(transactionHistory.successfulPaymentRate, locale)}
                description={t("cards.successfulPaymentRate.description")}
                icon={ShieldCheck}
              />
              <StatCard
                title={t("cards.averageOrderValue.title")}
                value={currency(transactionHistory.averageOrderValue, locale, displayCurrency)}
                description={t("cards.averageOrderValue.description")}
                icon={TrendingUp}
              />
              <StatCard
                title={t("cards.recentPaidActivity.title")}
                value={formatDate(
                  transactionHistory.recentPaidActivityAt,
                  locale,
                  t("common.notAvailableYet")
                )}
                description={t("cards.recentPaidActivity.description")}
                icon={RefreshCw}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {transactionHistory.trend.map((window) => (
                <Card key={window.days} className="border-dashed">
                  <CardHeader>
                    <CardTitle className="text-base">
                      {t("trend.window", {
                        days: integer(window.days, locale),
                      })}
                    </CardTitle>
                    <CardDescription>{t("trend.rollingPerformanceWindow")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t("trend.orders")}</span>
                      <span className="font-medium">{integer(window.orderCount, locale)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t("trend.paidOrders")}</span>
                      <span className="font-medium">{integer(window.paidOrderCount, locale)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t("trend.paidVolume")}</span>
                      <span className="font-medium">
                        {currency(window.paidVolume, locale, displayCurrency)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("sections.fulfillment.title")}</CardTitle>
            <CardDescription>
              {t("sections.fulfillment.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{t("fulfillment.completionRate")}</span>
                <span className="font-medium">{percent(fulfillment.completionRate, locale)}</span>
              </div>
              <Progress value={fulfillment.completionRate} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{t("fulfillment.cancellationRate")}</span>
                <span className="font-medium">{percent(fulfillment.cancellationRate, locale)}</span>
              </div>
              <Progress value={fulfillment.cancellationRate} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{t("fulfillment.payoutSuccessRate")}</span>
                <span className="font-medium">{percent(fulfillment.payoutSuccessRate, locale)}</span>
              </div>
              <Progress value={fulfillment.payoutSuccessRate} />
            </div>

            <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-lg border p-3">
                <div className="text-muted-foreground">{t("fulfillment.ordersCurrentlyProcessing")}</div>
                <div className="mt-1 text-xl font-semibold">{integer(fulfillment.processingOrders, locale)}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-muted-foreground">{t("fulfillment.averageFulfillmentCycle")}</div>
                <div className="mt-1 text-xl font-semibold">
                  {t("fulfillment.averageFulfillmentCycleValue", {
                    days: new Intl.NumberFormat(locale, {
                      maximumFractionDigits: 1,
                      minimumFractionDigits: 1,
                    }).format(fulfillment.averageFulfillmentCycleDays),
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4 text-sm">
              <div className="font-medium">{t("fulfillment.payoutOutcomeCounts")}</div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("fulfillment.payoutStatuses.queued")}</span>
                  <span>{integer(fulfillment.payoutStatusCounts.queued, locale)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("fulfillment.payoutStatuses.pending")}</span>
                  <span>{integer(fulfillment.payoutStatusCounts.pending, locale)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("fulfillment.payoutStatuses.success")}</span>
                  <span>{integer(fulfillment.payoutStatusCounts.success, locale)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("fulfillment.payoutStatuses.failed")}</span>
                  <span>{integer(fulfillment.payoutStatusCounts.failed, locale)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("sections.buyerDiversity.title")}</CardTitle>
          <CardDescription>{coverageNote}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title={t("cards.uniqueBuyersDetailed.title")}
              value={integer(buyerDiversity.uniqueBuyers, locale)}
              description={t("cards.uniqueBuyersDetailed.description")}
              icon={Users}
            />
            <StatCard
              title={t("cards.repeatBuyers.title")}
              value={integer(buyerDiversity.repeatBuyers, locale)}
              description={t("cards.repeatBuyers.description")}
              icon={RefreshCw}
            />
            <StatCard
              title={t("cards.metadataCoverage.title")}
              value={percent(buyerDiversity.buyerBusinessCoverageRate, locale)}
              description={t("cards.metadataCoverage.description", {
                buyersWithBusinessMetadata: integer(
                  buyerDiversity.buyersWithBusinessMetadata,
                  locale
                ),
              })}
              icon={Building2}
            />
            <StatCard
              title={t("cards.topBuyerConcentration.title")}
              value={percent(buyerDiversity.topBuyerConcentrationRate, locale)}
              description={t("cards.topBuyerConcentration.description")}
              icon={TrendingUp}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <BreakdownList
              title={t("breakdowns.buyerCountries.title")}
              emptyLabel={t("breakdowns.buyerCountries.empty")}
              items={buyerDiversity.countries}
              getCountLabel={(count) =>
                t("breakdowns.countLabel", { count: integer(count, locale) })
              }
            />
            <BreakdownList
              title={t("breakdowns.buyerCategories.title")}
              emptyLabel={t("breakdowns.buyerCategories.empty")}
              items={buyerDiversity.categories}
              getCountLabel={(count) =>
                t("breakdowns.countLabel", { count: integer(count, locale) })
              }
            />
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("breakdowns.topBuyers.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {buyerDiversity.topBuyers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("breakdowns.topBuyers.empty")}</p>
                ) : (
                  buyerDiversity.topBuyers.map((buyer) => (
                    <div key={buyer.name} className="rounded-lg border p-3">
                      <div className="font-medium">{buyer.name}</div>
                      <div className="mt-1 flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                          {t("breakdowns.topBuyers.orders", {
                            count: integer(buyer.orderCount, locale),
                          })}
                        </span>
                        <span>{currency(buyer.revenue, locale, displayCurrency)}</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card className="print:break-inside-avoid">
        <CardHeader>
          <CardTitle>{t("methodology.title")}</CardTitle>
          <CardDescription>
            {t("methodology.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>{t("methodology.points.transactionVolume")}</p>
          <p>{t("methodology.points.fulfillment")}</p>
          <p>{t("methodology.points.buyerDiversity")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
