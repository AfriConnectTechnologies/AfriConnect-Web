"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, Package } from "lucide-react";
import Link from "next/link";

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
          <div className="mb-4 flex flex-col gap-4 sm:flex-row">
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <Card key={product._id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      {product.category && (
                        <Badge variant="secondary">{product.category}</Badge>
                      )}
                    </div>
                    <CardDescription className="line-clamp-2">
                      {product.description || "No description available"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col justify-between gap-4">
                    <div>
                      <div className="text-2xl font-bold">
                        ${product.price.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {product.quantity > 0 ? (
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {product.quantity} in stock
                          </span>
                        ) : (
                          <span className="text-destructive">Out of stock</span>
                        )}
                      </div>
                    </div>
                    <Link href={`/marketplace/${product._id}`}>
                      <Button className="w-full" disabled={product.quantity === 0}>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

