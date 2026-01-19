"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Globe2, Shield, Database, Eye, Share2, Lock, UserCheck, Cookie, Clock, Globe, Mail, Scale } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function PrivacyPolicyPage() {
  const t = useTranslations("legal");
  const tLanding = useTranslations("landing");

  const sections = [
    { id: "collection", icon: Database, titleKey: "privacy.collection.title", contentKey: "privacy.collection.content" },
    { id: "usage", icon: Eye, titleKey: "privacy.usage.title", contentKey: "privacy.usage.content" },
    { id: "sharing", icon: Share2, titleKey: "privacy.sharing.title", contentKey: "privacy.sharing.content" },
    { id: "security", icon: Lock, titleKey: "privacy.security.title", contentKey: "privacy.security.content" },
    { id: "rights", icon: UserCheck, titleKey: "privacy.rights.title", contentKey: "privacy.rights.content" },
    { id: "cookies", icon: Cookie, titleKey: "privacy.cookies.title", contentKey: "privacy.cookies.content" },
    { id: "retention", icon: Clock, titleKey: "privacy.retention.title", contentKey: "privacy.retention.content" },
    { id: "international", icon: Globe, titleKey: "privacy.international.title", contentKey: "privacy.international.content" },
    { id: "children", icon: Shield, titleKey: "privacy.children.title", contentKey: "privacy.children.content" },
    { id: "changes", icon: Mail, titleKey: "privacy.changes.title", contentKey: "privacy.changes.content" },
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
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                {t("backToHome")}
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Page Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-6">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {t("privacy.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("privacy.lastUpdated")}: {t("privacy.lastUpdatedDate")}
            </p>
          </div>

          {/* Compliance Notice */}
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 shrink-0">
                  <Scale className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold mb-2">{t("privacy.compliance.title")}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t("privacy.compliance.content")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Introduction */}
          <Card className="mb-8">
            <CardContent className="p-6 md:p-8">
              <p className="text-muted-foreground leading-relaxed">
                {t("privacy.introduction")}
              </p>
            </CardContent>
          </Card>

          {/* Table of Contents */}
          <Card className="mb-8">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-lg font-semibold mb-4">{t("tableOfContents")}</h2>
              <nav className="grid md:grid-cols-2 gap-2">
                {sections.map((section, index) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors py-1"
                  >
                    <span className="text-primary font-medium">{index + 1}.</span>
                    {t(section.titleKey)}
                  </a>
                ))}
              </nav>
            </CardContent>
          </Card>

          {/* Sections */}
          <div className="space-y-6">
            {sections.map((section, index) => (
              <Card key={section.id} id={section.id} className="scroll-mt-24">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 shrink-0">
                      <section.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold pt-1.5">
                      {index + 1}. {t(section.titleKey)}
                    </h2>
                  </div>
                  <div className="pl-14 prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {t(section.contentKey)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Data Protection Officer */}
          <Card className="mt-8">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-lg font-semibold mb-4">{t("privacy.dpo.title")}</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t("privacy.dpo.content")}
              </p>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">Data Protection Officer</p>
                <p className="text-sm text-muted-foreground">AfriConnect</p>
                <p className="text-sm text-muted-foreground">Email: sw.minasefikadu@gmail.com</p>
              </div>
            </CardContent>
          </Card>

          {/* Related Links */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/terms">
              <Button variant="outline" className="gap-2 w-full sm:w-auto">
                <Scale className="h-4 w-4" />
                {t("viewTermsOfService")}
              </Button>
            </Link>
            <Link href="/">
              <Button className="gap-2 w-full sm:w-auto">
                <ArrowLeft className="h-4 w-4" />
                {t("backToHome")}
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AfriConnect. {tLanding("footer.allRightsReserved")}
          </p>
        </div>
      </footer>
    </div>
  );
}
