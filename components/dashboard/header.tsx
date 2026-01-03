"use client";

import Link from "next/link";
import { MobileSidebarTrigger } from "./sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { BarChart3 } from "lucide-react";

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <MobileSidebarTrigger />
      <Link href="/" className="flex items-center gap-2 md:hidden cursor-pointer">
        <BarChart3 className="h-5 w-5" />
        <span className="font-semibold">OrderFlow</span>
      </Link>
      <div className="flex-1" />
      <ThemeToggle />
    </header>
  );
}

