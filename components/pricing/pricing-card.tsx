"use client";

import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface PricingPlan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  targetCustomer?: string;
  monthlyPrice: number; // In cents
  annualPrice: number; // In cents
  currency: string;
  features: string[];
  isPopular?: boolean;
  isEnterprise?: boolean;
}

interface PricingCardProps {
  plan: PricingPlan;
  billingCycle: "monthly" | "annual";
  onSelect: (planId: string, billingCycle: "monthly" | "annual") => void;
  isLoading?: boolean;
  isCurrentPlan?: boolean;
  hasActiveSubscription?: boolean;
}

export function PricingCard({
  plan,
  billingCycle,
  onSelect,
  isLoading,
  isCurrentPlan,
  hasActiveSubscription,
}: PricingCardProps) {
  // Always show monthly rate as the main price
  const monthlyEquivalent = billingCycle === "annual" 
    ? Math.round(plan.annualPrice / 12) 
    : plan.monthlyPrice;
  
  // Format price based on currency
  const formatPrice = (amountInCents: number) => {
    const amount = amountInCents / 100;
    if (plan.currency === "ETB") {
      return `${amount.toLocaleString()} ETB`;
    }
    return `$${amount.toFixed(0)}`;
  };
  
  const priceDisplay = plan.isEnterprise ? "Custom" : formatPrice(monthlyEquivalent);
  const annualTotal = formatPrice(plan.annualPrice);

  return (
    <Card
      className={cn(
        "relative flex flex-col h-full transition-all hover:shadow-lg",
        plan.isPopular && "border-primary shadow-md",
        isCurrentPlan && "ring-2 ring-primary"
      )}
    >
      {plan.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">
            Most Popular
          </Badge>
        </div>
      )}

      {isCurrentPlan && (
        <div className="absolute -top-3 right-4">
          <Badge variant="secondary">Current Plan</Badge>
        </div>
      )}

      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        {plan.targetCustomer && (
          <CardDescription className="text-sm">
            {plan.targetCustomer}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-1 space-y-6">
        {/* Price */}
        <div className="text-center">
          <span className="text-4xl font-bold">{priceDisplay}</span>
          {!plan.isEnterprise && (
            <span className="text-muted-foreground">/mo</span>
          )}
          {!plan.isEnterprise && (
            <p className="text-sm text-muted-foreground mt-1">
              {billingCycle === "annual" 
                ? `Billed annually at ${annualTotal}`
                : "Billed monthly"}
            </p>
          )}
        </div>

        {/* Description */}
        {plan.description && (
          <p className="text-sm text-muted-foreground text-center">
            {plan.description}
          </p>
        )}

        {/* Features */}
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="pt-4">
        <Button
          className="w-full"
          variant={plan.isPopular ? "default" : "outline"}
          size="lg"
          onClick={() => onSelect(plan.id, billingCycle)}
          disabled={isLoading || isCurrentPlan}
        >
          {isCurrentPlan
            ? "Current Plan"
            : plan.isEnterprise
              ? "Contact Sales"
              : isLoading
                ? "Loading..."
                : hasActiveSubscription
                  ? "Switch Plan"
                  : "Get Started"}
        </Button>
      </CardFooter>
    </Card>
  );
}
