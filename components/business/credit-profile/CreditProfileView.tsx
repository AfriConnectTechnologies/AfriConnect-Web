"use client";

import type { ComponentType } from "react";
import { useQuery } from "convex/react";
import { ArrowLeft, Building2, Download, FileText, Globe2, Printer, RefreshCw, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

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

function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function percent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatDate(value: number | null) {
  if (!value) {
    return "Not available yet";
  }

  return new Date(value).toLocaleDateString();
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
}: {
  title: string;
  emptyLabel: string;
  items: BreakdownItem[];
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
                  {item.count} buyers
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
  const creditProfile = useQuery(
    (api as any).creditProfiles.getMyProfile
  ) as CreditProfileResponse | undefined;

  if (creditProfile === undefined) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-muted-foreground">Loading digital credit profile...</div>
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
                Back to credit profile
              </Button>
            </Link>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{access.title}</CardTitle>
            <CardDescription>{access.message}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link href="/business/profile">
              <Button>
                <Building2 className="mr-2 h-4 w-4" />
                Open business profile
              </Button>
            </Link>
            {!reportMode && (
              <Link href="/business/register">
                <Button variant="outline">Business setup</Button>
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

  return (
    <div className={cn("space-y-6", reportMode && "mx-auto max-w-5xl bg-background print:max-w-none")}>
      <div className="flex flex-col gap-4 print:hidden md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Verified seller</Badge>
            <Badge variant="secondary">Platform activity profile</Badge>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {reportMode ? "Digital Credit Profile Report" : "Digital Credit Profile"}
          </h1>
          <p className="text-muted-foreground">
            Built from marketplace transactions, fulfillment history, and buyer diversity.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {reportMode ? (
            <>
              <Link href="/business/credit-profile">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </Link>
              <Button onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Print / Save PDF
              </Button>
            </>
          ) : (
            <Link href="/business/credit-profile/report">
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Downloadable report
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
                {summary.paidOrdersCount} paid orders across {summary.uniqueBuyers} buyers
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                This profile reflects activity captured on AfriConnect and is intended as a
                platform scorecard, not an external bureau credit score.
              </p>
            </div>

            <div className="grid gap-2 text-sm text-muted-foreground">
              <div>Generated: {formatDate(reportMeta.generatedAt)}</div>
              <div>Report period start: {formatDate(reportMeta.reportStart)}</div>
              <div>Latest profile activity: {formatDate(transactionHistory.recentPaidActivityAt)}</div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Paid transaction volume"
              value={currency(summary.totalTransactionVolume)}
              description="Settled marketplace order value"
              icon={TrendingUp}
            />
            <StatCard
              title="Paid orders"
              value={String(summary.paidOrdersCount)}
              description={`${transactionHistory.totalOrders} total seller orders tracked`}
              icon={ShieldCheck}
            />
            <StatCard
              title="Unique buyers"
              value={String(summary.uniqueBuyers)}
              description={`${buyerDiversity.repeatBuyers} repeat buyers`}
              icon={Users}
            />
            <StatCard
              title="Buyer countries"
              value={String(summary.countriesRepresented)}
              description={`${buyerDiversity.buyersWithBusinessMetadata} buyers with linked business metadata`}
              icon={Globe2}
            />
          </div>
        </CardContent>
      </Card>

      {!hasOrders && (
        <Card>
          <CardHeader>
            <CardTitle>Not enough activity yet</CardTitle>
            <CardDescription>
              Once your business starts receiving orders, this profile will automatically expand
              with transaction, fulfillment, and buyer diversity signals.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Recent order and payment performance across the marketplace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total seller orders"
                value={String(transactionHistory.totalOrders)}
                description="All orders attributed to this seller"
                icon={FileText}
              />
              <StatCard
                title="Successful payment rate"
                value={percent(transactionHistory.successfulPaymentRate)}
                description="Settled payments among orders with payment records"
                icon={ShieldCheck}
              />
              <StatCard
                title="Average order value"
                value={currency(transactionHistory.averageOrderValue)}
                description="Based on settled marketplace orders"
                icon={TrendingUp}
              />
              <StatCard
                title="Recent paid activity"
                value={formatDate(transactionHistory.recentPaidActivityAt)}
                description="Most recent settled order activity"
                icon={RefreshCw}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {transactionHistory.trend.map((window) => (
                <Card key={window.days} className="border-dashed">
                  <CardHeader>
                    <CardTitle className="text-base">{window.label}</CardTitle>
                    <CardDescription>Rolling performance window</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Orders</span>
                      <span className="font-medium">{window.orderCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Paid orders</span>
                      <span className="font-medium">{window.paidOrderCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Paid volume</span>
                      <span className="font-medium">{currency(window.paidVolume)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fulfillment Performance</CardTitle>
            <CardDescription>
              Operational performance derived from order lifecycle and payout outcomes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Completion rate</span>
                <span className="font-medium">{percent(fulfillment.completionRate)}</span>
              </div>
              <Progress value={fulfillment.completionRate} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Cancellation rate</span>
                <span className="font-medium">{percent(fulfillment.cancellationRate)}</span>
              </div>
              <Progress value={fulfillment.cancellationRate} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Payout success rate</span>
                <span className="font-medium">{percent(fulfillment.payoutSuccessRate)}</span>
              </div>
              <Progress value={fulfillment.payoutSuccessRate} />
            </div>

            <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-lg border p-3">
                <div className="text-muted-foreground">Orders currently processing</div>
                <div className="mt-1 text-xl font-semibold">{fulfillment.processingOrders}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-muted-foreground">Average fulfillment cycle</div>
                <div className="mt-1 text-xl font-semibold">
                  {fulfillment.averageFulfillmentCycleDays.toFixed(1)} days
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4 text-sm">
              <div className="font-medium">Payout outcome counts</div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Queued</span>
                  <span>{fulfillment.payoutStatusCounts.queued}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Pending</span>
                  <span>{fulfillment.payoutStatusCounts.pending}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Successful</span>
                  <span>{fulfillment.payoutStatusCounts.success}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Failed</span>
                  <span>{fulfillment.payoutStatusCounts.failed}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buyer Diversity</CardTitle>
          <CardDescription>{buyerDiversity.coverageNote}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Unique buyers"
              value={String(buyerDiversity.uniqueBuyers)}
              description="Distinct buyers who placed seller orders"
              icon={Users}
            />
            <StatCard
              title="Repeat buyers"
              value={String(buyerDiversity.repeatBuyers)}
              description="Buyers with more than one order"
              icon={RefreshCw}
            />
            <StatCard
              title="Metadata coverage"
              value={percent(buyerDiversity.buyerBusinessCoverageRate)}
              description={`${buyerDiversity.buyersWithBusinessMetadata} buyers linked to business records`}
              icon={Building2}
            />
            <StatCard
              title="Top-buyer concentration"
              value={percent(buyerDiversity.topBuyerConcentrationRate)}
              description="Share of transaction volume from the largest buyer"
              icon={TrendingUp}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <BreakdownList
              title="Buyer countries"
              emptyLabel="Country distribution appears after buyers link business metadata."
              items={buyerDiversity.countries}
            />
            <BreakdownList
              title="Buyer categories"
              emptyLabel="Category distribution appears after buyers link business metadata."
              items={buyerDiversity.categories}
            />
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top buyers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {buyerDiversity.topBuyers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Top buyers will appear once orders are placed.</p>
                ) : (
                  buyerDiversity.topBuyers.map((buyer) => (
                    <div key={buyer.name} className="rounded-lg border p-3">
                      <div className="font-medium">{buyer.name}</div>
                      <div className="mt-1 flex items-center justify-between text-sm text-muted-foreground">
                        <span>{buyer.orderCount} orders</span>
                        <span>{currency(buyer.revenue)}</span>
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
          <CardTitle>Methodology Note</CardTitle>
          <CardDescription>
            This report is generated from first-party AfriConnect marketplace activity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Transaction volume is based on seller orders linked to settled platform payments.</p>
          <p>Fulfillment uses order status and payout outcomes as operational performance signals.</p>
          <p>Buyer diversity is based on linked buyer business records, so incomplete buyer metadata lowers coverage.</p>
        </CardContent>
      </Card>
    </div>
  );
}
