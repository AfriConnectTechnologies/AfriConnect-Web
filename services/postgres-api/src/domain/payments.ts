import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import {
  cartItems,
  orderItems,
  orders,
  payments,
  products,
  subscriptions,
  users
} from "../db/schema";
import { getOrCreateUser, toDoc, type RequestContext } from "./helpers";

function generateTxRef(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `AC-${timestamp}-${random}`;
}

export async function create(
  ctx: RequestContext,
  args: { amount: number; currency: string; paymentType: "order" | "subscription"; metadata?: string; idempotencyKey?: string }
) {
  const user = await getOrCreateUser(ctx);
  const now = Date.now();
  const txRef = generateTxRef();

  let cartSnapshot: string | undefined;
  if (args.paymentType === "order") {
    const items = await db.select().from(cartItems).where(eq(cartItems.userId, user.id));
    if (items.length === 0) throw new Error("Cart is empty");

    const cartData: Array<{ productId: string; quantity: number; price: number; sellerId: string; productName: string }> = [];
    for (const item of items) {
      const product = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
      if (!product[0]) continue;
      if (product[0].status !== "active") throw new Error(`Product ${product[0].name} is no longer available`);
      if (item.quantity > product[0].quantity) throw new Error(`Insufficient stock for ${product[0].name}`);
      cartData.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product[0].price,
        sellerId: product[0].sellerId,
        productName: product[0].name
      });
    }
    cartSnapshot = JSON.stringify(cartData);
  }

  const paymentId = crypto.randomUUID();
  await db.insert(payments).values({
    id: paymentId,
    userId: user.id,
    chapaTransactionRef: txRef,
    amount: args.amount,
    currency: args.currency,
    status: "pending",
    paymentType: args.paymentType,
    metadata: cartSnapshot || args.metadata,
    idempotencyKey: args.idempotencyKey,
    createdAt: now,
    updatedAt: now
  });

  if (args.idempotencyKey) {
    const duplicates = await db
      .select()
      .from(payments)
      .where(and(eq(payments.userId, user.id), eq(payments.idempotencyKey, args.idempotencyKey)));

    if (duplicates.length > 1) {
      duplicates.sort((a, b) => (a.id < b.id ? -1 : 1));
      const winner = duplicates[0];
      if (winner.id !== paymentId) {
        await db.delete(payments).where(eq(payments.id, paymentId));
        return { ...toDoc(winner), txRef: winner.chapaTransactionRef, user: { email: user.email, name: user.name } };
      }

      for (const dup of duplicates.slice(1)) {
        await db.delete(payments).where(eq(payments.id, dup.id));
      }
    }
  }

  const payment = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
  return { ...toDoc(payment[0] ?? null), txRef, user: { email: user.email, name: user.name } };
}

