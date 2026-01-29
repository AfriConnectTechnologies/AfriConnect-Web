"use client";

import { useState } from "react";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Link } from "@/i18n/navigation";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Globe2, ArrowLeft, Mail } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { BillingToggle, PricingCard, FeatureComparison } from "@/components/pricing";
import type { PricingPlan } from "@/components/pricing";
import { toast } from "sonner";

export default function PricingPage() {
  const router = useRouter();
  const t = useTranslations("landing");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  // Fetch plans from database
  const dbPlans = useQuery(api.subscriptionPlans.list);

  // Get current subscription if user is logged in
  const currentSubscription = useQuery(api.subscriptions.getCurrentSubscription);

  // Transform database plans to UI format
  const plans: PricingPlan[] = dbPlans
    ? dbPlans.map((plan) => ({
        id: plan._id,
        name: plan.name,
        slug: plan.slug,
        description: plan.description,
        targetCustomer: plan.targetCustomer,
        monthlyPrice: plan.monthlyPrice,
        annualPrice: plan.annualPrice,
        currency: plan.currency,
        features: JSON.parse(plan.features),
        isPopular: plan.isPopular || plan.slug === "growth",
        isEnterprise: plan.slug === "enterprise",
      }))
    : [];

  const handleSelectPlan = async (planId: string, cycle: "monthly" | "annual") => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;

    // Handle enterprise plan - contact sales
    if (plan.isEnterprise) {
      window.location.href = "mailto:sales@africonnect.com?subject=Enterprise%20Plan%20Inquiry";
      return;
    }

    // If user already has an active subscription, go directly to subscription management
    if (currentSubscription && 
        (currentSubscription.status === "active" || currentSubscription.status === "trialing")) {
      router.push("/settings/subscription");
      return;
    }

    setLoadingPlanId(planId);

    try {
      const response = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          billingCycle: cycle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific errors
        if (data.error === "You need to register a business first before subscribing") {
          toast.error("Business Required", {
            description: "You need to register a business before subscribing to a plan.",
            action: {
              label: "Register Business",
              onClick: () => router.push("/business/register"),
            },
          });
          return;
        }
        if (data.error === "Your business already has an active subscription") {
          toast.info("Already Subscribed", {
            description: "You already have an active subscription. Manage it from your settings.",
            action: {
              label: "Manage Subscription",
              onClick: () => router.push("/settings/subscription"),
            },
          });
          return;
        }
        throw new Error(data.error || "Failed to start checkout");
      }

      // Redirect to Chapa checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Checkout Failed", {
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
      });
    } finally {
      setLoadingPlanId(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <nav className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 cursor-pointer shrink-0">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-primary">
              <Globe2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tight">AfriConnect</span>
          </Link>
          <div className="flex items-center gap-2 md:gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm">{t("nav.signIn")}</Button>
              </SignInButton>
              <SignInButton mode="modal">
                <Button size="sm">{t("nav.getStarted")}</Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">{t("nav.dashboard")}</Button>
              </Link>
              <UserButton />
            </SignedIn>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Back Link */}
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Choose the plan that best fits your business needs. All plans include
              access to our B2B marketplace and AfCFTA compliance tools.
            </p>

            {/* Billing Toggle */}
            <BillingToggle
              billingCycle={billingCycle}
              onToggle={setBillingCycle}
              savingsPercent={20}
            />
          </div>

          {/* Pricing Cards */}
          {plans.length === 0 ? (
            <div className="flex items-center justify-center py-24">
              <div className="text-muted-foreground">Loading plans...</div>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto mb-16">
              {plans.map((plan) => (
                <PricingCard
                  key={plan.id}
                  plan={plan}
                  billingCycle={billingCycle}
                  onSelect={handleSelectPlan}
                  isLoading={loadingPlanId === plan.id}
                  isCurrentPlan={currentSubscription?.plan?.slug === plan.slug}
                  hasActiveSubscription={!!(currentSubscription && (currentSubscription.status === "active" || currentSubscription.status === "trialing"))}
                />
              ))}
            </div>
          )}

          {/* Feature Comparison */}
          <div className="mt-20">
            <h2 className="text-2xl font-bold text-center mb-8">
              Compare All Features
            </h2>
            <FeatureComparison />
          </div>

          {/* FAQ Section */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Can I change my plan later?</h3>
                <p className="text-muted-foreground">
                  Yes, you can upgrade or downgrade your plan at any time. When
                  upgrading, you&apos;ll get immediate access to new features. When
                  downgrading, the change will take effect at your next billing cycle.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
                <p className="text-muted-foreground">
                  We accept payments via Chapa, which supports Mobile Money, bank
                  transfers, and card payments. All payments are processed securely.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Is there a free trial?</h3>
                <p className="text-muted-foreground">
                  New businesses can start with our Starter plan to explore the
                  platform. Contact us for enterprise trial options.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">What happens when I reach my limits?</h3>
                <p className="text-muted-foreground">
                  You&apos;ll receive notifications as you approach your plan limits.
                  When you reach a limit, you can upgrade your plan to continue
                  using that feature.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-20 text-center bg-muted/50 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Need a Custom Solution?</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Our Enterprise plan offers custom features, dedicated support, and
              tailored integrations for large organizations.
            </p>
            <Button size="lg" asChild>
              <a href="mailto:sales@africonnect.com">
                <Mail className="mr-2 h-4 w-4" />
                Contact Sales
              </a>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                  <Globe2 className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">AfriConnect</span>
              </Link>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t("footer.tagline")}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t("footer.marketplace")}</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/explore" className="hover:text-foreground transition-colors">{t("footer.browseProducts")}</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground transition-colors">{t("nav.pricing")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t("footer.forBusinesses")}</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/business/register" className="hover:text-foreground transition-colors">{t("footer.registerBusiness")}</Link></li>
                <li><Link href="/products" className="hover:text-foreground transition-colors">{t("footer.listProducts")}</Link></li>
                <li><Link href="/dashboard" className="hover:text-foreground transition-colors">{t("footer.dashboard")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t("footer.legal")}</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">{t("footer.privacyPolicy")}</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">{t("footer.termsOfService")}</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} AfriConnect. {t("footer.allRightsReserved")}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe2 className="h-4 w-4" />
              {t("footer.madeForAfrica")}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
