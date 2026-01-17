"use client";

import { Link } from "@/i18n/navigation";
import { MobileSidebarTrigger } from "./sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { BarChart3 } from "lucide-react";

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <MobileSidebarTrigger />
      <Link href="/" className="flex items-center gap-2 md:hidden cursor-pointer">
        <BarChart3 className="h-5 w-5" />
        <span className="font-semibold">AfriConnect</span>
      </Link>
      <div className="flex-1" />
      <LanguageSwitcher />
      <ThemeToggle />
    </header>
  );
}

