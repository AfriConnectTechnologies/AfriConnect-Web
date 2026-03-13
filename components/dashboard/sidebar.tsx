"use client";

import { useState, useMemo } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { UserButton, useClerk, useUser } from "@clerk/nextjs";
import { Globe2, BarChart3, ShoppingCart, Settings, CreditCard, Menu, Store, Package, ShoppingBag, ChevronLeft, ChevronRight, Building2, Users, Building, Shield, MessageCircle, RefreshCw, Boxes, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { COMMERCE_ENABLED, isComplianceEnabledForEmail } from "@/lib/features";
import { useChatContext } from "@/components/chat/ChatProvider";

type NavItemKey = "dashboard" | "marketplace" | "directory" | "products" | "inventory" | "messages" | "cart" | "orders" | "settings" | "billing" | "myBusiness" | "creditProfile" | "registerBusiness" | "manageUsers" | "manageBusinesses" | "manageProducts" | "manageRefunds" | "compliance";

type NavItem = {
  href: string;
  labelKey: NavItemKey;
  icon: React.ComponentType<{ className?: string }>;
  showBadge?: boolean;
  isCommerce?: boolean;
  group: "main" | "commerce" | "business" | "admin";
};

const mainNavItems: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: BarChart3, group: "main" },
  { href: "/marketplace", labelKey: "marketplace", icon: Store, group: "main" },
  { href: "/directory", labelKey: "directory", icon: Building, group: "main" },
  { href: "/products", labelKey: "products", icon: Package, group: "main" },
  { href: "/messages", labelKey: "messages", icon: MessageCircle, group: "main" },
];

const commerceNavItems: NavItem[] = [
  { href: "/cart", labelKey: "cart", icon: ShoppingCart, showBadge: true, isCommerce: true, group: "commerce" },
  { href: "/orders", labelKey: "orders", icon: ShoppingBag, isCommerce: true, group: "commerce" },
  { href: "/billing", labelKey: "billing", icon: CreditCard, isCommerce: true, group: "commerce" },
];

const sellerNavItems: NavItem[] = [
  { href: "/business/profile", labelKey: "myBusiness", icon: Building2, group: "business" },
  { href: "/business/credit-profile", labelKey: "creditProfile", icon: BarChart3, group: "business" },
  { href: "/inventory", labelKey: "inventory", icon: Boxes, group: "business" },
];

const complianceNavItem: NavItem = {
  href: "/compliance",
  labelKey: "compliance",
  icon: Shield,
  group: "business",
};

const buyerNavItems: NavItem[] = [
  { href: "/business/register", labelKey: "registerBusiness", icon: Building2, group: "business" },
];

const adminNavItems: NavItem[] = [
  { href: "/admin/users", labelKey: "manageUsers", icon: Users, group: "admin" },
  { href: "/admin/businesses", labelKey: "manageBusinesses", icon: Building, group: "admin" },
  { href: "/admin/products", labelKey: "manageProducts", icon: Package, group: "admin" },
  { href: "/admin/refunds", labelKey: "manageRefunds", icon: RefreshCw, group: "admin" },
];

const settingsNavItem: NavItem = {
  href: "/settings",
  labelKey: "settings",
  icon: Settings,
  group: "main",
};

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
      <SheetContent side="left" className="w-72 p-0">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <SheetDescription className="sr-only">Main navigation sidebar</SheetDescription>
        <SidebarContent pathname={pathname} isCollapsed={false} toggleCollapse={() => {}} isMobile={true} />
      </SheetContent>
    </Sheet>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem("sidebar-collapsed");
      return savedState ? JSON.parse(savedState) : false;
    }
    return false;
  });

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
        "hidden shrink-0 border-r md:flex md:flex-col transition-all duration-300 relative group sidebar-gradient",
        isCollapsed ? "w-[68px]" : "w-64"
      )}
    >
      <SidebarContent pathname={pathname} isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} isMobile={false} />
    </aside>
  );
}

