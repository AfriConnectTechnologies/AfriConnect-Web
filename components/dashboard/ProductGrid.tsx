"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, Package, ShoppingCart } from "lucide-react";
import { USD_TO_ETB_RATE } from "@/lib/pricing";
import { Button } from "@/components/ui/button";

interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  usdPrice?: number;
  quantity: number;
  category?: string;
  country?: string;
  primaryImageUrl?: string | null;
}

interface ProductGridProps {
  products: Product[] | undefined;
  isLoading?: boolean;
}

function ProductSkeleton() {
  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="aspect-square bg-muted animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded-lg w-3/4 animate-pulse" />
        <div className="h-3 bg-muted rounded-lg w-1/2 animate-pulse" />
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <div className="h-6 bg-muted rounded-lg w-16 animate-pulse" />
            <div className="h-3 bg-muted rounded-lg w-20 animate-pulse" />
          </div>
          <div className="h-9 w-9 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function ProductGrid({ products, isLoading }: ProductGridProps) {
  const t = useTranslations("marketplace");
  const tCommon = useTranslations("common");

  const getPrimaryUsdPrice = (priceEtb: number, usdPrice?: number) => {
    if (usdPrice !== undefined) return { value: usdPrice, approximate: false };
    return { value: priceEtb / USD_TO_ETB_RATE, approximate: true };
  };

  const formatStockLabel = (quantity: number) =>
    quantity > 1000 ? "1000+" : quantity.toLocaleString();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50 mb-4">
          <Package className="h-10 w-10 text-muted-foreground/40" />
        </div>
        <h3 className="text-lg font-semibold">{t("noProducts")}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground max-w-sm mx-auto">
          {t("tryAdjustingFilters")}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {products.map((product) => (
        <Link key={product._id} href={`/marketplace/${product._id}`}>
          <Card className="group h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-0.5 rounded-2xl border-border/60">
            <div className="relative aspect-square overflow-hidden bg-muted/50">
              {product.primaryImageUrl ? (
                <Image
                  src={product.primaryImageUrl}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted/50 to-muted">
                  <ImageIcon className="h-12 w-12 text-muted-foreground/20" />
                </div>
              )}

              {product.category && (
                <Badge
                  variant="secondary"
                  className="absolute left-2 top-2 bg-background/90 backdrop-blur-md text-[11px] font-medium shadow-sm"
                >
                  {product.category}
                </Badge>
              )}

              {product.country && (
                <Badge
                  variant="outline"
                  className="absolute right-2 top-2 bg-background/90 backdrop-blur-md text-[11px] shadow-sm"
                >
                  {product.country}
                </Badge>
              )}

              {product.quantity === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                  <Badge variant="destructive" className="text-xs">{t("outOfStock")}</Badge>
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            <CardContent className="p-3.5">
              <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                {product.name}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                {product.description || tCommon("noDescription")}
              </p>
              <div className="flex items-end justify-between mt-3">
                <div>
                  <div className="text-lg font-bold">
                    {(() => {
                      const usd = getPrimaryUsdPrice(product.price, product.usdPrice);
                      return `${usd.approximate ? "~" : ""}$${usd.value.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`;
                    })()}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {product.price.toLocaleString()} ETB
                  </div>
                </div>
                {product.quantity > 0 && (
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg">
                    <Package className="h-3 w-3" />
                    {formatStockLabel(product.quantity)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
