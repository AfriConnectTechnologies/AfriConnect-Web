"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, CreditCard, Loader2, ExternalLink, Shield } from "lucide-react";
import { toast } from "sonner";

const plans = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for getting started",
    price: 0,
    currency: "ETB",
    features: [
      "Up to 50 orders",
      "Basic analytics",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For growing businesses",
    price: 2900,
    currency: "ETB",
    popular: true,
    features: [
      "Unlimited orders",
      "Advanced analytics",
      "Priority support",
      "API access",
      "Custom integrations",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations",
    price: null,
    currency: "ETB",
    features: [
      "Everything in Pro",
      "Dedicated support",
      "Custom SLA",
      "On-premise deployment",
      "Training & onboarding",
    ],
  },
];

export default function BillingPage() {
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const payments = useQuery(api.payments.list, {});

  const handleUpgrade = async (planId: string, price: number) => {
    if (price === 0) return;
    
    setIsProcessing(planId);
    try {
      const response = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: price,
          currency: "ETB",
          paymentType: "subscription",
          metadata: {
            planId,
            type: "subscription_upgrade",
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to initialize payment");
      }

      toast.success("Redirecting to payment...");
      window.location.href = data.checkoutUrl;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to process payment";
      toast.error(errorMessage);
      setIsProcessing(null);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Success</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "cancelled":
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and billing</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>You are currently on the Free plan</CardDescription>
            </div>
            <Badge variant="secondary">Free</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Upgrade to unlock advanced features and higher limits.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className={plan.popular ? "border-primary" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.name}</CardTitle>
                {plan.popular && <Badge variant="default">Popular</Badge>}
              </div>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                {plan.price !== null ? (
                  <>
                    <span className="text-4xl font-bold">
                      {plan.price === 0 ? "$0" : `${plan.price.toLocaleString()} ETB`}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </>
                ) : (
                  <span className="text-4xl font-bold">Custom</span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {plan.id === "free" ? (
                <Button variant="outline" className="w-full" disabled>
                  Current Plan
                </Button>
              ) : plan.price !== null ? (
                <Button 
                  className="w-full gap-2" 
                  onClick={() => handleUpgrade(plan.id, plan.price!)}
                  disabled={isProcessing !== null}
                >
                  {isProcessing === plan.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Upgrade to {plan.name}
                    </>
                  )}
                </Button>
              ) : (
                <Button variant="outline" className="w-full">
                  Contact Sales
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Payment Method Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Payment Method
          </CardTitle>
          <CardDescription>Secure payments powered by Chapa</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Chapa Payment Gateway</p>
              <p className="text-sm text-muted-foreground">
                Pay securely with Mobile Money, Bank Transfer, or Card
              </p>
            </div>
            <a 
              href="https://chapa.co" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline text-sm flex items-center gap-1"
            >
              Learn more
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>View your recent transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {payments === undefined ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No payment history yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment._id}>
                    <TableCell className="text-sm">
                      {formatDate(payment.createdAt)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {payment.chapaTransactionRef}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {payment.paymentType}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {payment.currency} {payment.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(payment.status)}
                    </TableCell>
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
