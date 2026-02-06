import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { cartItems, inventoryTransactions, orderItems, orders, products, users } from "../db/schema";
import { getOrCreateUser, toDoc, type RequestContext } from "./helpers";

export async function list(ctx: RequestContext, args: { status?: "pending" | "processing" | "completed" | "cancelled" }) {
  if (!ctx.auth.userId) throw new Error("Not authenticated");
  const user = await db.select().from(users).where(eq(users.clerkId, ctx.auth.userId)).limit(1);
  if (!user[0]) return [];

  let result: typeof orders.$inferSelect[] = [];
  if (args.status) {
    result = await db
      .select()
      .from(orders)
      .where(and(eq(orders.userId, user[0].id), eq(orders.status, args.status)));
  } else {
    result = await db.select().from(orders).where(eq(orders.userId, user[0].id));
  }

  return result.sort((a, b) => b.createdAt - a.createdAt).map((o) => toDoc(o));
}

export async function get(ctx: RequestContext, args: { id: string }) {
  if (!ctx.auth.userId) throw new Error("Not authenticated");
  const order = await db.select().from(orders).where(eq(orders.id, args.id)).limit(1);
  if (!order[0]) return null;

  const user = await db.select().from(users).where(eq(users.clerkId, ctx.auth.userId)).limit(1);
  if (!user[0]) throw new Error("Unauthorized");

  const isBuyer = order[0].userId === user[0].id || order[0].buyerId === user[0].id;
  const isSeller = order[0].sellerId === user[0].id;
  if (!isBuyer && !isSeller) throw new Error("Unauthorized");

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, args.id));
  const itemsWithProducts = await Promise.all(
    items.map(async (item) => {
      const product = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
      return { ...item, product: product[0] ?? null };
    })
  );

  return {
    ...toDoc(order[0]),
    items: itemsWithProducts.map((item) => ({
      ...toDoc(item),
      product: item.product ? toDoc(item.product) : null
    }))
  };
}

export async function create(
  ctx: RequestContext,
  args: { title: string; customer: string; amount: number; status?: "pending" | "processing" | "completed" | "cancelled"; description?: string }
) {
  const user = await getOrCreateUser(ctx);
  const now = Date.now();
  const orderId = crypto.randomUUID();

  await db.insert(orders).values({
    id: orderId,
    userId: user.id,
    title: args.title,
    customer: args.customer,
    amount: args.amount,
    status: args.status ?? "pending",
    description: args.description,
    createdAt: now,
    updatedAt: now
  });

  const created = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  return toDoc(created[0] ?? null);
}

export async function update(
  ctx: RequestContext,
  args: { id: string; title?: string; customer?: string; amount?: number; status?: "pending" | "processing" | "completed" | "cancelled"; description?: string }
) {
  if (!ctx.auth.userId) throw new Error("Not authenticated");
  const order = await db.select().from(orders).where(eq(orders.id, args.id)).limit(1);
  if (!order[0]) throw new Error("Order not found");

  const user = await db.select().from(users).where(eq(users.clerkId, ctx.auth.userId)).limit(1);
  if (!user[0] || order[0].userId !== user[0].id) throw new Error("Unauthorized");

  const updates: Partial<typeof orders.$inferInsert> = { updatedAt: Date.now() };
  if (args.title !== undefined) updates.title = args.title;
  if (args.customer !== undefined) updates.customer = args.customer;
  if (args.amount !== undefined) updates.amount = args.amount;
  if (args.status !== undefined) updates.status = args.status;
  if (args.description !== undefined) updates.description = args.description;

  await db.update(orders).set(updates).where(eq(orders.id, args.id));
  const updated = await db.select().from(orders).where(eq(orders.id, args.id)).limit(1);
  return toDoc(updated[0] ?? null);
}

export async function remove(ctx: RequestContext, args: { id: string }) {
  if (!ctx.auth.userId) throw new Error("Not authenticated");
  const order = await db.select().from(orders).where(eq(orders.id, args.id)).limit(1);
  if (!order[0]) throw new Error("Order not found");

  const user = await db.select().from(users).where(eq(users.clerkId, ctx.auth.userId)).limit(1);
  if (!user[0]) throw new Error("Unauthorized");

  const isBuyer = order[0].userId === user[0].id || order[0].buyerId === user[0].id;
  if (!isBuyer || order[0].status !== "pending") {
    throw new Error("Unauthorized");
  }

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, args.id));
  for (const item of items) {
    await db.delete(orderItems).where(eq(orderItems.id, item.id));
  }

  await db.delete(orders).where(eq(orders.id, args.id));
}

