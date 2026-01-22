"use client";

import { Link } from "@/i18n/navigation";
import { MobileSidebarTrigger } from "./sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { BarChart3, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useChatContext } from "@/components/chat";

function MessageNotification() {
  const { unreadCount, isConnected } = useChatContext();

  if (!isConnected) return null;

  return (
    <Link href="/messages">
      <Button variant="ghost" size="icon" className="relative">
        <MessageCircle className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs flex items-center justify-center"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
        <span className="sr-only">Messages</span>
      </Button>
    </Link>
  );
}

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <MobileSidebarTrigger />
      <Link href="/" className="flex items-center gap-2 md:hidden cursor-pointer">
        <BarChart3 className="h-5 w-5" />
        <span className="font-semibold">AfriConnect</span>
      </Link>
      <div className="flex-1" />
      <MessageNotification />
      <LanguageSwitcher />
      <ThemeToggle />
    </header>
  );
}

