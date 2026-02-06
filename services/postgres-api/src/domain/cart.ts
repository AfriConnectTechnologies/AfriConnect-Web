import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { cartItems, products, users } from "../db/schema";
import { getOrCreateUser, toDoc, type RequestContext } from "./helpers";

export async function get(ctx: RequestContext) {
  if (!ctx.auth.userId) throw new Error("Not authenticated");
  const user = await db.select().from(users).where(eq(users.clerkId, ctx.auth.userId)).limit(1);
  if (!user[0]) return [];

  const items = await db.select().from(cartItems).where(eq(cartItems.userId, user[0].id));
  const cartWithProducts = await Promise.all(
    items.map(async (item) => {
      const product = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
      return { ...toDoc(item), product: product[0] ? toDoc(product[0]) : null };
    })
  );

  return cartWithProducts.filter((item) => item.product !== null);
}

export async function add(ctx: RequestContext, args: { productId: string; quantity: number }) {
  if (args.quantity <= 0) {
    throw new Error("Quantity must be greater than zero");
  }

  const user = await getOrCreateUser(ctx);
  const product = await db.select().from(products).where(eq(products.id, args.productId)).limit(1);
  if (!product[0]) throw new Error("Product not found");

  if (product[0].sellerId === user.id) {
    throw new Error("You can't purchase your own products. This item belongs to you!");
  }

  if (product[0].status !== "active") {
    throw new Error("Sorry, this product is no longer available for purchase");
  }

  if (args.quantity > product[0].quantity) {
    throw new Error(`Only ${product[0].quantity} items available in stock`);
  }

  const existing = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.userId, user.id), eq(cartItems.productId, args.productId)))
    .limit(1);

  const now = Date.now();
  if (existing[0]) {
    const newQuantity = existing[0].quantity + args.quantity;
    if (newQuantity > product[0].quantity) {
      throw new Error(`Only ${product[0].quantity} items available in stock`);
    }
    await db.update(cartItems).set({ quantity: newQuantity, updatedAt: now }).where(eq(cartItems.id, existing[0].id));
    const updated = await db.select().from(cartItems).where(eq(cartItems.id, existing[0].id)).limit(1);
    return toDoc(updated[0] ?? null);
  }

  const cartId = crypto.randomUUID();
  await db.insert(cartItems).values({
    id: cartId,
    userId: user.id,
    productId: args.productId,
    quantity: args.quantity,
    createdAt: now,
    updatedAt: now
  });
  const inserted = await db.select().from(cartItems).where(eq(cartItems.id, cartId)).limit(1);
  return toDoc(inserted[0] ?? null);
}

export async function update(ctx: RequestContext, args: { id: string; quantity: number }) {
  const user = await getOrCreateUser(ctx);
  const item = await db.select().from(cartItems).where(eq(cartItems.id, args.id)).limit(1);
  if (!item[0]) throw new Error("Cart item not found");
  if (item[0].userId !== user.id) throw new Error("Unauthorized");

  if (args.quantity <= 0) {
    await db.delete(cartItems).where(eq(cartItems.id, args.id));
    return null;
  }

  const product = await db.select().from(products).where(eq(products.id, item[0].productId)).limit(1);
  if (!product[0]) throw new Error("Product not found");
  if (args.quantity > product[0].quantity) {
    throw new Error(`Only ${product[0].quantity} items available in stock`);
  }

  await db.update(cartItems).set({ quantity: args.quantity, updatedAt: Date.now() }).where(eq(cartItems.id, args.id));
  const updated = await db.select().from(cartItems).where(eq(cartItems.id, args.id)).limit(1);
  return toDoc(updated[0] ?? null);
}

export async function remove(ctx: RequestContext, args: { id: string }) {
  const user = await getOrCreateUser(ctx);
  const item = await db.select().from(cartItems).where(eq(cartItems.id, args.id)).limit(1);
  if (!item[0]) throw new Error("Cart item not found");
  if (item[0].userId !== user.id) throw new Error("Unauthorized");
  await db.delete(cartItems).where(eq(cartItems.id, args.id));
}

export async function clear(ctx: RequestContext) {
  const user = await getOrCreateUser(ctx);
  const items = await db.select().from(cartItems).where(eq(cartItems.userId, user.id));
  for (const item of items) {
    await db.delete(cartItems).where(eq(cartItems.id, item.id));
  }
}
