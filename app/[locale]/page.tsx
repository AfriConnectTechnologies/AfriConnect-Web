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
  Truck, 
  Package, 
  CreditCard, 
  BarChart3,
  Search,
  ShoppingCart,
  FileCheck,
  MapPin,
  Building2,
  Boxes,
  Leaf,
  Gem,
  Cpu,
  Shirt,
  Utensils,
  Hammer
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";

const countries = [
  "Nigeria", "Kenya", "South Africa", "Ghana", "Egypt", 
  "Morocco", "Tanzania", "Ethiopia", "Rwanda", "Senegal",
  "Côte d'Ivoire", "Uganda"
];

export default function LandingPage() {
  const t = useTranslations("landing");

  const stats = [
    { value: "50+", labelKey: "stats.countries" },
    { value: "10K+", labelKey: "stats.suppliers" },
    { value: "$2B+", labelKey: "stats.tradeVolume" },
    { value: "99.5%", labelKey: "stats.deliveryRate" },
  ];

  const features = [
    {
      icon: Search,
      titleKey: "features.discoverSuppliers",
      descKey: "features.discoverSuppliersDesc",
    },
    {
      icon: Shield,
      titleKey: "features.tradeAssurance",
      descKey: "features.tradeAssuranceDesc",
    },
    {
      icon: Truck,
      titleKey: "features.logistics",
      descKey: "features.logisticsDesc",
    },
    {
      icon: CreditCard,
      titleKey: "features.payments",
      descKey: "features.paymentsDesc",
    },
    {
      icon: Package,
      titleKey: "features.inspection",
      descKey: "features.inspectionDesc",
    },
    {
      icon: BarChart3,
      titleKey: "features.analytics",
      descKey: "features.analyticsDesc",
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
      descKey: "howItWorks.step1Description",
      icon: Search,
    },
    {
      step: "02",
      titleKey: "howItWorks.step2Title",
      descKey: "howItWorks.step2Description",
      icon: ShoppingCart,
    },
    {
      step: "03",
      titleKey: "howItWorks.step3Title",
      descKey: "howItWorks.step3Description",
      icon: FileCheck,
    },
    {
      step: "04",
      titleKey: "howItWorks.step4Title",
      descKey: "howItWorks.step4Description",
      icon: MapPin,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <nav className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Globe2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">AfriConnect</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/explore" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t("nav.marketplace")}
            </Link>
            <Link href="#categories" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t("nav.categories")}
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t("nav.howItWorks")}
            </Link>
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t("nav.features")}
            </Link>
          </div>
          <div className="flex items-center gap-3">
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

      {/* Hero Section */}
      <section className="relative pt-16 hero-gradient pattern-overlay overflow-hidden">
        <div className="container mx-auto px-4 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-6 opacity-0 animate-slide-up">
              <div className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-4 py-2 rounded-full w-fit">
                <Globe2 className="h-4 w-4" />
                {t("hero.badge")}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                {t("hero.title")}{" "}
                <span className="text-primary">{t("hero.titleHighlight")}</span>{" "}
                {t("hero.titleEnd")}
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                {t("hero.description")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-2">
                <SignedOut>
                  <SignInButton mode="modal">
                    <Button size="lg" className="gap-2 text-base px-8">
                      {t("hero.startSourcing")}
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
            </div>
            
            {/* Stats Card */}
            <div className="relative opacity-0 animate-slide-up animation-delay-200">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-3xl animate-pulse-glow" />
              <Card className="relative bg-card/80 backdrop-blur-sm border-2 shadow-2xl">
                <CardContent className="p-8">
                  <div className="grid grid-cols-2 gap-8">
                    {stats.map((stat, index) => (
                      <div 
                        key={stat.labelKey} 
                        className={`text-center p-4 rounded-xl ${index % 2 === 0 ? 'bg-primary/5' : 'bg-accent/10'}`}
                      >
                        <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                        <div className="text-sm text-muted-foreground mt-1">{t(stat.labelKey)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 pt-6 border-t">
                    <p className="text-sm text-muted-foreground text-center">
                      {t("hero.trustedBy", { count: countries.length })}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4 justify-center">
                      {countries.slice(0, 6).map((country) => (
                        <span 
                          key={country} 
                          className="text-xs bg-secondary px-3 py-1.5 rounded-full font-medium"
                        >
                          {country}
                        </span>
                      ))}
                      <span className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium">
                        {t("hero.more", { count: countries.length - 6 })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
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

      {/* Categories Section */}
      <section id="categories" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 opacity-0 animate-slide-up">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              {t("categories.title")}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("categories.description")}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
            {categories.map((category, index) => (
              <Link 
                key={category.nameKey} 
                href="/explore"
                className={`group opacity-0 animate-slide-up`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Card className="h-full transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:-translate-y-1 cursor-pointer">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <category.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-semibold text-base">{t(category.nameKey)}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{t("categories.suppliers", { count: "1K" })}</p>
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
      <section id="how-it-works" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 opacity-0 animate-slide-up">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              {t("howItWorks.title")}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("howItWorks.description")}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((item, index) => (
              <div 
                key={item.step} 
                className={`relative opacity-0 animate-slide-up`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/40 to-transparent" />
                )}
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                      <item.icon className="h-10 w-10 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
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

      {/* Features Section */}
      <section id="features" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 opacity-0 animate-slide-up">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              {t("features.title")}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("features.description")}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={feature.titleKey} 
                className={`group transition-all duration-300 hover:shadow-lg hover:border-primary/30 opacity-0 animate-slide-up`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <feature.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
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

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 pattern-overlay opacity-20" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center opacity-0 animate-slide-up">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              {t("cta.title")}
            </h2>
            <p className="mt-6 text-lg opacity-90 max-w-xl mx-auto">
              {t("cta.description")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
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
              <Button size="lg" variant="outline" className="text-base px-8 border-primary-foreground/30 hover:bg-primary-foreground/10">
                {t("cta.talkToSales")}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 bg-muted/30 border-y">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <div className="font-semibold">{t("trust.tradeAssurance")}</div>
                <div className="text-sm text-muted-foreground">{t("trust.paymentProtection")}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Truck className="h-8 w-8 text-primary" />
              <div>
                <div className="font-semibold">{t("trust.globalShipping")}</div>
                <div className="text-sm text-muted-foreground">{t("trust.countriesCovered")}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileCheck className="h-8 w-8 text-primary" />
              <div>
                <div className="font-semibold">{t("trust.verifiedSuppliers")}</div>
                <div className="text-sm text-muted-foreground">{t("trust.sellersVetted")}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-primary" />
              <div>
                <div className="font-semibold">{t("trust.securePayments")}</div>
                <div className="text-sm text-muted-foreground">{t("trust.multipleOptions")}</div>
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
                <li><Link href="#" className="hover:text-foreground transition-colors">{t("footer.verifiedSuppliers")}</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">{t("footer.tradeShows")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t("footer.services")}</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">{t("footer.tradeAssurance")}</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">{t("footer.logistics")}</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">{t("footer.paymentSolutions")}</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">{t("footer.qualityInspection")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t("footer.company")}</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">{t("footer.aboutUs")}</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">{t("footer.careers")}</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">{t("footer.contact")}</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">{t("footer.blog")}</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} AfriConnect. {t("footer.allRightsReserved")}
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">{t("footer.privacyPolicy")}</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">{t("footer.termsOfService")}</Link>
              <Link href="/privacy#cookies" className="hover:text-foreground transition-colors">{t("footer.cookiePolicy")}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