export async function updateStatus(
  ctx: RequestContext,
  args: { txRef: string; status: "pending" | "success" | "failed" | "cancelled"; chapaTrxRef?: string }
) {
  void ctx;
  return db.transaction(async (tx) => {
    const payment = await tx
      .select()
      .from(payments)
      .where(eq(payments.chapaTransactionRef, args.txRef))
      .limit(1);

    if (!payment[0]) throw new Error("Payment not found");
    if (payment[0].status === "success") return toDoc(payment[0]);

    await tx.update(payments).set({
      status: args.status,
      chapaTrxRef: args.chapaTrxRef,
      updatedAt: Date.now()
    }).where(eq(payments.id, payment[0].id));

    if (args.status === "success") {
      if (payment[0].paymentType === "subscription" && payment[0].metadata) {
        try {
          const metadata = JSON.parse(payment[0].metadata);
          const { planId, billingCycle, businessId } = metadata;
          if (planId && businessId) {
            const existingSub = await tx
              .select()
              .from(subscriptions)
              .where(eq(subscriptions.businessId, businessId))
              .limit(1);

            const now = Date.now();
            const periodDays = billingCycle === "annual" ? 365 : 30;
            const periodMs = periodDays * 24 * 60 * 60 * 1000;

            if (existingSub[0]) {
              await tx.update(subscriptions).set({
                planId,
                status: "active",
                billingCycle: billingCycle || "monthly",
                currentPeriodStart: now,
                currentPeriodEnd: now + periodMs,
                lastPaymentId: payment[0].id,
                cancelAtPeriodEnd: false,
                trialEndsAt: undefined,
                updatedAt: now
              }).where(eq(subscriptions.id, existingSub[0].id));
            } else {
              await tx.insert(subscriptions).values({
                id: crypto.randomUUID(),
                businessId,
                planId,
                status: "active",
                billingCycle: billingCycle || "monthly",
                currentPeriodStart: now,
                currentPeriodEnd: now + periodMs,
                cancelAtPeriodEnd: false,
                lastPaymentId: payment[0].id,
                createdAt: now,
                updatedAt: now
              });
            }
          }
        } catch {
          // ignore parse errors
        }
      }

      if (payment[0].paymentType === "order" && payment[0].metadata) {
        let cartData: Array<{ productId: string; quantity: number; price: number; sellerId: string; productName: string }> = [];
        try {
          cartData = JSON.parse(payment[0].metadata);
        } catch {
          return await tx
            .select()
            .from(payments)
            .where(eq(payments.id, payment[0].id))
            .limit(1)
            .then((r) => (r[0] ? toDoc(r[0]) : null));
        }

        const user = await tx.select().from(users).where(eq(users.id, payment[0].userId)).limit(1);
        if (!user[0]) {
          return await tx
            .select()
            .from(payments)
            .where(eq(payments.id, payment[0].id))
            .limit(1)
            .then((r) => (r[0] ? toDoc(r[0]) : null));
        }

        const itemsBySeller = new Map<string, typeof cartData>();
        for (const item of cartData) {
          if (!itemsBySeller.has(item.sellerId)) itemsBySeller.set(item.sellerId, []);
          itemsBySeller.get(item.sellerId)!.push(item);
        }

        const now = Date.now();
        const createdOrderIds: string[] = [];

        for (const [sellerId, items] of itemsBySeller.entries()) {
          let totalAmount = 0;
          const orderItemsData: { productId: string; quantity: number; price: number }[] = [];

          for (const item of items) {
            const itemTotal = item.price * item.quantity;
            totalAmount += itemTotal;
            orderItemsData.push({ productId: item.productId, quantity: item.quantity, price: item.price });
          }

          const seller = await tx.select().from(users).where(eq(users.id, sellerId)).limit(1);
          const sellerName = seller[0]?.name || seller[0]?.email || "Unknown Seller";

          const orderId = crypto.randomUUID();
          await tx.insert(orders).values({
            id: orderId,
            userId: user[0].id,
            buyerId: user[0].id,
            sellerId,
            title: `Order from ${sellerName}`,
            customer: user[0].name || user[0].email,
            amount: totalAmount,
            status: "processing",
            description: `Order containing ${items.length} item(s) - Payment ref: ${payment[0].chapaTransactionRef}`,
            createdAt: now,
            updatedAt: now
          });

          createdOrderIds.push(orderId);

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
              const newQuantity = Math.max(0, product[0].quantity - item.quantity);
              await tx.update(products).set({ quantity: newQuantity, updatedAt: now }).where(eq(products.id, item.productId));
            }
          }
        }

        const cart = await tx.select().from(cartItems).where(eq(cartItems.userId, user[0].id));
        for (const item of cart) {
          await tx.delete(cartItems).where(eq(cartItems.id, item.id));
        }

        if (createdOrderIds.length > 0) {
          await tx.update(payments).set({ orderId: createdOrderIds[0], updatedAt: Date.now() }).where(eq(payments.id, payment[0].id));
        }
      }
    }

    const updated = await tx.select().from(payments).where(eq(payments.id, payment[0].id)).limit(1);
    return toDoc(updated[0] ?? null);
  });
}

export async function getByTxRef(ctx: RequestContext, args: { txRef: string }) {
  void ctx;
  const payment = await db
    .select()
    .from(payments)
    .where(eq(payments.chapaTransactionRef, args.txRef))
    .limit(1);
  return toDoc(payment[0] ?? null);
}

export async function getByIdempotencyKey(
  ctx: RequestContext,
  args: { idempotencyKey: string; userId: string }
) {
  void ctx;
  const user = await db.select().from(users).where(eq(users.clerkId, args.userId)).limit(1);
  if (!user[0]) return null;

  const payment = await db
    .select()
    .from(payments)
    .where(and(eq(payments.userId, user[0].id), eq(payments.idempotencyKey, args.idempotencyKey)))
    .limit(1);
  return toDoc(payment[0] ?? null);
}

