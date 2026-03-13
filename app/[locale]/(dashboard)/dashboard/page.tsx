"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ShoppingCart, DollarSign, Clock, CheckCircle2, Search, TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { CategoryChips } from "@/components/dashboard/CategoryChips";
import { ProductGrid } from "@/components/dashboard/ProductGrid";

const statConfig = [
  {
    key: "totalOrders" as const,
    icon: ShoppingCart,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-100 dark:border-blue-900/50",
    format: undefined as ((v: number) => string) | undefined,
  },
  {
    key: "totalRevenue" as const,
    icon: DollarSign,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-100 dark:border-emerald-900/50",
    format: ((v: number) => `$${v.toLocaleString()}`) as ((v: number) => string) | undefined,
  },
  {
    key: "pendingOrders" as const,
    icon: Clock,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-100 dark:border-amber-900/50",
    format: undefined as ((v: number) => string) | undefined,
  },
  {
    key: "completedOrders" as const,
    icon: CheckCircle2,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    border: "border-violet-100 dark:border-violet-900/50",
    format: undefined as ((v: number) => string) | undefined,
  },
];

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const tOrders = useTranslations("orders");
  
  const ensureUser = useMutation(api.users.ensureUser);
  const stats = useQuery(api.stats.getDashboardStats);
  
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const products = useQuery(api.products.marketplace, {
    search: debouncedSearch || undefined,
    category: selectedCategory === "all" ? undefined : selectedCategory,
  });

  useEffect(() => {
    ensureUser().catch(() => {});
  }, [ensureUser]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const getStatValue = (key: string) => {
    if (!stats) return null;
    switch (key) {
      case "totalOrders": return stats.totalOrders;
      case "totalRevenue": return stats.totalRevenue;
      case "pendingOrders": return stats.pendingOrders;
      case "completedOrders": return stats.completedOrders;
      default: return 0;
    }
  };

  const getStatLabel = (key: string) => {
    switch (key) {
      case "totalOrders": return t("totalOrders");
      case "totalRevenue": return t("totalRevenue");
      case "pendingOrders": return t("pendingOrders");
      case "completedOrders": return tOrders("completed");
      default: return key;
    }
  };

  return (
    <div className="space-y-8">
      <WelcomeHeader />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statConfig.map((stat) => {
          const Icon = stat.icon;
          const value = getStatValue(stat.key);
          const displayValue = stat.format && value !== null ? stat.format(value) : value;

          return (
            <Card key={stat.key} className={`border ${stat.border} overflow-hidden transition-all hover:shadow-md`}>
              <CardContent className="p-4 md:p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {getStatLabel(stat.key)}
                    </p>
                    {stats === undefined ? (
                      <div className="h-8 w-16 bg-muted rounded-lg animate-pulse" />
                    ) : (
                      <p className="text-2xl md:text-3xl font-bold animate-count-up">
                        {displayValue}
                      </p>
                    )}
                  </div>
                  <div className={`${stat.bg} p-2.5 rounded-xl`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60" />
        <Input
          placeholder="Search products, categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-12 pl-12 pr-4 rounded-2xl bg-card border-border/60 text-base shadow-sm focus:shadow-md transition-shadow"
        />
      </div>

      <CategoryChips
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
      />

      {/* Products Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">
              {selectedCategory === "all" ? t("discoverProducts") : selectedCategory}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {products?.length ?? 0} products available
            </p>
          </div>
          <Link href="/marketplace">
            <Button variant="outline" size="sm" className="rounded-xl gap-2 hover:bg-primary hover:text-primary-foreground transition-colors">
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <ProductGrid products={products} isLoading={products === undefined} />
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-3">
        <Link href="/orders" className="flex-1">
          <Card className="group hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-primary/10 p-2.5 rounded-xl group-hover:bg-primary/20 transition-colors">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{tOrders("title")}</p>
                <p className="text-xs text-muted-foreground truncate">Track & manage orders</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
