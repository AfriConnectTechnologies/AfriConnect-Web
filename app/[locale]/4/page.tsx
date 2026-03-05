"use client";

import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Globe2,
  Shield,
  Store,
  Building2,
  BadgeCheck,
  Languages,
  Users,
  Package,
  ShoppingCart,
  Menu,
  ArrowDown,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

function FadeUp({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function AmbientBlob({ className = "", delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute rounded-full pointer-events-none animate-morph ${className}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 1.5, delay, ease: [0.25, 1, 0.5, 1] }}
    />
  );
}

export default function LandingVariant4() {
  const t = useTranslations("landing");
  const scrollRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: scrollRef, offset: ["start start", "end end"] });
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const features = [
    { icon: Store, titleKey: "features.marketplace", descKey: "features.marketplaceDesc" },
    { icon: Building2, titleKey: "features.directory", descKey: "features.directoryDesc" },
    { icon: BadgeCheck, titleKey: "features.verification", descKey: "features.verificationDesc" },
    { icon: Shield, titleKey: "features.securePayments", descKey: "features.securePaymentsDesc" },
    { icon: Languages, titleKey: "features.multiLanguage", descKey: "features.multiLanguageDesc" },
    { icon: Users, titleKey: "features.community", descKey: "features.communityDesc" },
  ];

  const steps = [
    { num: "01", titleKey: "howItWorks.step1Title", descKey: "howItWorks.step1Desc", icon: Users },
    { num: "02", titleKey: "howItWorks.step2Title", descKey: "howItWorks.step2Desc", icon: Building2 },
    { num: "03", titleKey: "howItWorks.step3Title", descKey: "howItWorks.step3Desc", icon: Package },
    { num: "04", titleKey: "howItWorks.step4Title", descKey: "howItWorks.step4Desc", icon: ShoppingCart },
  ];

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;1,6..72,400&family=Figtree:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style>{`
        .font-display { font-family: 'Newsreader', Georgia, serif; }
        .font-body { font-family: 'Figtree', system-ui, sans-serif; }
      `}</style>

      {/* Scroll progress bar */}
      <motion.div className="fixed top-0 left-0 right-0 h-0.5 bg-primary z-[60] origin-left" style={{ width: progressWidth }} />

      <div ref={scrollRef} className="font-body flex min-h-screen flex-col bg-background text-foreground">
        {/* Floating Header */}
        <header className="fixed top-2 left-4 right-4 z-50">
          <nav className="mx-auto max-w-6xl bg-background/80 backdrop-blur-md border border-border rounded-2xl flex h-14 items-center justify-between px-5">
            <Link href="/" className="flex items-center gap-2">
              <Globe2 className="h-5 w-5 text-primary" />
              <span className="font-display text-base font-medium">AfriConnect</span>
            </Link>

            <div className="hidden md:flex items-center gap-7">
              <Link href="/explore" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("nav.marketplace")}</Link>
              <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("nav.pricing")}</Link>
              <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("nav.features")}</Link>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
              <SignedOut>
                <SignInButton mode="modal"><Button variant="ghost" size="sm" className="text-sm">{t("nav.signIn")}</Button></SignInButton>
                <SignInButton mode="modal"><Button size="sm" className="text-sm rounded-xl">{t("nav.getStarted")}</Button></SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard"><Button variant="ghost" size="sm">{t("nav.dashboard")}</Button></Link>
                <UserButton />
              </SignedIn>
            </div>

            <div className="flex sm:hidden items-center gap-1">
              <LanguageSwitcher />
              <ThemeToggle />
              <Sheet>
                <SheetTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9"><Menu className="h-5 w-5" /></Button></SheetTrigger>
                <SheetContent side="right" className="w-72 p-6">
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                  <nav className="flex flex-col gap-5 mt-8">
                    <Link href="/explore" className="font-display text-xl">{t("nav.marketplace")}</Link>
                    <Link href="/pricing" className="font-display text-xl">{t("nav.pricing")}</Link>
                    <div className="mt-6">
                      <SignedOut><SignInButton mode="modal"><Button className="w-full rounded-xl">{t("nav.getStarted")}</Button></SignInButton></SignedOut>
                      <SignedIn><Link href="/dashboard"><Button className="w-full rounded-xl">{t("nav.dashboard")}</Button></Link></SignedIn>
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </nav>
        </header>

        {/* Hero - Full viewport, centered, ambient blobs */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6">
          <AmbientBlob className="w-[500px] h-[500px] bg-primary/[0.06] dark:bg-primary/[0.1] -top-20 -left-40 blur-3xl" delay={0.2} />
          <AmbientBlob className="w-[400px] h-[400px] bg-accent/[0.08] dark:bg-accent/[0.12] -bottom-20 -right-20 blur-3xl" delay={0.5} />
          <AmbientBlob className="w-[250px] h-[250px] bg-primary/[0.05] dark:bg-primary/[0.08] top-1/3 right-1/4 blur-2xl" delay={0.8} />

          <div className="text-center max-w-4xl relative z-10">
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
              className="text-sm font-medium tracking-widest uppercase text-primary mb-6"
            >
              {t("hero.badge")}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-[clamp(3rem,8vw,7rem)] font-light leading-[0.95] tracking-tight mb-8"
            >
              Trade across
              <br />
              <span className="italic text-primary font-normal">Africa</span>, reimagined
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease: [0.25, 1, 0.5, 1] }}
              className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-10"
            >
              {t("hero.description")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.65, ease: [0.25, 1, 0.5, 1] }}
              className="flex flex-wrap items-center justify-center gap-4 mb-16"
            >
              <SignedOut>
                <SignInButton mode="modal">
                  <Button size="lg" className="gap-2 font-medium rounded-xl px-8">{t("hero.getStarted")} <ArrowRight className="h-4 w-4" /></Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/marketplace">
                  <Button size="lg" className="gap-2 font-medium rounded-xl px-8">{t("hero.browseMarketplace")} <ArrowRight className="h-4 w-4" /></Button>
                </Link>
              </SignedIn>
              <Link href="/explore">
                <Button size="lg" variant="outline" className="font-medium rounded-xl px-8">{t("hero.exploreProducts")}</Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.2 }}
              className="flex justify-center"
            >
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowDown className="h-5 w-5 text-muted-foreground/50" />
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features - Alternating Left/Right */}
        <section id="features" className="py-24 lg:py-32">
          <div className="mx-auto max-w-6xl px-6">
            <FadeUp>
              <div className="text-center mb-20">
                <p className="text-sm font-medium tracking-widest uppercase text-primary mb-4">Capabilities</p>
                <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] font-light leading-tight">
                  {t("features.title")}
                </h2>
              </div>
            </FadeUp>

            <div className="space-y-20 lg:space-y-28">
              {features.map((feature, i) => {
                const isEven = i % 2 === 0;
                return (
                  <FadeUp key={feature.titleKey} delay={0.1}>
                    <div className={`grid lg:grid-cols-2 gap-10 lg:gap-20 items-center ${isEven ? "" : "lg:direction-rtl"}`}>
                      <div className={isEven ? "" : "lg:order-2 lg:text-right"}>
                        <div className={`flex items-center gap-3 mb-4 ${isEven ? "" : "lg:justify-end"}`}>
                          <div className="h-10 w-10 rounded-xl bg-primary/8 dark:bg-primary/12 flex items-center justify-center">
                            <feature.icon className="h-5 w-5 text-primary" />
                          </div>
                          <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">0{i + 1}</span>
                        </div>
                        <h3 className="font-display text-2xl lg:text-3xl font-normal mb-4">{t(feature.titleKey)}</h3>
                        <p className="text-muted-foreground leading-relaxed max-w-md">{t(feature.descKey)}</p>
                      </div>
                      <div className={isEven ? "lg:order-2" : ""}>
                        <div className="aspect-[4/3] bg-muted/40 dark:bg-muted/20 rounded-2xl border border-border/50 flex items-center justify-center">
                          <feature.icon className="h-16 w-16 text-primary/15 dark:text-primary/20" />
                        </div>
                      </div>
                    </div>
                  </FadeUp>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works - Vertical Timeline */}
        <section className="py-24 lg:py-32 bg-primary/[0.03] dark:bg-primary/[0.05] relative overflow-hidden">
          <AmbientBlob className="w-[350px] h-[350px] bg-primary/[0.04] dark:bg-primary/[0.08] top-20 -right-40 blur-3xl" delay={0} />

          <div className="mx-auto max-w-5xl px-6 relative z-10">
            <FadeUp>
              <div className="text-center mb-20">
                <p className="text-sm font-medium tracking-widest uppercase text-primary mb-4">How it works</p>
                <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] font-light leading-tight">
                  {t("howItWorks.title")}
                </h2>
              </div>
            </FadeUp>

            <div className="relative">
              {/* Timeline line */}
              <div className="hidden md:block absolute left-1/2 -translate-x-px top-0 bottom-0 w-px bg-border" />

              <div className="space-y-16 md:space-y-0">
                {steps.map((step, i) => {
                  const isLeft = i % 2 === 0;
                  return (
                    <FadeUp key={step.num} delay={i * 0.1}>
                      <div className="md:grid md:grid-cols-2 md:gap-16 relative md:py-12">
                        {/* Timeline dot */}
                        <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shadow-sm">
                            {step.num}
                          </div>
                        </div>

                        <div className={isLeft ? "md:text-right md:pr-12" : "md:col-start-2 md:pl-12"}>
                          {!isLeft && <div className="hidden md:block" />}
                          <div className="md:hidden flex items-center gap-3 mb-3">
                            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                              {step.num}
                            </div>
                          </div>
                          <h3 className="font-display text-xl lg:text-2xl font-normal mb-3">{t(step.titleKey)}</h3>
                          <p className="text-muted-foreground leading-relaxed">{t(step.descKey)}</p>
                        </div>
                        {isLeft && <div className="hidden md:block" />}
                      </div>
                    </FadeUp>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* CTA - Immersive, Full Width */}
        <section className="relative py-32 lg:py-44 overflow-hidden">
          <AmbientBlob className="w-[600px] h-[600px] bg-primary/[0.06] dark:bg-primary/[0.1] -top-40 left-1/2 -translate-x-1/2 blur-3xl" delay={0} />

          <div className="mx-auto max-w-4xl px-6 text-center relative z-10">
            <FadeUp>
              <h2 className="font-display text-[clamp(2.5rem,6vw,5rem)] font-light leading-[0.95] tracking-tight mb-8">
                {t("cta.title")}
              </h2>
              <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed mb-10">
                {t("cta.description")}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <SignedOut>
                  <SignInButton mode="modal">
                    <Button size="lg" className="gap-2 font-medium rounded-xl px-8">{t("cta.createAccount")} <ArrowRight className="h-4 w-4" /></Button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard">
                    <Button size="lg" className="gap-2 font-medium rounded-xl px-8">{t("cta.goToDashboard")} <ArrowRight className="h-4 w-4" /></Button>
                  </Link>
                </SignedIn>
                <Link href="/explore">
                  <Button size="lg" variant="outline" className="font-medium rounded-xl px-8">{t("cta.explore")}</Button>
                </Link>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid md:grid-cols-4 gap-10">
              <div>
                <Link href="/" className="flex items-center gap-2 mb-4">
                  <Globe2 className="h-4 w-4 text-primary" />
                  <span className="font-display text-base font-medium">AfriConnect</span>
                </Link>
                <p className="text-sm text-muted-foreground leading-relaxed">{t("footer.tagline")}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-4">{t("footer.marketplace")}</h4>
                <ul className="space-y-2.5 text-sm">
                  <li><Link href="/explore" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.browseProducts")}</Link></li>
                  <li><Link href="#categories" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.categories")}</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-4">{t("footer.forBusinesses")}</h4>
                <ul className="space-y-2.5 text-sm">
                  <li><Link href="/business/register" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.registerBusiness")}</Link></li>
                  <li><Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.dashboard")}</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-4">{t("footer.legal")}</h4>
                <ul className="space-y-2.5 text-sm">
                  <li><Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.privacyPolicy")}</Link></li>
                  <li><Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.termsOfService")}</Link></li>
                </ul>
              </div>
            </div>
            <div className="mt-14 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
              <span>© {new Date().getFullYear()} AfriConnect. {t("footer.allRightsReserved")}</span>
              <span className="flex items-center gap-1.5"><Globe2 className="h-3 w-3" />{t("footer.madeForAfrica")}</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
