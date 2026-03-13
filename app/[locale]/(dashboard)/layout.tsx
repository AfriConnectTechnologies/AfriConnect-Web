"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import { useTranslations, useLocale } from "next-intl";
import { DashboardHeader } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";
import { EmailVerificationBanner } from "@/components/dashboard/email-verification-banner";
import { useWelcomeEmail } from "@/lib/hooks/useWelcomeEmail";
import { ChatProvider } from "@/components/chat";
import { Loader2 } from "lucide-react";

function AuthenticatedDashboard({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  
  useWelcomeEmail(locale);

  return (
    <ChatProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <div className="print:hidden">
          <Sidebar />
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="print:hidden">
            <EmailVerificationBanner />
            <DashboardHeader />
          </div>
          <main className="flex-1 overflow-y-auto dashboard-gradient-bg print:overflow-visible print:p-0 scrollbar-thin">
            <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ChatProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("common");
  
  return (
    <>
      <SignedIn>
        <Authenticated>
          <AuthenticatedDashboard>{children}</AuthenticatedDashboard>
        </Authenticated>
        <Unauthenticated>
          <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">{t("settingUp")}</p>
            </div>
          </div>
        </Unauthenticated>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