export async function purchases(ctx: RequestContext, args: { status?: "pending" | "processing" | "completed" | "cancelled" }) {
  if (!ctx.auth.userId) throw new Error("Not authenticated");
  const user = await db.select().from(users).where(eq(users.clerkId, ctx.auth.userId)).limit(1);
  if (!user[0]) return [];

  let result: typeof orders.$inferSelect[] = [];
  if (args.status) {
    result = await db
      .select()
      .from(orders)
      .where(and(eq(orders.buyerId, user[0].id), eq(orders.status, args.status)));
  } else {
    result = await db.select().from(orders).where(eq(orders.buyerId, user[0].id));
  }

  return result.sort((a, b) => b.createdAt - a.createdAt).map((o) => toDoc(o));
}

export async function sales(ctx: RequestContext, args: { status?: "pending" | "processing" | "completed" | "cancelled" }) {
  if (!ctx.auth.userId) throw new Error("Not authenticated");
  const user = await db.select().from(users).where(eq(users.clerkId, ctx.auth.userId)).limit(1);
  if (!user[0]) return [];

  let result: typeof orders.$inferSelect[] = [];
  if (args.status) {
    result = await db
      .select()
      .from(orders)
      .where(and(eq(orders.sellerId, user[0].id), eq(orders.status, args.status)));
  } else {
    result = await db.select().from(orders).where(eq(orders.sellerId, user[0].id));
  }

  return result.sort((a, b) => b.createdAt - a.createdAt).map((o) => toDoc(o));
}

export async function checkout(ctx: RequestContext) {
  const user = await getOrCreateUser(ctx);
  return db.transaction(async (tx) => {
    const items = await tx.select().from(cartItems).where(eq(cartItems.userId, user.id));
    if (items.length === 0) throw new Error("Cart is empty");

    const itemsBySeller = new Map<string, typeof items>();

    for (const cartItem of items) {
      const product = await tx.select().from(products).where(eq(products.id, cartItem.productId)).limit(1);
      if (!product[0]) throw new Error("Product not found");
      if (product[0].status !== "active") throw new Error(`Product ${product[0].name} is no longer available`);
      if (cartItem.quantity > product[0].quantity) throw new Error(`Insufficient stock for ${product[0].name}`);

      const sellerId = product[0].sellerId;
      if (!itemsBySeller.has(sellerId)) itemsBySeller.set(sellerId, []);
      itemsBySeller.get(sellerId)!.push(cartItem);
    }

    const now = Date.now();
    const createdOrders: Array<typeof orders.$inferSelect | null> = [];

    for (const [sellerId, sellerItems] of itemsBySeller.entries()) {
      let totalAmount = 0;
      const orderItemsData: { productId: string; quantity: number; price: number }[] = [];

      for (const cartItem of sellerItems) {
        const product = await tx.select().from(products).where(eq(products.id, cartItem.productId)).limit(1);
        if (!product[0]) continue;
        const itemTotal = product[0].price * cartItem.quantity;
        totalAmount += itemTotal;
        orderItemsData.push({ productId: cartItem.productId, quantity: cartItem.quantity, price: product[0].price });
      }

      const seller = await tx.select().from(users).where(eq(users.id, sellerId)).limit(1);
      const sellerName = seller[0]?.name || seller[0]?.email || "Unknown Seller";

      const orderId = crypto.randomUUID();
      await tx.insert(orders).values({
        id: orderId,
        userId: user.id,
        buyerId: user.id,
        sellerId,
        title: `Order from ${sellerName}`,
        customer: user.name || user.email,
        amount: totalAmount,
        status: "pending",
        description: `Order containing ${sellerItems.length} item(s)`,
        createdAt: now,
        updatedAt: now
      });

      for (const item of orderItemsData) {
        await tx.insert(orderItems).values({
          id: crypto.randomUUID(),
          orderId,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          createdAt: now
        });
        const product = await tx.select().from(products).where(eq(products.id, item.productId)).limit(1);
        if (product[0]) {
          await tx.update(products).set({ quantity: product[0].quantity - item.quantity, updatedAt: now }).where(eq(products.id, item.productId));
          await tx.insert(inventoryTransactions).values({
            id: crypto.randomUUID(),
            productId: item.productId,
            sellerId: product[0].sellerId,
            type: "sale",
            direction: "out",
            quantity: item.quantity,
            previousQuantity: product[0].quantity,
            newQuantity: product[0].quantity - item.quantity,
            reference: orderId,
            createdBy: user.id,
            createdAt: now
          });
        }
      }

      for (const cartItem of sellerItems) {
        await tx.delete(cartItems).where(eq(cartItems.id, cartItem.id));
      }

      const order = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      createdOrders.push(order[0] ? (toDoc(order[0]) as any) : null);
    }

    return createdOrders;
  });
}
