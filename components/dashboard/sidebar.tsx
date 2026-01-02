"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { BarChart3, ShoppingCart, Settings, CreditCard, Menu, Store, Package, ShoppingBag } from "lucide-react";
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
        <SidebarContent pathname={pathname} />
      </SheetContent>
    </Sheet>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card md:flex md:flex-col">
      <SidebarContent pathname={pathname} />
    </aside>
  );
}

function SidebarContent({ pathname }: { pathname: string }) {
  const cart = useQuery(api.cart.get);
  const cartItemCount = cart?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <BarChart3 className="h-6 w-6" />
        <span className="text-lg font-bold">OrderFlow</span>
      </div>
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
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
              {showBadge && (
                <Badge variant="secondary" className="ml-auto h-5 min-w-5 px-1.5 text-xs">
                  {cartItemCount}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Account</span>
          <UserButton />
        </div>
      </div>
    </div>
  );
}