function NavGroup({
  label,
  icon: GroupIcon,
  items,
  isCollapsed,
  pathname,
  cartItemCount,
  unreadCount,
  isMobile,
  t,
  tCommon,
}: {
  label?: string;
  icon?: React.ComponentType<{ className?: string }>;
  items: NavItem[];
  isCollapsed: boolean;
  pathname: string;
  cartItemCount: number;
  unreadCount: number;
  isMobile: boolean;
  t: ReturnType<typeof useTranslations>;
  tCommon: ReturnType<typeof useTranslations>;
}) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-1">
      {label && !isCollapsed && (
        <div className="flex items-center gap-2 px-3 py-2 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
          {GroupIcon && <GroupIcon className="h-3 w-3" />}
          <span>{label}</span>
        </div>
      )}
      {isCollapsed && label && (
        <div className="flex justify-center py-1">
          <div className="h-px w-6 bg-border" />
        </div>
      )}
      {items.map((item) => {
        const Icon = item.icon;
        const itemLabel = t(item.labelKey);
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        const showCartBadge = item.showBadge && cartItemCount > 0 && COMMERCE_ENABLED;
        const showMessageBadge = item.labelKey === "messages" && unreadCount > 0;
        const showComingSoon = item.isCommerce && !COMMERCE_ENABLED;
        const badgeCount = item.labelKey === "messages" ? unreadCount : cartItemCount;
        const showBadge = showCartBadge || showMessageBadge;

        const linkContent = (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center rounded-xl text-sm font-medium transition-all duration-200 relative",
              isCollapsed ? "justify-center mx-1 px-2 py-2.5" : "gap-3 mx-2 px-3 py-2.5",
              isActive
                ? "sidebar-active-item text-primary-foreground"
                : "text-muted-foreground hover:bg-accent/80 hover:text-foreground"
            )}
            title={isCollapsed ? itemLabel : undefined}
          >
            <Icon className={cn("h-[18px] w-[18px] shrink-0", isActive && "drop-shadow-sm")} />
            {!isCollapsed && (
              <>
                <span className="truncate">{itemLabel}</span>
                {showComingSoon && (
                  <Badge variant="outline" className="ml-auto h-5 px-1.5 text-[10px] shrink-0 bg-muted/50 border-dashed">
                    {tCommon("soon")}
                  </Badge>
                )}
                {showBadge && !showComingSoon && (
                  <Badge 
                    variant={showMessageBadge ? "destructive" : "secondary"} 
                    className={cn(
                      "ml-auto h-5 min-w-5 px-1.5 text-xs shrink-0",
                      showMessageBadge && "animate-pulse"
                    )}
                  >
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </Badge>
                )}
              </>
            )}
            {isCollapsed && showBadge && !showComingSoon && (
              <Badge
                variant={showMessageBadge ? "destructive" : "secondary"}
                className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] shrink-0"
              >
                {badgeCount > 9 ? "9+" : badgeCount}
              </Badge>
            )}
          </Link>
        );

        return <div key={item.href}>{linkContent}</div>;
      })}
    </div>
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
  const { openUserProfile, signOut } = useClerk();
  const { user } = useUser();
  const cart = useQuery(api.cart.get);
  const currentUser = useQuery(api.users.getCurrentUser);
  const myBusiness = useQuery(api.businesses.getMyBusiness);
  const { unreadCount } = useChatContext();
  const cartItemCount = cart?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const [isMobileAccountMenuOpen, setIsMobileAccountMenuOpen] = useState(false);
  const userEmail = currentUser?.email || user?.primaryEmailAddress?.emailAddress;
  const isComplianceEnabled = isComplianceEnabledForEmail(userEmail);

  const { businessItems, showAdmin } = useMemo(() => {
    const role = currentUser?.role;
    const hasBusiness = currentUser?.businessId !== undefined && currentUser?.businessId !== null;
    const isEmailVerified = currentUser?.emailVerified ?? false;
    const isBusinessVerified = myBusiness?.verificationStatus === "verified";
    const canAccessCompliance = hasBusiness && isEmailVerified && isBusinessVerified;
    const items: NavItem[] = [];

    if (hasBusiness) {
      items.push(...sellerNavItems);
    }

    if (canAccessCompliance && isComplianceEnabled) {
      items.push(complianceNavItem);
    }

    if (role === "buyer" || (!hasBusiness && role !== "admin")) {
      items.push(...buyerNavItems);
    }

    return {
      businessItems: items,
      showAdmin: role === "admin",
    };
  }, [
    currentUser?.role,
    currentUser?.businessId,
    currentUser?.emailVerified,
    myBusiness?.verificationStatus,
    isComplianceEnabled,
  ]);

  const displayName = currentUser?.name || user?.fullName || user?.firstName || "User";

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const commonNavProps = {
    isCollapsed,
    pathname,
    cartItemCount,
    unreadCount,
    isMobile,
    t,
    tCommon,
  };

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn(
        "flex h-16 items-center border-b",
        isCollapsed ? "justify-center px-2" : "px-5"
      )}>
        <Link
          href="/"
          className="flex items-center gap-2.5 cursor-pointer group/logo"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shrink-0 shadow-sm transition-transform group-hover/logo:scale-105">
            <Globe2 className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-tight">AfriConnect</span>
              <span className="text-[10px] text-muted-foreground/60 font-medium leading-tight">Trade Platform</span>
            </div>
          )}
        </Link>
      </div>
      
      {/* Collapse toggle */}
      {!isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-20 z-20 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-accent hidden group-hover:flex items-center justify-center transition-all"
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

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-2 overflow-y-auto scrollbar-thin">
        <NavGroup
          items={mainNavItems}
          {...commonNavProps}
        />

        <NavGroup
          label={tCommon("commerce") ?? "Commerce"}
          icon={ShoppingCart}
          items={commerceNavItems}
          {...commonNavProps}
        />

        {businessItems.length > 0 && (
          <NavGroup
            label={tCommon("business") ?? "Business"}
            icon={Building2}
            items={businessItems}
            {...commonNavProps}
          />
        )}

        {showAdmin && (
          <NavGroup
            label={tCommon("admin")}
            icon={Shield}
            items={adminNavItems}
            {...commonNavProps}
          />
        )}

        <div className={cn("pt-1", isCollapsed ? "px-1" : "px-2")}>
          <NavGroup
            items={[settingsNavItem]}
            {...commonNavProps}
          />
        </div>
      </nav>

      {/* User section */}
      <div className="border-t p-3">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 rounded-xl p-2 hover:bg-accent/50 transition-colors">
            {isMobile ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 p-0"
                onClick={() => setIsMobileAccountMenuOpen((open) => !open)}
                aria-expanded={isMobileAccountMenuOpen}
                aria-label="Account menu"
              >
                <Avatar className="h-10 w-10 border-2 border-primary/10">
                  <AvatarImage src={user?.imageUrl} alt={displayName} />
                  <AvatarFallback className="bg-primary/5 text-primary text-sm font-semibold">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            ) : (
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <UserButton />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{displayName}</p>
                  {currentUser?.role && (
                    <p className="text-[11px] text-muted-foreground capitalize">{currentUser.role}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center">
            {isMobile ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 p-0"
                onClick={() => setIsMobileAccountMenuOpen((open) => !open)}
                aria-expanded={isMobileAccountMenuOpen}
                aria-label="Account menu"
              >
                <Avatar className="h-9 w-9 border-2 border-primary/10">
                  <AvatarImage src={user?.imageUrl} alt={displayName} />
                  <AvatarFallback className="bg-primary/5 text-primary text-xs font-semibold">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            ) : (
              <UserButton />
            )}
          </div>
        )}
        {isMobile && isMobileAccountMenuOpen && (
          <div className="mt-3 flex flex-col gap-2 px-2">
            <SheetClose asChild>
              <Button
                variant="outline"
                className="w-full justify-start rounded-xl"
                onClick={() => {
                  setIsMobileAccountMenuOpen(false);
                  openUserProfile();
                }}
              >
                Manage Account
              </Button>
            </SheetClose>
            <SheetClose asChild>
              <Button
                variant="ghost"
                className="w-full justify-start rounded-xl text-destructive hover:text-destructive"
                onClick={() => {
                  setIsMobileAccountMenuOpen(false);
                  signOut({ redirectUrl: "/" });
                }}
              >
                Sign Out
              </Button>
            </SheetClose>
          </div>
        )}
      </div>
    </div>
  );
}
