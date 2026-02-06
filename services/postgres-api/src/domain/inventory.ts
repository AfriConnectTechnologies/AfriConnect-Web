import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { inventoryTransactions, products, users } from "../db/schema";
import { requireSeller, toDoc, type RequestContext } from "./helpers";

const DEFAULT_LOW_STOCK_THRESHOLD = 5;

type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

function getStockStatus(quantity: number, threshold: number): StockStatus {
  if (quantity <= 0) return "out_of_stock";
  if (quantity <= threshold) return "low_stock";
  return "in_stock";
}

async function requireSellerForMutation(ctx: RequestContext) {
  if (!ctx.auth.userId) throw new Error("Not authenticated");
  const user = await db.select().from(users).where(eq(users.clerkId, ctx.auth.userId)).limit(1);
  if (!user[0] || (user[0].role !== "seller" && user[0].role !== "admin")) {
    throw new Error("Unauthorized: Seller access required");
  }
  return user[0];
}

export async function list(
  ctx: RequestContext,
  args: { status?: "in_stock" | "low_stock" | "out_of_stock" }
) {
  const user = await requireSeller(ctx);

  const productsList = await db.select().from(products).where(eq(products.sellerId, user.id));
  const enriched = productsList.map((product) => {
    const threshold = product.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
    const stockStatus = getStockStatus(product.quantity, threshold);
    return {
      ...toDoc(product),
      lowStockThreshold: threshold,
      stockStatus,
      stockValue: product.quantity * product.price
    };
  });

  const filtered = args.status ? enriched.filter((item) => item.stockStatus === args.status) : enriched;
  return filtered.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getTransactions(
  ctx: RequestContext,
  args: { productId?: string; limit?: number }
) {
  const user = await requireSeller(ctx);

  let transactions: typeof inventoryTransactions.$inferSelect[] = [];
  if (args.productId) {
    const product = await db.select().from(products).where(eq(products.id, args.productId)).limit(1);
    if (!product[0] || product[0].sellerId !== user.id) {
      throw new Error("Unauthorized");
    }
    transactions = await db
      .select()
      .from(inventoryTransactions)
      .where(eq(inventoryTransactions.productId, args.productId));
  } else {
    transactions = await db
      .select()
      .from(inventoryTransactions)
    .where(eq(inventoryTransactions.sellerId, user.id));
  }

  const sorted = transactions.sort((a, b) => b.createdAt - a.createdAt);
  const limit = args.limit && args.limit > 0 ? args.limit : 50;
  const sliced = sorted.slice(0, limit);

  const withProducts = await Promise.all(
    sliced.map(async (tx) => {
      const product = await db.select().from(products).where(eq(products.id, tx.productId)).limit(1);
      return {
        ...toDoc(tx),
        productName: product[0]?.name ?? null,
        productSku: product[0]?.sku ?? null
      };
    })
  );

  return withProducts;
}

export async function adjustStock(
  ctx: RequestContext,
  args: { productId: string; delta: number; reason?: string; type?: "restock" | "adjustment" | "return" | "correction" }
) {
  const user = await requireSellerForMutation(ctx);

  if (args.delta === 0) throw new Error("Adjustment must be non-zero");

  const product = await db.select().from(products).where(eq(products.id, args.productId)).limit(1);
  if (!product[0] || product[0].sellerId !== user.id) throw new Error("Unauthorized");

  const previousQuantity = product[0].quantity;
  const newQuantity = previousQuantity + args.delta;
  if (newQuantity < 0) throw new Error("Insufficient stock for this adjustment");

  const now = Date.now();
  await db.update(products).set({ quantity: newQuantity, updatedAt: now }).where(eq(products.id, args.productId));

  const direction = args.delta > 0 ? "in" : "out";
  const type = args.type ?? (args.delta > 0 ? "restock" : "adjustment");

  await db.insert(inventoryTransactions).values({
    id: crypto.randomUUID(),
    productId: args.productId,
    sellerId: product[0].sellerId,
    type,
    direction,
    quantity: Math.abs(args.delta),
    previousQuantity,
    newQuantity,
    reason: args.reason,
    createdBy: user.id,
    createdAt: now
  });

  const updated = await db.select().from(products).where(eq(products.id, args.productId)).limit(1);
  return toDoc(updated[0] ?? null);
}

export async function updateThresholds(
  ctx: RequestContext,
  args: { productId: string; lowStockThreshold?: number; reorderQuantity?: number }
) {
  const user = await requireSellerForMutation(ctx);
  const product = await db.select().from(products).where(eq(products.id, args.productId)).limit(1);
  if (!product[0] || product[0].sellerId !== user.id) throw new Error("Unauthorized");

  if (args.lowStockThreshold !== undefined && args.lowStockThreshold < 0) {
    throw new Error("Low stock threshold must be 0 or greater");
  }
  if (args.reorderQuantity !== undefined && args.reorderQuantity < 0) {
    throw new Error("Reorder quantity must be 0 or greater");
  }

  await db.update(products).set({
    lowStockThreshold: args.lowStockThreshold ?? product[0].lowStockThreshold,
    reorderQuantity: args.reorderQuantity ?? product[0].reorderQuantity,
    updatedAt: Date.now()
  }).where(eq(products.id, args.productId));

  const updated = await db.select().from(products).where(eq(products.id, args.productId)).limit(1);
  return toDoc(updated[0] ?? null);
}
