"use client";

import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowRight, 
  Globe2, 
  Shield, 
  Package, 
  Users,
  ShoppingCart,
  Building2,
  Boxes,
  Leaf,
  Gem,
  Cpu,
  Shirt,
  Utensils,
  Hammer,
  CheckCircle2,
  Sparkles,
  Store,
  Languages,
  BadgeCheck,
  Menu,
  LogIn,
  LayoutDashboard,
  Compass
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { OrganizationJsonLd, WebsiteJsonLd } from "@/components/seo/JsonLd";

export default function LandingPage() {
  const t = useTranslations("landing");

  const features = [
    {
      icon: Store,
      titleKey: "features.marketplace",
      descKey: "features.marketplaceDesc",
    },
    {
      icon: Building2,
      titleKey: "features.directory",
      descKey: "features.directoryDesc",
    },
    {
      icon: BadgeCheck,
      titleKey: "features.verification",
      descKey: "features.verificationDesc",
    },
    {
      icon: Shield,
      titleKey: "features.securePayments",
      descKey: "features.securePaymentsDesc",
    },
    {
      icon: Languages,
      titleKey: "features.multiLanguage",
      descKey: "features.multiLanguageDesc",
    },
    {
      icon: Users,
      titleKey: "features.community",
      descKey: "features.communityDesc",
    },
  ];

  const categories = [
    { icon: Boxes, nameKey: "categories.rawMaterials" },
    { icon: Leaf, nameKey: "categories.agriculture" },
    { icon: Gem, nameKey: "categories.miningMinerals" },
    { icon: Cpu, nameKey: "categories.electronics" },
    { icon: Shirt, nameKey: "categories.textilesFashion" },
    { icon: Utensils, nameKey: "categories.foodBeverages" },
    { icon: Hammer, nameKey: "categories.construction" },
    { icon: Building2, nameKey: "categories.industrialEquipment" },
  ];

  const steps = [
    {
      step: "01",
      titleKey: "howItWorks.step1Title",
      descKey: "howItWorks.step1Desc",
      icon: Users,
    },
    {
      step: "02",
      titleKey: "howItWorks.step2Title",
      descKey: "howItWorks.step2Desc",
      icon: Building2,
    },
    {
      step: "03",
      titleKey: "howItWorks.step3Title",
      descKey: "howItWorks.step3Desc",
      icon: Package,
    },
    {
      step: "04",
      titleKey: "howItWorks.step4Title",
      descKey: "howItWorks.step4Desc",
      icon: ShoppingCart,
    },
  ];

  const benefits = [
    { key: "benefits.item1", icon: CheckCircle2 },
    { key: "benefits.item2", icon: CheckCircle2 },
    { key: "benefits.item3", icon: CheckCircle2 },
    { key: "benefits.item4", icon: CheckCircle2 },
  ];

  return (
    <>
      {/* Structured Data for SEO */}
      <OrganizationJsonLd 
        sameAs={[
          'https://twitter.com/africonnect',
          'https://linkedin.com/company/africonnect',
          'https://facebook.com/africonnect',
        ]}
      />
      <WebsiteJsonLd />
      
      <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <nav className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 cursor-pointer shrink-0">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-primary">
              <Globe2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tight">AfriConnect</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/explore" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t("nav.marketplace")}
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t("nav.pricing")}
            </Link>
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t("nav.features")}
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t("nav.howItWorks")}
            </Link>
          </div>
          
          {/* Desktop Controls */}
          <div className="hidden sm:flex items-center gap-2 md:gap-3">
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
          
          {/* Mobile Controls */}
          <div className="flex sm:hidden items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 p-0">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="p-4 border-b">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                        <Globe2 className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <span className="text-lg font-bold">AfriConnect</span>
                    </div>
                  </div>
                  
                  {/* Navigation Links */}
                  <nav className="flex-1 p-3">
                    <div className="flex flex-col gap-1">
                      <Link 
                        href="/explore" 
                        className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors"
                      >
                        <Compass className="h-4 w-4 text-muted-foreground" />
                        {t("nav.marketplace")}
                      </Link>
                      <Link 
                        href="/pricing" 
                        className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors"
                      >
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        {t("nav.pricing")}
                      </Link>
                      <Link 
                        href="#features" 
                        className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors"
                      >
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                        {t("nav.features")}
                      </Link>
                      <Link 
                        href="#how-it-works" 
                        className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors"
                      >
                        <Package className="h-4 w-4 text-muted-foreground" />
                        {t("nav.howItWorks")}
                      </Link>
                    </div>
                  </nav>
                  
                  {/* Auth Section - Fixed at bottom */}
                  <div className="p-4 border-t bg-muted/30">
                    <SignedOut>
                      <div className="flex flex-col gap-2">
                        <SignInButton mode="modal">
                          <Button variant="outline" className="w-full gap-2">
                            <LogIn className="h-4 w-4" />
                            Log In
                          </Button>
                        </SignInButton>
                        <SignInButton mode="modal">
                          <Button className="w-full gap-2">
                            <Users className="h-4 w-4" />
                            Sign Up
                          </Button>
                        </SignInButton>
                      </div>
                    </SignedOut>
                    <SignedIn>
                      <div className="flex items-center gap-3 mb-3 pb-3 border-b">
                        <UserButton 
                          appearance={{
                            elements: {
                              avatarBox: "h-10 w-10"
                            }
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">My Account</p>
                          <p className="text-xs text-muted-foreground">Manage profile</p>
                        </div>
                      </div>
                      <Link href="/dashboard">
                        <Button className="w-full gap-2">
                          <LayoutDashboard className="h-4 w-4" />
                          Go to Dashboard
                        </Button>
                      </Link>
                    </SignedIn>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 min-h-[90vh] flex items-center hero-gradient pattern-overlay overflow-hidden">
        {/* Floating decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="floating-shape floating-shape-1 top-20 left-[10%] w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="floating-shape floating-shape-2 top-40 right-[15%] w-48 h-48 rounded-full bg-accent/10 blur-2xl" />
          <div className="floating-shape floating-shape-3 bottom-32 left-[20%] w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
          
          {/* Geometric shapes */}
          <div className="absolute top-32 right-[10%] w-20 h-20 border-2 border-primary/10 rounded-xl rotate-12 animate-float-slow" />
          <div className="absolute bottom-48 right-[25%] w-12 h-12 bg-accent/10 rounded-lg rotate-45 animate-float-reverse" />
          <div className="absolute top-1/2 left-[5%] w-8 h-8 border-2 border-accent/20 rounded-full animate-float" />
        </div>

        <div className="container mx-auto px-4 py-16 lg:py-24 relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-4 py-2 rounded-full mb-8 opacity-0 animate-fade-in animation-delay-100">
              <Sparkles className="h-4 w-4" />
              {t("hero.badge")}
            </div>
            
            {/* Main Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.1] mb-6 opacity-0 animate-slide-up animation-delay-200">
              {t("hero.title")}{" "}
              <span className="gradient-text">{t("hero.titleHighlight")}</span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 opacity-0 animate-slide-up animation-delay-300">
              {t("hero.description")}
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 opacity-0 animate-slide-up animation-delay-400">
              <SignedOut>
                <SignInButton mode="modal">
                  <Button size="lg" className="gap-2 text-base px-8">
                    {t("hero.getStarted")}
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/marketplace">
                  <Button size="lg" className="gap-2 text-base px-8">
                    {t("hero.browseMarketplace")}
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </SignedIn>
              <Link href="/explore">
                <Button size="lg" variant="outline" className="text-base px-8">
                  {t("hero.exploreProducts")}
                </Button>
              </Link>
            </div>

            {/* Benefits list */}
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 opacity-0 animate-fade-in animation-delay-600">
              {benefits.map((benefit, index) => (
                <div key={benefit.key} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <benefit.icon className="h-4 w-4 text-primary" />
                  <span>{t(benefit.key)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path 
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" 
              className="fill-background"
            />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {t("features.title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("features.description")}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card 
                key={feature.titleKey} 
                className="group transition-all duration-300 hover:shadow-md hover:border-primary/20"
              >
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 transition-colors duration-200 group-hover:bg-primary/15">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{t(feature.titleKey)}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {t(feature.descKey)}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-24 bg-muted/30 pattern-lines">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {t("categories.title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("categories.description")}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
            {categories.map((category) => (
              <Link 
                key={category.nameKey} 
                href="/explore"
                className="group"
              >
                <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-primary/20 cursor-pointer">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 transition-colors duration-200 group-hover:bg-primary/15">
                      <category.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-semibold text-base">{t(category.nameKey)}</h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/explore">
              <Button variant="outline" size="lg" className="gap-2">
                {t("categories.viewAll")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {t("howItWorks.title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("howItWorks.description")}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((item, index) => (
              <div 
                key={item.step} 
                className="relative"
              >
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/40 to-transparent" />
                )}
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center group hover:bg-primary/20 transition-colors">
                      <item.icon className="h-10 w-10 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shadow-lg">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{t(item.titleKey)}</h3>
                  <p className="text-muted-foreground">{t(item.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 pattern-overlay opacity-20" />
        
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-white/5 animate-float-slow" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-white/5 animate-float-reverse" />
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
              {t("cta.title")}
            </h2>
            <p className="text-lg opacity-90 max-w-xl mx-auto mb-10">
              {t("cta.description")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <SignedOut>
                <SignInButton mode="modal">
                  <Button size="lg" variant="secondary" className="gap-2 text-base px-8">
                    {t("cta.createAccount")}
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard">
                  <Button size="lg" variant="secondary" className="gap-2 text-base px-8">
                    {t("cta.goToDashboard")}
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </SignedIn>
              <Link href="/explore">
                <Button size="lg" variant="secondary" className="text-base px-8">
                  {t("cta.explore")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Trust Section */}
      <section className="py-16 bg-muted/30 border-y">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <div className="font-semibold">{t("trust.securePayments")}</div>
                <div className="text-sm text-muted-foreground">{t("trust.securePaymentsDesc")}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BadgeCheck className="h-8 w-8 text-primary" />
              <div>
                <div className="font-semibold">{t("trust.verifiedBusinesses")}</div>
                <div className="text-sm text-muted-foreground">{t("trust.verifiedBusinessesDesc")}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Languages className="h-8 w-8 text-primary" />
              <div>
                <div className="font-semibold">{t("trust.multiLanguage")}</div>
                <div className="text-sm text-muted-foreground">{t("trust.multiLanguageDesc")}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
                <li><Link href="#categories" className="hover:text-foreground transition-colors">{t("footer.categories")}</Link></li>
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
    </>
  );
}
