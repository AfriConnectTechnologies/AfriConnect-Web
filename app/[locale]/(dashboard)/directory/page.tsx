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
  X,
  Loader2,
  Users
} from "lucide-react";
import Image from "next/image";

export default function DirectoryPage() {
  const t = useTranslations("directory");
  const tCommon = useTranslations("common");
  
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("search") || "");
  const [countryFilter, setCountryFilter] = useState(searchParams.get("country") || "");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "");

  const countries = useQuery(api.directory.getCountries);
  const categories = useQuery(api.directory.getCategories);

  const businesses = useQuery(api.directory.listBusinesses, {
    country: countryFilter || undefined,
    category: categoryFilter || undefined,
    search: debouncedSearch || undefined,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

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

  const hasActiveFilters = debouncedSearch || countryFilter || categoryFilter;

  const clearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setCountryFilter("");
    setCategoryFilter("");
  };

  if (businesses === undefined || countries === undefined || categories === undefined) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      {/* Filters */}
      <Card className="border-border/60">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col gap-4">
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

              {countries.length > 0 && (
                <Select value={countryFilter || "all"} onValueChange={(v) => setCountryFilter(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-full sm:w-[180px] h-11 rounded-xl">
                    <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
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

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="w-fit text-muted-foreground hover:text-destructive h-11">
                  <X className="mr-1.5 h-3.5 w-3.5" />
                  {tCommon("clearFilters")}
                </Button>
              )}
            </div>

            {categories.length > 0 && (
              <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
                <TabsList className="h-auto flex-wrap justify-start gap-1 bg-muted/30 p-1">
                  <TabsTrigger value="" className="text-sm rounded-lg">{tCommon("all")}</TabsTrigger>
                  {categories.map((category) => (
                    <TabsTrigger key={category} value={category} className="text-sm rounded-lg">{category}</TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}

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
                    {t("allCountries").replace("All ", "")}: {countryFilter}
                    <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setCountryFilter("")} />
                  </Badge>
                )}
                {categoryFilter && (
                  <Badge variant="secondary" className="gap-1.5 rounded-lg px-2.5 py-1">
                    {t("allCategories").replace("All ", "")}: {categoryFilter}
                    <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setCategoryFilter("")} />
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-border/40">
            <p className="text-sm text-muted-foreground">
              {businesses.length > 0 ? `${businesses.length} ${t("verified")}` : t("noBusinesses")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Business Cards Grid */}
      {businesses.length === 0 ? (
        <div className="py-16 text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50 mb-4">
            <Users className="h-10 w-10 text-muted-foreground/40" />
          </div>
          <h3 className="text-lg font-semibold">{t("noBusinesses")}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-sm mx-auto">
            {t("noBusinessesDescription")}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" className="mt-4 rounded-xl" onClick={clearFilters}>
              {tCommon("clearFilters")}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((business) => (
            <Link key={business._id} href={`/directory/${business._id}`}>
              <Card className="group h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-0.5 rounded-2xl border-border/60">
                <CardHeader className="pb-3 p-5">
                  <div className="flex items-start gap-4">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted/50 border border-border/40">
                      {business.logoUrl ? (
                        <Image
                          src={business.logoUrl}
                          alt={business.name}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                          <Building2 className="h-7 w-7 text-primary/40" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base group-hover:text-primary transition-colors truncate">
                          {business.name}
                        </CardTitle>
                        {business.verificationStatus === "verified" && (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 shrink-0">
                            <CheckCircle2 className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          {business.city ? `${business.city}, ` : ""}{business.country}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0 px-5 pb-5">
                  {business.description && (
                    <CardDescription className="line-clamp-2 mb-3">
                      {business.description}
                    </CardDescription>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="rounded-lg text-xs">
                      {business.category}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg">
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
    </div>
  );
}
