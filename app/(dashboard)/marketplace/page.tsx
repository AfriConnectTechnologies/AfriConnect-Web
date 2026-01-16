"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, Package, ImageIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const ensureUser = useMutation(api.users.ensureUser);
  const allProducts = useQuery(api.products.marketplace, {});
  const products = useQuery(api.products.marketplace, {
    search: searchQuery || undefined,
    category: categoryFilter || undefined,
  });

  useEffect(() => {
    ensureUser().catch(() => {
      // Silently fail if user creation fails
    });
  }, [ensureUser]);

  // Extract unique categories from all products
  const categories = useMemo(() => {
    if (!allProducts) return [];
    return Array.from(
      new Set(allProducts.map((p) => p.category).filter((c) => c) as string[])
    );
  }, [allProducts]);

  if (products === undefined || allProducts === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

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
          <CardTitle>Browse Products</CardTitle>
          <CardDescription>Search and filter products by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={categoryFilter === "" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoryFilter("")}
                >
                  All
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={categoryFilter === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategoryFilter(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {products.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {searchQuery || categoryFilter
                ? "No products match your search criteria."
                : "No products available in the marketplace yet."}
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
                      
                      {/* Category Badge - Overlay */}
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
