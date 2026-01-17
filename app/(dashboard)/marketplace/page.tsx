"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { useSearchParams, useRouter } from "next/navigation";
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
import Link from "next/link";
import Image from "next/image";

type SortOption = "newest" | "price_asc" | "price_desc";

export default function MarketplacePage() {
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
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Ensure products is always an array for rendering (show empty during refetch)
  const displayProducts = products ?? [];
  const isRefetching = products === undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
        <p className="text-muted-foreground">
          Browse products from businesses across the platform
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Browse Products</CardTitle>
              <CardDescription>
                {isRefetching 
                  ? "Loading products..."
                  : displayProducts.length > 0 
                    ? `Showing ${displayProducts.length} product${displayProducts.length === 1 ? "" : "s"}`
                    : "No products found"
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
                Clear filters
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
                  placeholder="Search products..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Sort Dropdown */}
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>

              {/* Filter Toggle Button (Mobile) */}
              <Button
                variant="outline"
                className="sm:hidden"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filters
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
                    <SelectValue placeholder="All Countries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
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
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
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
                      Price: ${priceRange[0].toLocaleString()} - ${priceRange[1].toLocaleString()}
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
                    Search: {debouncedSearch}
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
                    Country: {countryFilter}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setCountryFilter("")}
                    />
                  </Badge>
                )}
                {categoryFilter && (
                  <Badge variant="secondary" className="gap-1">
                    Category: {categoryFilter}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setCategoryFilter("")}
                    />
                  </Badge>
                )}
                {isPriceFilterActive && (
                  <Badge variant="secondary" className="gap-1">
                    Price: ${userPriceRange![0]} - ${userPriceRange![1]}
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
              <p className="mt-4 text-muted-foreground">Loading products...</p>
            </div>
          ) : displayProducts.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No products found</h3>
              <p className="mt-2 text-muted-foreground">
                {hasActiveFilters
                  ? "Try adjusting your filters or search terms."
                  : "No products available in the marketplace yet."}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Clear all filters
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
                            Out of Stock
                          </Badge>
                        </div>
                      )}
                    </div>

                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="line-clamp-1 text-base group-hover:text-primary transition-colors">
                        {product.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                        {product.description || "No description available"}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="p-4 pt-0">
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="text-2xl font-bold">
                            ${product.price.toLocaleString()}
                          </div>
                          {product.quantity > 0 && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Package className="h-3 w-3" />
                              {product.quantity} in stock
                            </div>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          variant="secondary"
                          className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                          disabled={product.quantity === 0}
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
