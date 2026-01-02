"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import { DashboardHeader } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SignedIn>
        <Authenticated>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <DashboardHeader />
              <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
            </div>
          </div>
        </Authenticated>
        <Unauthenticated>
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-muted-foreground">Setting up your account...</div>
          </div>
        </Unauthenticated>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

