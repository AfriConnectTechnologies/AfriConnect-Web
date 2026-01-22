"use client";

import { useState, useMemo } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { UserButton } from "@clerk/nextjs";
import { BarChart3, ShoppingCart, Settings, CreditCard, Menu, Store, Package, ShoppingBag, ChevronLeft, ChevronRight, Building2, Users, Building, Shield, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { COMMERCE_ENABLED } from "@/lib/features";
import { useChatContext } from "@/components/chat/ChatProvider";

type NavItemKey = "dashboard" | "marketplace" | "directory" | "products" | "messages" | "cart" | "orders" | "settings" | "billing" | "myBusiness" | "registerBusiness" | "manageUsers" | "manageBusinesses";

type NavItem = {
  href: string;
  labelKey: NavItemKey;
  icon: React.ComponentType<{ className?: string }>;
  showBadge?: boolean;
  isCommerce?: boolean;
};

const baseNavItems: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: BarChart3 },
  { href: "/marketplace", labelKey: "marketplace", icon: Store },
  { href: "/directory", labelKey: "directory", icon: Building },
  { href: "/products", labelKey: "products", icon: Package },
  { href: "/messages", labelKey: "messages", icon: MessageCircle },
  { href: "/cart", labelKey: "cart", icon: ShoppingCart, showBadge: true, isCommerce: true },
  { href: "/orders", labelKey: "orders", icon: ShoppingBag, isCommerce: true },
  { href: "/settings", labelKey: "settings", icon: Settings },
  { href: "/billing", labelKey: "billing", icon: CreditCard, isCommerce: true },
];

const sellerNavItems: NavItem[] = [
  { href: "/business/profile", labelKey: "myBusiness", icon: Building2 },
];

const buyerNavItems: NavItem[] = [
  { href: "/business/register", labelKey: "registerBusiness", icon: Building2 },
];

const adminNavItems: NavItem[] = [
  { href: "/admin/users", labelKey: "manageUsers", icon: Users },
  { href: "/admin/businesses", labelKey: "manageBusinesses", icon: Building },
];

export function MobileSidebarTrigger() {
  const pathname = usePathname();
  const t = useTranslations("navigation");

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">{t("toggleMenu")}</span>
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
  const t = useTranslations("navigation");
  const tCommon = useTranslations("common");
  const cart = useQuery(api.cart.get);
  const currentUser = useQuery(api.users.getCurrentUser);
  const { unreadCount } = useChatContext();
  const cartItemCount = cart?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  // Build nav items based on user role
  const navItems = useMemo(() => {
    const items: NavItem[] = [...baseNavItems];
    const role = currentUser?.role;
    const hasBusiness = currentUser?.businessId !== undefined && currentUser?.businessId !== null;

    // Add seller nav items if user is a seller with a business
    if ((role === "seller" || role === "admin") && hasBusiness) {
      items.push(...sellerNavItems);
    }

    // Add register business option for buyers without a business
    if (role === "buyer" || (!hasBusiness && role !== "admin")) {
      items.push(...buyerNavItems);
    }

    // Add admin nav items if user is an admin
    if (role === "admin") {
      items.push(...adminNavItems);
    }

    return items;
  }, [currentUser?.role, currentUser?.businessId]);

  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-16 items-center border-b", isCollapsed ? "justify-center" : "px-6")}>
        <Link
          href="/"
          className="flex items-center gap-2 cursor-pointer"
        >
          <BarChart3 className="h-6 w-6 shrink-0" />
          {!isCollapsed && <span className="text-lg font-bold">AfriConnect</span>}
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
          <span className="sr-only">{t("toggleSidebar")}</span>
        </Button>
      )}

      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const label = t(item.labelKey);
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const showCartBadge = item.showBadge && cartItemCount > 0 && COMMERCE_ENABLED;
          const showMessageBadge = item.labelKey === "messages" && unreadCount > 0;
          const showComingSoon = item.isCommerce && !COMMERCE_ENABLED;
          const badgeCount = item.labelKey === "messages" ? unreadCount : cartItemCount;
          const showBadge = showCartBadge || showMessageBadge;
          
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
              title={isCollapsed ? label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="truncate">{label}</span>
                  {showComingSoon && (
                    <Badge variant="outline" className="ml-auto h-5 px-1.5 text-[10px] shrink-0 bg-muted">
                      {tCommon("soon")}
                    </Badge>
                  )}
                  {showBadge && !showComingSoon && (
                    <Badge 
                      variant={showMessageBadge ? "destructive" : "secondary"} 
                      className="ml-auto h-5 min-w-5 px-1.5 text-xs shrink-0"
                    >
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </Badge>
                  )}
                </>
              )}
              {isCollapsed && showBadge && !showComingSoon && (
                <Badge
                  variant={showMessageBadge ? "destructive" : "secondary"}
                  className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-xs shrink-0"
                >
                  {badgeCount > 9 ? "9+" : badgeCount}
                </Badge>
              )}
              {isCollapsed && showComingSoon && (
                <Badge
                  variant="outline"
                  className="absolute -top-1 -right-1 h-4 px-1 text-[8px] shrink-0 bg-muted"
                >
                  {tCommon("soon")}
                </Badge>
              )}
            </Link>
          );
        })}

        {/* Admin Section Separator */}
        {currentUser?.role === "admin" && !isCollapsed && (
          <div className="pt-4 mt-4 border-t">
            <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Shield className="h-3 w-3" />
              <span>{tCommon("admin")}</span>
            </div>
          </div>
        )}
      </nav>
      <div className="border-t p-4">
        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">{tCommon("account")}</span>
              {currentUser?.role && (
                <Badge variant="outline" className="text-xs w-fit mt-1">
                  {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
                </Badge>
              )}
            </div>
          )}
          <UserButton />
        </div>
      </div>
    </div>
  );
}
