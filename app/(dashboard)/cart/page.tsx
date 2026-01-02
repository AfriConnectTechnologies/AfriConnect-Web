"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Trash2, Plus, Minus, Package } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

export default function CartPage() {
  const router = useRouter();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const ensureUser = useMutation(api.users.ensureUser);
  const cart = useQuery(api.cart.get);
  const updateCartItem = useMutation(api.cart.update);
  const removeCartItem = useMutation(api.cart.remove);
  const checkout = useMutation(api.orders.checkout);

  useEffect(() => {
    ensureUser().catch(() => {
      // Silently fail if user creation fails
    });
  }, [ensureUser]);

  const handleUpdateQuantity = async (itemId: Id<"cartItems">, newQuantity: number) => {
    try {
      if (newQuantity <= 0) {
        await removeCartItem({ id: itemId });
      } else {
        await updateCartItem({ id: itemId, quantity: newQuantity });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update cart");
    }
  };

  const handleRemove = async (itemId: Id<"cartItems">) => {
    try {
      await removeCartItem({ id: itemId });
      toast.success("Item removed from cart");
    } catch (error) {
      toast.error("Failed to remove item");
    }
  };

  const handleCheckout = async () => {
    if (!cart || cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setIsCheckingOut(true);
    try {
      await checkout();
      toast.success("Order placed successfully!");
      router.push("/orders");
    } catch (error: any) {
      toast.error(error.message || "Failed to checkout");
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (cart === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const total = cart.reduce((sum, item) => {
    if (!item.product) return sum;
    return sum + item.product.price * item.quantity;
  }, 0);

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Shopping Cart</h1>
        <p className="text-muted-foreground">
          Review your items before checkout
        </p>
      </div>

      {cart.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Your cart is empty</p>
            <Link href="/marketplace">
              <Button>Browse Marketplace</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            {cart.map((item) => {
              if (!item.product) return null;

              return (
                <Card key={item._id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">
                          {item.product.name}
                        </h3>
                        {item.product.category && (
                          <Badge variant="outline" className="mb-2">
                            {item.product.category}
                          </Badge>
                        )}
                        <p className="text-sm text-muted-foreground mb-2">
                          {item.product.description || "No description"}
                        </p>
                        <div className="flex items-center gap-4">
                          <div className="text-lg font-semibold">
                            ${item.product.price.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-2">
                            <Package className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {item.product.quantity} available
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(item._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              handleUpdateQuantity(item._id, item.quantity - 1)
                            }
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            max={item.product.quantity}
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1;
                              handleUpdateQuantity(
                                item._id,
                                Math.max(1, Math.min(item.product!.quantity, val))
                              );
                            }}
                            className="w-16 text-center"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              handleUpdateQuantity(item._id, item.quantity + 1)
                            }
                            disabled={item.quantity >= item.product.quantity}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Subtotal</div>
                          <div className="font-semibold">
                            ${(item.product.price * item.quantity).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>
                  {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Items</span>
                    <span>{itemCount}</span>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${total.toLocaleString()}</span>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={handleCheckout}
                  disabled={isCheckingOut || cart.length === 0}
                >
                  {isCheckingOut ? "Processing..." : "Checkout"}
                </Button>
                <Link href="/marketplace">
                  <Button variant="outline" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

