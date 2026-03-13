"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { useSearchParams } from "next/navigation";
import { useRouter, Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, ShoppingCart, Package, ImageIcon, X, SlidersHorizontal, ArrowUpDown, Loader2, Store } from "lucide-react";
import Image from "next/image";
import { USD_TO_ETB_RATE } from "@/lib/pricing";

type SortOption = "newest" | "price_asc" | "price_desc";

export default function MarketplacePage() {
  const t = useTranslations("marketplace");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlMinPrice = searchParams.get("minPrice");
  const urlMaxPrice = searchParams.get("maxPrice");

  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("search") || "");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "");
  const [countryFilter, setCountryFilter] = useState(searchParams.get("country") || "");
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "newest"
  );
  const [showFilters, setShowFilters] = useState(false);
  
  const [userPriceRange, setUserPriceRange] = useState<[number, number] | null>(
    urlMinPrice || urlMaxPrice 
      ? [urlMinPrice ? Number(urlMinPrice) : 0, urlMaxPrice ? Number(urlMaxPrice) : 999999]
      : null
  );

  const ensureUser = useMutation(api.users.ensureUser);
  const categories = useQuery(api.products.getProductCategories);
  const countries = useQuery(api.products.getProductCountries);
  const priceRangeData = useQuery(api.products.getProductPriceRange);

  const priceRange = useMemo((): [number, number] => {
    if (userPriceRange) return userPriceRange;
    if (priceRangeData) return [priceRangeData.min, priceRangeData.max];
    return [0, 10000];
  }, [userPriceRange, priceRangeData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const updateUrlParams = useCallback(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (categoryFilter) params.set("category", categoryFilter);
    if (countryFilter) params.set("country", countryFilter);
    if (sortBy !== "newest") params.set("sort", sortBy);
    if (userPriceRange && priceRangeData) {
      if (userPriceRange[0] > priceRangeData.min) params.set("minPrice", String(userPriceRange[0]));
      if (userPriceRange[1] < priceRangeData.max) params.set("maxPrice", String(userPriceRange[1]));
    }
    
    const newUrl = params.toString() ? `?${params.toString()}` : "/marketplace";
    router.replace(newUrl, { scroll: false });
  }, [debouncedSearch, categoryFilter, countryFilter, sortBy, userPriceRange, priceRangeData, router]);

  useEffect(() => {
    updateUrlParams();
  }, [updateUrlParams]);

  const isPriceFilterActive = userPriceRange && priceRangeData && 
    (userPriceRange[0] > priceRangeData.min || userPriceRange[1] < priceRangeData.max);

  const products = useQuery(api.products.marketplace, {
    search: debouncedSearch || undefined,
    category: categoryFilter || undefined,
    country: countryFilter || undefined,
    minPrice: isPriceFilterActive ? userPriceRange![0] : undefined,
    maxPrice: isPriceFilterActive ? userPriceRange![1] : undefined,
    sortBy: sortBy,
  });

  useEffect(() => {
    ensureUser().catch(() => {});
  }, [ensureUser]);

  const hasActiveFilters = debouncedSearch || categoryFilter || countryFilter || isPriceFilterActive || sortBy !== "newest";

  const clearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setCategoryFilter("");
    setCountryFilter("");
    setSortBy("newest");
    setUserPriceRange(null);
  };

  const handlePriceRangeChange = (value: number[]) => {
    setUserPriceRange([value[0], value[1]]);
  };

  const activeFilterCount = [categoryFilter, countryFilter, isPriceFilterActive].filter(Boolean).length;

  if (categories === undefined || countries === undefined) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
      </div>
    );
  }

  const displayProducts = products ?? [];
  const isRefetching = products === undefined;

  const getPrimaryUsdPrice = (priceEtb: number, usdPrice?: number) => {
    if (usdPrice !== undefined) return { value: usdPrice, approximate: false };
    return { value: priceEtb / USD_TO_ETB_RATE, approximate: true };
  };

  const formatStockLabel = (quantity: number) => {
    if (quantity > 1000) return t("inStockCap");
    return t("inStock", { count: quantity });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      {/* Filters Card */}
      <Card className="border-border/60 overflow-hidden">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col gap-4">
            {/* Search and Sort Row */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  placeholder={t("searchPlaceholder")}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10 h-11 rounded-xl bg-muted/30 border-border/60"
                />
              </div>

              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="w-full sm:w-[180px] h-11 rounded-xl">
                  <ArrowUpDown className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder={t("sortBy")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{t("sortNewest")}</SelectItem>
                  <SelectItem value="price_asc">{t("sortPriceAsc")}</SelectItem>
                  <SelectItem value="price_desc">{t("sortPriceDesc")}</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                className="sm:hidden h-11 rounded-xl"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                {tCommon("filters")}
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Filters Row */}
            <div className={`flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end ${showFilters ? "" : "hidden sm:flex"}`}>
              {countries.length > 0 && (
                <Select value={countryFilter || "all"} onValueChange={(v) => setCountryFilter(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-full sm:w-[180px] h-10 rounded-xl">
                    <SelectValue placeholder={t("allCountries")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allCountries")}</SelectItem>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {categories.length > 0 && (
                <Select value={categoryFilter || "all"} onValueChange={(v) => setCategoryFilter(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-full sm:w-[180px] h-10 rounded-xl">
                    <SelectValue placeholder={t("allCategories")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allCategories")}</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {priceRangeData && priceRangeData.max > priceRangeData.min && (
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                      {t("price")}: {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()} ETB
                    </span>
                  </div>
                  <Slider
                    value={priceRange}
                    onValueChange={handlePriceRangeChange}
                    min={priceRangeData.min}
                    max={priceRangeData.max}
                    step={Math.max(1, Math.floor((priceRangeData.max - priceRangeData.min) / 100))}
                    className="w-full sm:w-[200px]"
                  />
                </div>
              )}

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="w-fit text-muted-foreground hover:text-destructive"
                >
                  <X className="mr-1.5 h-3.5 w-3.5" />
                  {tCommon("clearFilters")}
                </Button>
              )}
            </div>

            {/* Active Filter Tags */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2">
                {debouncedSearch && (
                  <Badge variant="secondary" className="gap-1.5 rounded-lg px-2.5 py-1">
                    {tCommon("search")}: {debouncedSearch}
                    <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => { setSearchInput(""); setDebouncedSearch(""); }} />
                  </Badge>
                )}
                {countryFilter && (
                  <Badge variant="secondary" className="gap-1.5 rounded-lg px-2.5 py-1">
                    {t("country")}: {countryFilter}
                    <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setCountryFilter("")} />
                  </Badge>
                )}
                {categoryFilter && (
                  <Badge variant="secondary" className="gap-1.5 rounded-lg px-2.5 py-1">
                    {t("category")}: {categoryFilter}
                    <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setCategoryFilter("")} />
                  </Badge>
                )}
                {isPriceFilterActive && (
                  <Badge variant="secondary" className="gap-1.5 rounded-lg px-2.5 py-1">
                    {t("price")}: {userPriceRange![0]} - {userPriceRange![1]} ETB
                    <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setUserPriceRange(null)} />
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Results count */}
          <div className="mt-4 pt-4 border-t border-border/40">
            <p className="text-sm text-muted-foreground">
              {isRefetching 
                ? t("loadingProducts")
                : displayProducts.length > 0 
                  ? t("showingProducts", { count: displayProducts.length })
                  : t("noProducts")
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {isRefetching ? (
        <div className="py-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">{t("loadingProducts")}</p>
        </div>
      ) : displayProducts.length === 0 ? (
        <div className="py-16 text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50 mb-4">
            <Store className="h-10 w-10 text-muted-foreground/40" />
          </div>
          <h3 className="text-lg font-semibold">{t("noProducts")}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-sm mx-auto">
            {hasActiveFilters ? t("tryAdjustingFilters") : t("noProductsYet")}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" className="mt-4 rounded-xl" onClick={clearFilters}>
              {t("clearAllFilters")}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {displayProducts.map((product) => (
            <Link key={product._id} href={`/marketplace/${product._id}`} className="min-w-0">
              <Card className="group h-full overflow-hidden rounded-2xl transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5 border-border/60">
                <div className="relative aspect-square overflow-hidden bg-muted/50">
                  {product.primaryImageUrl ? (
                    <Image
                      src={product.primaryImageUrl}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted/50 to-muted">
                      <ImageIcon className="h-12 w-12 text-muted-foreground/20 sm:h-16 sm:w-16" />
                    </div>
                  )}

                  {product.category && (
                    <Badge variant="secondary" className="absolute left-2 top-2 hidden bg-background/90 text-[10px] backdrop-blur-md sm:inline-flex shadow-sm">
                      {product.category}
                    </Badge>
                  )}

                  {product.country && (
                    <Badge variant="outline" className="absolute right-2 top-2 hidden bg-background/90 text-[10px] backdrop-blur-md sm:inline-flex shadow-sm">
                      {product.country}
                    </Badge>
                  )}

                  {product.quantity === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                      <Badge variant="destructive" className="text-xs sm:text-sm">{t("outOfStock")}</Badge>
                    </div>
                  )}

                  {product.isOrderable === false && (
                    <div className="absolute bottom-2 left-2">
                      <Badge variant="outline" className="bg-background/90 text-[10px] sm:text-xs backdrop-blur-sm">
                        Not orderable
                      </Badge>
                    </div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
                  <CardTitle className="line-clamp-1 text-sm transition-colors group-hover:text-primary sm:text-base">
                    {product.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-1 min-h-[1.25rem] text-xs sm:line-clamp-2 sm:min-h-[2.5rem] sm:text-sm">
                    {product.description || tCommon("noDescription")}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                  <div className="flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-lg font-bold sm:text-2xl">
                        {(() => {
                          const usd = getPrimaryUsdPrice(product.price, product.usdPrice);
                          return `${usd.approximate ? "~" : ""}$${usd.value.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`;
                        })()}
                      </div>
                      <div className="text-[11px] text-muted-foreground sm:text-xs">
                        {product.price.toLocaleString()} ETB
                      </div>
                      {product.quantity > 0 && (
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground sm:text-xs">
                          <Package className="h-3 w-3" />
                          {formatStockLabel(product.quantity)}
                        </div>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 shrink-0 rounded-xl transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-md sm:h-9 sm:w-9"
                      disabled={product.quantity === 0 || product.isOrderable === false}
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