export async function updateCheckoutUrl(ctx: RequestContext, args: { paymentId: string; checkoutUrl: string }) {
  void ctx;
  const payment = await db.select().from(payments).where(eq(payments.id, args.paymentId)).limit(1);
  if (!payment[0]) throw new Error("Payment not found");

  await db.update(payments).set({ checkoutUrl: args.checkoutUrl, updatedAt: Date.now() }).where(eq(payments.id, args.paymentId));
  return { success: true };
}

export async function list(ctx: RequestContext, args: { status?: "pending" | "success" | "failed" | "cancelled" }) {
  if (!ctx.auth.userId) throw new Error("Not authenticated");
  const user = await db.select().from(users).where(eq(users.clerkId, ctx.auth.userId)).limit(1);
  if (!user[0]) return [];

  let paymentsList = await db.select().from(payments).where(eq(payments.userId, user[0].id));
  if (args.status) paymentsList = paymentsList.filter((p) => p.status === args.status);

  return paymentsList.sort((a, b) => b.createdAt - a.createdAt).map((p) => toDoc(p));
}

export async function getWithOrder(ctx: RequestContext, args: { paymentId: string }) {
  if (!ctx.auth.userId) throw new Error("Not authenticated");
  const payment = await db.select().from(payments).where(eq(payments.id, args.paymentId)).limit(1);
  if (!payment[0]) return null;

  const user = await db.select().from(users).where(eq(users.clerkId, ctx.auth.userId)).limit(1);
  if (!user[0] || payment[0].userId !== user[0].id) throw new Error("Unauthorized");

  let order = null;
  if (payment[0].orderId) {
    const orderRow = await db.select().from(orders).where(eq(orders.id, payment[0].orderId)).limit(1);
    order = orderRow[0] ?? null;
  }

  return { ...toDoc(payment[0] ?? null), order: order ? toDoc(order) : null };
}

export async function getById(ctx: RequestContext, args: { paymentId: string }) {
  if (!ctx.auth.userId) throw new Error("Unauthorized: Authentication required");
  const user = await db.select().from(users).where(eq(users.clerkId, ctx.auth.userId)).limit(1);
  if (!user[0] || user[0].role !== "admin") throw new Error("Unauthorized: Admin access required");

  const payment = await db.select().from(payments).where(eq(payments.id, args.paymentId)).limit(1);
  return toDoc(payment[0] ?? null);
}

export async function recordRefund(
  ctx: RequestContext,
  args: { paymentId: string; refundAmount: number; refundReason: string; refundReference: string }
) {
  if (!ctx.auth.userId) throw new Error("Unauthorized: Authentication required");
  const admin = await db.select().from(users).where(eq(users.clerkId, ctx.auth.userId)).limit(1);
  if (!admin[0] || admin[0].role !== "admin") throw new Error("Unauthorized: Admin access required");

  const payment = await db.select().from(payments).where(eq(payments.id, args.paymentId)).limit(1);
  if (!payment[0]) throw new Error("Payment not found");
  if (payment[0].status !== "success") throw new Error("Only successful payments can be refunded");
  if (args.refundAmount <= 0 || args.refundAmount > payment[0].amount) {
    throw new Error("Invalid refund amount");
  }

  const previousRefundAmount = payment[0].refundAmount || 0;
  const totalRefunded = previousRefundAmount + args.refundAmount;
  const newStatus = totalRefunded >= payment[0].amount ? "refunded" : "partially_refunded";

  await db.update(payments).set({
    status: newStatus,
    refundedAt: Date.now(),
    refundAmount: totalRefunded,
    refundReason: args.refundReason,
    refundReference: args.refundReference,
    refundedByUserId: admin[0].clerkId
  }).where(eq(payments.id, args.paymentId));

  return { success: true };
}

export async function listSubscriptionPayments(ctx: RequestContext, args: { limit?: number }) {
  if (!ctx.auth.userId) throw new Error("Unauthorized: Authentication required");
  const user = await db.select().from(users).where(eq(users.clerkId, ctx.auth.userId)).limit(1);
  if (!user[0] || user[0].role !== "admin") throw new Error("Unauthorized: Admin access required");

  const limit = args.limit || 50;
  const paymentsList = await db.select().from(payments).where(eq(payments.paymentType, "subscription"));
  const sorted = paymentsList.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);

  const withUsers = await Promise.all(
    sorted.map(async (payment) => {
      const u = await db.select().from(users).where(eq(users.id, payment.userId)).limit(1);
      return {
        ...toDoc(payment),
        user: u[0]
          ? { name: u[0].name, email: u[0].email, clerkId: u[0].clerkId }
          : null
      };
    })
  );

  return withUsers;
}
