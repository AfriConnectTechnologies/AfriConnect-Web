"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Globe, 
  Package, 
  CheckCircle2, 
  ArrowLeft,
  ArrowUpDown,
  ShoppingCart,
  ImageIcon,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type SortOption = "newest" | "price_asc" | "price_desc";

export default function BusinessProfilePage() {
  const params = useParams();
  const businessId = params.businessId as Id<"businesses">;
  
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Fetch business details
  const business = useQuery(api.directory.getBusiness, { businessId });
  const stats = useQuery(api.directory.getBusinessStats, { businessId });
  const products = useQuery(api.directory.getBusinessProducts, { 
    businessId,
    category: categoryFilter || undefined,
    sortBy,
  });

  if (business === undefined || stats === undefined || products === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (business === null) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/directory">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Directory
          </Link>
        </Button>
        <div className="flex flex-col items-center justify-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground/50" />
          <h2 className="mt-4 text-lg font-semibold">Business not found</h2>
          <p className="mt-2 text-muted-foreground">
            This business may not exist or is not verified.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" asChild>
        <Link href="/directory">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Directory
        </Link>
      </Button>

      {/* Business Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-6 md:flex-row">
            {/* Business Logo */}
            <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-xl bg-muted mx-auto md:mx-0">
              {business.logoUrl ? (
                <Image
                  src={business.logoUrl}
                  alt={business.name}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Building2 className="h-16 w-16 text-muted-foreground/50" />
                </div>
              )}
            </div>

            {/* Business Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-2 justify-center md:justify-start">
                <h1 className="text-2xl font-bold">{business.name}</h1>
                {business.verificationStatus === "verified" && (
                  <Badge variant="secondary" className="w-fit mx-auto md:mx-0 gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>
              
              {business.description && (
                <p className="mt-2 text-muted-foreground">
                  {business.description}
                </p>
              )}

              {/* Business Details */}
              <div className="mt-4 flex flex-wrap gap-4 justify-center md:justify-start">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {business.city ? `${business.city}, ` : ""}{business.country}
                  </span>
                </div>
                
                <Badge variant="outline">{business.category}</Badge>
                
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>{stats?.productCount ?? 0} products</span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="mt-4 flex flex-wrap gap-3 justify-center md:justify-start">
                {business.phone && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${business.phone}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      {business.phone}
                    </a>
                  </Button>
                )}
                {business.website && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={business.website} target="_blank" rel="noopener noreferrer">
                      <Globe className="mr-2 h-4 w-4" />
                      Website
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Products</CardTitle>
              <CardDescription>
                {products.length > 0 
                  ? `Showing ${products.length} product${products.length === 1 ? "" : "s"}`
                  : "No products available"
                }
              </CardDescription>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {/* Category Filter */}
              {stats && stats.categories.length > 1 && (
                <Select value={categoryFilter || "all"} onValueChange={(v) => setCategoryFilter(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {stats.categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Sort Dropdown */}
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="w-[150px]">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No products</h3>
              <p className="mt-2 text-muted-foreground">
                This business hasn&apos;t listed any products yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
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
                      
                      {/* Category Badge */}
                      {product.category && (
                        <Badge 
                          variant="secondary" 
                          className="absolute left-3 top-3 bg-background/80 backdrop-blur-sm"
                        >
                          {product.category}
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
