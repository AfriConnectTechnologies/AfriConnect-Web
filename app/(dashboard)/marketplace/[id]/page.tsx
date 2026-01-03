"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package, ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as Id<"products">;
  const [quantity, setQuantity] = useState(1);

  const currentUser = useQuery(api.users.getCurrentUser);
  const product = useQuery(api.products.get, { id: productId });
  const addToCart = useMutation(api.cart.add);

  // Check if current user is the owner of this product
  const isOwnProduct = currentUser && product && product.sellerId === currentUser._id;

  const handleAddToCart = async () => {
    if (!product) return;

    if (quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    if (quantity > product.quantity) {
      toast.error("Insufficient stock");
      return;
    }

    try {
      await addToCart({
        productId: product._id,
        quantity,
      });
      toast.success("Added to cart");
      router.push("/cart");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { data?: string })?.data || "Failed to add to cart";
      toast.error(errorMessage);
    }
  };

  if (product === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (product === null) {
    return (
      <div className="space-y-6">
        <Link href="/marketplace">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Marketplace
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Product not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const maxQuantity = Math.min(product.quantity, 100);

  return (
    <div className="space-y-6">
      <Link href="/marketplace">
        <Button variant="ghost">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Marketplace
        </Button>
      </Link>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-2xl">{product.name}</CardTitle>
              {product.category && (
                <Badge variant="secondary">{product.category}</Badge>
              )}
            </div>
            <CardDescription className="text-lg">
              ${product.price.toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">
                  {product.description || "No description available"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {product.quantity > 0 ? (
                    <span>
                      {product.quantity} {product.quantity === 1 ? "item" : "items"} in stock
                    </span>
                  ) : (
                    <span className="text-destructive">Out of stock</span>
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{isOwnProduct ? "Your Product" : "Purchase"}</CardTitle>
            <CardDescription>
              {isOwnProduct 
                ? "This is one of your products" 
                : "Add this product to your cart"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isOwnProduct ? (
              <div className="py-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
                  <Info className="h-5 w-5 text-muted-foreground shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    This is your product. You can manage it from your{" "}
                    <Link href="/products" className="text-primary hover:underline font-medium">
                      Products page
                    </Link>.
                  </p>
                </div>
                <Link href="/products" className="block mt-4">
                  <Button variant="outline" className="w-full">
                    Manage My Products
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      -
                    </Button>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max={maxQuantity}
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setQuantity(Math.max(1, Math.min(maxQuantity, val)));
                      }}
                      className="text-center"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                      disabled={quantity >= maxQuantity}
                    >
                      +
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">
                      ${(product.price * quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={handleAddToCart}
                  disabled={product.quantity === 0 || quantity > product.quantity}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
                {product.quantity === 0 && (
                  <p className="text-sm text-destructive text-center">
                    This product is currently out of stock
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

