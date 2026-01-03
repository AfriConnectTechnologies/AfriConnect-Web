"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { BarChart3, ShoppingCart, Settings, CreditCard, Menu, Store, Package, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/products", label: "My Products", icon: Package },
  { href: "/cart", label: "Cart", icon: ShoppingCart, showBadge: true },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/billing", label: "Billing", icon: CreditCard },
];

export function MobileSidebarTrigger() {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SidebarContent pathname={pathname} isCollapsed={false} toggleCollapse={() => {}} isMobile={true} />
      </SheetContent>
    </Sheet>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  
  // Load collapsed state from localStorage using lazy initialization
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem("sidebar-collapsed");
      return savedState ? JSON.parse(savedState) : false;
    }
    return false;
  });

  // Save collapsed state to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar-collapsed", JSON.stringify(newState));
    }
  };

  return (
    <aside
      className={cn(
        "hidden shrink-0 border-r bg-card md:flex md:flex-col transition-all duration-300 relative group",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <SidebarContent pathname={pathname} isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} isMobile={false} />
    </aside>
  );
}

function SidebarContent({
  pathname,
  isCollapsed,
  toggleCollapse,
  isMobile = false,
}: {
  pathname: string;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  isMobile?: boolean;
}) {
  const cart = useQuery(api.cart.get);
  const cartItemCount = cart?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-16 items-center border-b", isCollapsed ? "justify-center" : "px-6")}>
        <Link
          href="/"
          className="flex items-center gap-2 cursor-pointer"
        >
          <BarChart3 className="h-6 w-6 shrink-0" />
          {!isCollapsed && <span className="text-lg font-bold">OrderFlow</span>}
        </Link>
      </div>
      
      {!isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-20 z-20 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-accent hidden group-hover:flex items-center justify-center"
          onClick={toggleCollapse}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      )}

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const showBadge = item.showBadge && cartItemCount > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-lg text-sm font-medium transition-colors relative",
                isCollapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="truncate">{item.label}</span>
                  {showBadge && (
                    <Badge variant="secondary" className="ml-auto h-5 min-w-5 px-1.5 text-xs shrink-0">
                      {cartItemCount}
                    </Badge>
                  )}
                </>
              )}
              {isCollapsed && showBadge && (
                <Badge
                  variant="secondary"
                  className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-xs shrink-0"
                >
                  {cartItemCount}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
          {!isCollapsed && <span className="text-sm text-muted-foreground">Account</span>}
          <UserButton />
        </div>
      </div>
    </div>
  );
}

