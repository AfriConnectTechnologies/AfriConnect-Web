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
import { Search, ShoppingCart, Package, ImageIcon, X, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import Image from "next/image";
import { USD_TO_ETB_RATE } from "@/lib/pricing";

type SortOption = "newest" | "price_asc" | "price_desc";

export default function MarketplacePage() {
  const t = useTranslations("marketplace");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse URL params once
  const urlMinPrice = searchParams.get("minPrice");
  const urlMaxPrice = searchParams.get("maxPrice");

  // Initialize state from URL params
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("search") || "");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "");
  const [countryFilter, setCountryFilter] = useState(searchParams.get("country") || "");
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "newest"
  );
  const [showFilters, setShowFilters] = useState(false);
  
  // User-controlled price range (null means use defaults from priceRangeData)
  const [userPriceRange, setUserPriceRange] = useState<[number, number] | null>(
    urlMinPrice || urlMaxPrice 
      ? [urlMinPrice ? Number(urlMinPrice) : 0, urlMaxPrice ? Number(urlMaxPrice) : 999999]
      : null
  );

  const ensureUser = useMutation(api.users.ensureUser);

  // Fetch filter options
  const categories = useQuery(api.products.getProductCategories);
  const countries = useQuery(api.products.getProductCountries);
  const priceRangeData = useQuery(api.products.getProductPriceRange);

  // Compute effective price range
  const priceRange = useMemo((): [number, number] => {
    if (userPriceRange) {
      return userPriceRange;
    }
    if (priceRangeData) {
      return [priceRangeData.min, priceRangeData.max];
    }
    return [0, 10000]; // Fallback
  }, [userPriceRange, priceRangeData]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Update URL params when filters change
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

  // Determine if price filter is active
  const isPriceFilterActive = userPriceRange && priceRangeData && 
    (userPriceRange[0] > priceRangeData.min || userPriceRange[1] < priceRangeData.max);

  // Fetch products with filters
  const products = useQuery(api.products.marketplace, {
    search: debouncedSearch || undefined,
    category: categoryFilter || undefined,
    country: countryFilter || undefined,
    minPrice: isPriceFilterActive ? userPriceRange![0] : undefined,
    maxPrice: isPriceFilterActive ? userPriceRange![1] : undefined,
    sortBy: sortBy,
  });

  useEffect(() => {
    ensureUser().catch(() => {
      // Silently fail if user creation fails
    });
  }, [ensureUser]);

  // Check if any filters are active
  const hasActiveFilters = debouncedSearch || categoryFilter || countryFilter || isPriceFilterActive || sortBy !== "newest";

  // Clear all filters
  const clearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setCategoryFilter("");
    setCountryFilter("");
    setSortBy("newest");
    setUserPriceRange(null);
  };

  // Handle price range change from slider
  const handlePriceRangeChange = (value: number[]) => {
    setUserPriceRange([value[0], value[1]]);
  };

  // Count active filters (excluding search and sort)
  const activeFilterCount = [categoryFilter, countryFilter, isPriceFilterActive].filter(Boolean).length;

  // Only show full-page loading when essential data is missing
  if (categories === undefined || countries === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">{tCommon("loading")}</div>
      </div>
    );
  }

  // Ensure products is always an array for rendering (show empty during refetch)
  const displayProducts = products ?? [];
  const isRefetching = products === undefined;

  const getPrimaryUsdPrice = (priceEtb: number, usdPrice?: number) => {
    if (usdPrice !== undefined) return { value: usdPrice, approximate: false };
    return { value: priceEtb / USD_TO_ETB_RATE, approximate: true };
  };

  const formatStockLabel = (quantity: number) => {
    if (quantity > 1000) {
      return t("inStockCap");
    }
    return t("inStock", { count: quantity });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{t("browseProducts")}</CardTitle>
              <CardDescription>
                {isRefetching 
                  ? t("loadingProducts")
                  : displayProducts.length > 0 
                    ? t("showingProducts", { count: displayProducts.length })
                    : t("noProducts")
                }
              </CardDescription>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="w-fit"
              >
                <X className="mr-2 h-4 w-4" />
                {tCommon("clearFilters")}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Main Controls */}
          <div className="mb-6 flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("searchPlaceholder")}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Sort Dropdown */}
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  <SelectValue placeholder={t("sortBy")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{t("sortNewest")}</SelectItem>
                  <SelectItem value="price_asc">{t("sortPriceAsc")}</SelectItem>
                  <SelectItem value="price_desc">{t("sortPriceDesc")}</SelectItem>
                </SelectContent>
              </Select>

              {/* Filter Toggle Button (Mobile) */}
              <Button
                variant="outline"
                className="sm:hidden"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                {tCommon("filters")}
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Filter Section */}
            <div className={`flex flex-col gap-4 sm:flex-row sm:flex-wrap ${showFilters ? "" : "hidden sm:flex"}`}>
              {/* Country Filter */}
              {countries.length > 0 && (
                <Select value={countryFilter || "all"} onValueChange={(v) => setCountryFilter(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder={t("allCountries")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allCountries")}</SelectItem>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Category Filter */}
              {categories.length > 0 && (
                <Select value={categoryFilter || "all"} onValueChange={(v) => setCategoryFilter(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder={t("allCategories")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allCategories")}</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Price Range Filter */}
              {priceRangeData && priceRangeData.max > priceRangeData.min && (
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {t("price")}: {priceRange[0].toLocaleString()} ETB - {priceRange[1].toLocaleString()} ETB
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
            </div>

            {/* Active Filter Tags */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2">
                {debouncedSearch && (
                  <Badge variant="secondary" className="gap-1">
                    {tCommon("search")}: {debouncedSearch}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => {
                        setSearchInput("");
                        setDebouncedSearch("");
                      }}
                    />
                  </Badge>
                )}
                {countryFilter && (
                  <Badge variant="secondary" className="gap-1">
                    {t("country")}: {countryFilter}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setCountryFilter("")}
                    />
                  </Badge>
                )}
                {categoryFilter && (
                  <Badge variant="secondary" className="gap-1">
                    {t("category")}: {categoryFilter}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setCategoryFilter("")}
                    />
                  </Badge>
                )}
                {isPriceFilterActive && (
                  <Badge variant="secondary" className="gap-1">
                    {t("price")}: {userPriceRange![0]} ETB - {userPriceRange![1]} ETB
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setUserPriceRange(null)}
                    />
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Products Grid */}
          {isRefetching ? (
            <div className="py-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="mt-4 text-muted-foreground">{t("loadingProducts")}</p>
            </div>
          ) : displayProducts.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">{t("noProducts")}</h3>
              <p className="mt-2 text-muted-foreground">
                {hasActiveFilters
                  ? t("tryAdjustingFilters")
                  : t("noProductsYet")}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  {t("clearAllFilters")}
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {displayProducts.map((product) => (
                <Link key={product._id} href={`/marketplace/${product._id}`}>
                  <Card className="group h-full overflow-hidden transition-all hover:shadow-lg hover:border-primary/50">
                    {/* Product Image */}
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      {product.primaryImageUrl ? (
                        <Image
                          src={product.primaryImageUrl}
                          alt={product.name}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ImageIcon className="h-16 w-16 text-muted-foreground/50" />
                        </div>
                      )}
                      
                      {/* Category Badge - Overlay */}
                      {product.category && (
                        <Badge 
                          variant="secondary" 
                          className="absolute left-3 top-3 bg-background/80 backdrop-blur-sm"
                        >
                          {product.category}
                        </Badge>
                      )}

                      {/* Country Badge - Overlay */}
                      {product.country && (
                        <Badge 
                          variant="outline" 
                          className="absolute right-3 top-3 bg-background/80 backdrop-blur-sm"
                        >
                          {product.country}
                        </Badge>
                      )}

                      {/* Out of Stock Overlay */}
                      {product.quantity === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                          <Badge variant="destructive" className="text-sm">
                            {t("outOfStock")}
                          </Badge>
                        </div>
                      )}

                      {product.isOrderable === false && (
                        <div className="absolute bottom-3 left-3">
                          <Badge variant="outline" className="bg-background/90">
                            Not orderable
                          </Badge>
                        </div>
                      )}
                    </div>

                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="line-clamp-1 text-base group-hover:text-primary transition-colors">
                        {product.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                        {product.description || tCommon("noDescription")}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="p-4 pt-0">
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="text-2xl font-bold">
                            {(() => {
                              const usd = getPrimaryUsdPrice(product.price, product.usdPrice);
                              return `${usd.approximate ? "~" : ""}$${usd.value.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`;
                            })()}
                          </div>
                          <div className="text-xs text-muted-foreground">{product.price.toLocaleString()} ETB</div>
                          {product.quantity > 0 && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Package className="h-3 w-3" />
                              {formatStockLabel(product.quantity)}
                            </div>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          variant="secondary"
                          className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
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
        </CardContent>
      </Card>
    </div>
  );
}
