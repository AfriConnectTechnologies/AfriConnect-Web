"use client";

import { useQuery } from "convex/react";
import { useTranslations, useLocale } from "next-intl";
import { api } from "@/convex/_generated/api";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Loader2, ExternalLink, Shield, Sparkles, Settings, Calendar, ArrowRight } from "lucide-react";
import { COMMERCE_ENABLED } from "@/lib/features";
import { ComingSoonPage } from "@/components/ui/coming-soon";

export default function BillingPage() {
  const t = useTranslations("billing");
  const tCommon = useTranslations("common");
  const tOrders = useTranslations("orders");
  const locale = useLocale();
  
  const payments = useQuery(api.payments.list, COMMERCE_ENABLED ? {} : "skip");
  const subscription = useQuery(api.subscriptions.getCurrentSubscription, COMMERCE_ENABLED ? {} : "skip");

  if (!COMMERCE_ENABLED) {
    return (
      <ComingSoonPage
        title={t("title")}
        description={t("description")}
        icon={<CreditCard className="h-8 w-8 text-primary" />}
      />
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatShortDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getSubscriptionStatusBadge = (status: string, cancelAtPeriodEnd: boolean) => {
    if (cancelAtPeriodEnd) {
      return <Badge variant="destructive" className="rounded-lg">{t("status.cancelsSoon")}</Badge>;
    }
    switch (status) {
      case "active":
        return <Badge className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 rounded-lg">{t("status.active")}</Badge>;
      case "trialing":
        return <Badge variant="secondary" className="rounded-lg">{t("status.trial")}</Badge>;
      case "past_due":
        return <Badge variant="destructive" className="rounded-lg">{t("status.pastDue")}</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="rounded-lg">{t("status.cancelled")}</Badge>;
      default:
        return <Badge variant="outline" className="rounded-lg">{status}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 rounded-lg">{tOrders("completed")}</Badge>;
      case "pending":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 rounded-lg">{tOrders("pending")}</Badge>;
      case "failed":
        return <Badge variant="destructive" className="rounded-lg">{t("failed")}</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="rounded-lg">{tOrders("cancelled")}</Badge>;
      default:
        return <Badge variant="outline" className="rounded-lg">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      {/* Subscription Card */}
      <Card className="border-border/60 rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            Current Subscription
          </CardTitle>
          <CardDescription>Manage your subscription plan and billing</CardDescription>
        </CardHeader>
        <CardContent>
          {subscription === undefined ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : subscription ? (
            <div className="flex items-center justify-between bg-muted/30 rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{subscription.plan?.name ?? "Unknown"} Plan</p>
                    {getSubscriptionStatusBadge(subscription.status, subscription.cancelAtPeriodEnd)}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {subscription.billingCycle === "annual" ? "Annual" : "Monthly"} &middot; Renews {formatShortDate(subscription.currentPeriodEnd)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                {subscription.plan ? (
                  <>
                    <p className="font-bold text-lg">
                      {subscription.plan.currency === "ETB" 
                        ? `${((subscription.billingCycle === "annual" ? (subscription.plan.annualPrice ?? 0) : (subscription.plan.monthlyPrice ?? 0)) / 100).toLocaleString()} ETB`
                        : `$${((subscription.billingCycle === "annual" ? (subscription.plan.annualPrice ?? 0) : (subscription.plan.monthlyPrice ?? 0)) / 100).toFixed(0)}`
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">
                      per {subscription.billingCycle === "annual" ? "year" : "month"}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Price unavailable</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-muted/30 rounded-xl">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 mb-3">
                <Sparkles className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <p className="text-muted-foreground mb-3">No active subscription</p>
              <Button asChild size="sm" className="rounded-xl gap-2">
                <Link href="/pricing">
                  View Plans
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
        {subscription && (
          <CardFooter className="border-t pt-4">
            <Button variant="outline" asChild className="w-full rounded-xl">
              <Link href="/settings/subscription">
                <Settings className="h-4 w-4 mr-2" />
                Manage Subscription
              </Link>
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Payment Method Card */}
      <Card className="border-border/60 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            {t("paymentMethod")}
          </CardTitle>
          <CardDescription>{t("paymentMethodDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
            <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{t("chapaGateway")}</p>
              <p className="text-sm text-muted-foreground">{t("chapaDescription")}</p>
            </div>
            <a 
              href="https://chapa.co" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline text-sm flex items-center gap-1"
            >
              {t("learnMore")}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="border-border/60 rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            {t("paymentHistory")}
          </CardTitle>
          <CardDescription>{t("paymentHistoryDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {payments === undefined ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-3">
                <CreditCard className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-muted-foreground">{t("noPaymentHistory")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-semibold">{t("date")}</TableHead>
                  <TableHead className="font-semibold">{t("reference")}</TableHead>
                  <TableHead className="font-semibold">{t("type")}</TableHead>
                  <TableHead className="font-semibold">{t("amount")}</TableHead>
                  <TableHead className="font-semibold">{tCommon("status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment._id} className="hover:bg-muted/20">
                    <TableCell className="text-sm">{formatDate(payment.createdAt)}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{payment.chapaTransactionRef}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize rounded-lg text-xs">{payment.paymentType}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{payment.currency} {payment.amount.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
