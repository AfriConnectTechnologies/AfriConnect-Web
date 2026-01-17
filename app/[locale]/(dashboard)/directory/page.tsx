"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "convex/react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Building2, 
  MapPin, 
  Package, 
  CheckCircle2, 
  Globe,
  X
} from "lucide-react";
import Image from "next/image";

export default function DirectoryPage() {
  const t = useTranslations("directory");
  const tCommon = useTranslations("common");
  
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL params
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("search") || "");
  const [countryFilter, setCountryFilter] = useState(searchParams.get("country") || "");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "");

  // Fetch filter options
  const countries = useQuery(api.directory.getCountries);
  const categories = useQuery(api.directory.getCategories);

  // Fetch businesses with filters
  const businesses = useQuery(api.directory.listBusinesses, {
    country: countryFilter || undefined,
    category: categoryFilter || undefined,
    search: debouncedSearch || undefined,
  });

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
    if (countryFilter) params.set("country", countryFilter);
    if (categoryFilter) params.set("category", categoryFilter);
    
    const newUrl = params.toString() ? `?${params.toString()}` : "/directory";
    router.replace(newUrl, { scroll: false });
  }, [debouncedSearch, countryFilter, categoryFilter, router]);

  useEffect(() => {
    updateUrlParams();
  }, [updateUrlParams]);

  // Check if any filters are active
  const hasActiveFilters = debouncedSearch || countryFilter || categoryFilter;

  // Clear all filters
  const clearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setCountryFilter("");
    setCategoryFilter("");
  };

  if (businesses === undefined || countries === undefined || categories === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">{tCommon("loading")}</div>
      </div>
    );
  }

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
              <CardTitle>{t("title")}</CardTitle>
              <CardDescription>
                {businesses.length > 0 
                  ? `${businesses.length} ${t("verified")}`
                  : t("noBusinesses")
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
          {/* Search and Filters */}
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

              {/* Country Filter */}
              {countries.length > 0 && (
                <Select value={countryFilter || "all"} onValueChange={(v) => setCountryFilter(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Globe className="mr-2 h-4 w-4" />
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
            </div>

            {/* Category Tabs */}
            {categories.length > 0 && (
              <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
                <TabsList className="h-auto flex-wrap justify-start gap-1">
                  <TabsTrigger value="" className="text-sm">
                    {tCommon("all")}
                  </TabsTrigger>
                  {categories.map((category) => (
                    <TabsTrigger key={category} value={category} className="text-sm">
                      {category}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}

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
                    {t("allCountries").replace("All ", "")}: {countryFilter}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setCountryFilter("")}
                    />
                  </Badge>
                )}
                {categoryFilter && (
                  <Badge variant="secondary" className="gap-1">
                    {t("allCategories").replace("All ", "")}: {categoryFilter}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setCategoryFilter("")}
                    />
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Business Cards Grid */}
          {businesses.length === 0 ? (
            <div className="py-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">{t("noBusinesses")}</h3>
              <p className="mt-2 text-muted-foreground">
                {t("noBusinessesDescription")}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  {tCommon("clearFilters")}
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {businesses.map((business) => (
                <Link key={business._id} href={`/directory/${business._id}`}>
                  <Card className="group h-full overflow-hidden transition-all hover:shadow-lg hover:border-primary/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-4">
                        {/* Business Logo */}
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {business.logoUrl ? (
                            <Image
                              src={business.logoUrl}
                              alt={business.name}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Building2 className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base group-hover:text-primary transition-colors truncate">
                              {business.name}
                            </CardTitle>
                            {business.verificationStatus === "verified" && (
                              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">
                              {business.city ? `${business.city}, ` : ""}{business.country}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      {business.description && (
                        <CardDescription className="line-clamp-2 mb-3">
                          {business.description}
                        </CardDescription>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">
                          {business.category}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Package className="h-3 w-3" />
                          <span>{business.productCount} {t("products")}</span>
                        </div>
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
