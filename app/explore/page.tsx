"use client";

import { useState, useMemo } from "react";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Package, ShoppingCart, BarChart3, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const allProducts = useQuery(api.products.publicMarketplace, {});
  const products = useQuery(api.products.publicMarketplace, {
    search: searchQuery || undefined,
    category: categoryFilter || undefined,
  });

  // Extract unique categories from all products
  const categories = useMemo(() => {
    if (!allProducts) return [];
    return Array.from(
      new Set(allProducts.map((p) => p.category).filter((c) => c) as string[])
    );
  }, [allProducts]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <BarChart3 className="h-6 w-6" />
            <span className="text-xl font-bold">OrderFlow</span>
          </Link>
          <nav className="flex items-center gap-4">
            <ThemeToggle />
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost">Sign In</Button>
              </SignInButton>
              <SignInButton mode="modal">
                <Button>Get Started</Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <UserButton />
            </SignedIn>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Back Link */}
          <Link 
            href="/" 
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight">Marketplace</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Discover products from businesses across our platform
            </p>
          </div>

          {/* Search and Filter */}
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative w-full max-w-md">
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

          {/* Products Grid */}
          {products === undefined ? (
            <div className="flex items-center justify-center py-24">
              <div className="text-muted-foreground">Loading products...</div>
            </div>
          ) : products.length === 0 ? (
            <div className="py-24 text-center">
              <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <h2 className="mb-2 text-xl font-semibold">No products found</h2>
              <p className="text-muted-foreground">
                {searchQuery || categoryFilter
                  ? "No products match your search criteria. Try adjusting your filters."
                  : "No products available in the marketplace yet. Be the first to list your products!"}
              </p>
              <SignedOut>
                <SignInButton mode="modal">
                  <Button className="mt-6">
                    Start Selling
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/products">
                  <Button className="mt-6">
                    Add Your Products
                  </Button>
                </Link>
              </SignedIn>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                {products.length} product{products.length !== 1 ? "s" : ""} found
              </p>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <Card key={product._id} className="flex flex-col transition-all hover:shadow-lg hover:-translate-y-1">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="line-clamp-1 text-lg">{product.name}</CardTitle>
                        {product.category && (
                          <Badge variant="secondary" className="shrink-0">{product.category}</Badge>
                        )}
                      </div>
                      <CardDescription className="line-clamp-2">
                        {product.description || "No description available"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col justify-between gap-4">
                      <div>
                        <div className="text-2xl font-bold text-primary">
                          ${product.price.toLocaleString()}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
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
                      <SignedIn>
                        <Link href={`/marketplace/${product._id}`}>
                          <Button className="w-full" disabled={product.quantity === 0}>
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            View Details
                          </Button>
                        </Link>
                      </SignedIn>
                      <SignedOut>
                        <SignInButton mode="modal">
                          <Button className="w-full" variant="outline">
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Sign in to Buy
                          </Button>
                        </SignInButton>
                      </SignedOut>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <Link href="/" className="flex items-center gap-2 cursor-pointer">
              <BarChart3 className="h-5 w-5" />
              <span className="font-semibold">OrderFlow</span>
            </Link>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground">
                Privacy
              </Link>
              <Link href="#" className="hover:text-foreground">
                Terms
              </Link>
              <Link href="#" className="hover:text-foreground">
                Support
              </Link>
            </div>
          </div>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} OrderFlow. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

