"use client";

import { Link } from "@/i18n/navigation";
import { MobileSidebarTrigger } from "./sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Globe2, MessageCircle, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useChatContext } from "@/components/chat";

function MessageNotification() {
  const { unreadCount, isConnected } = useChatContext();

  if (!isConnected) return null;

  return (
    <Link href="/messages">
      <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl hover:bg-accent/80">
        <MessageCircle className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
        <span className="sr-only">Messages</span>
      </Button>
    </Link>
  );
}

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b header-glass px-4 md:px-6">
      <MobileSidebarTrigger />
      <Link href="/" className="flex items-center gap-2 md:hidden cursor-pointer">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-sm">
          <Globe2 className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-bold text-sm">AfriConnect</span>
      </Link>
      <div className="flex-1" />
      <div className="flex items-center gap-1">
        <MessageNotification />
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
