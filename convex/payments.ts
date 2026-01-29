import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getOrCreateUser } from "./helpers";
import { Id } from "./_generated/dataModel";

// Generate a unique transaction reference
function generateTxRef(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `AC-${timestamp}-${random}`;
}

// Create a pending payment record (stores cart snapshot for later order creation)
export const create = mutation({
  args: {
    amount: v.number(),
    currency: v.string(),
    paymentType: v.union(v.literal("order"), v.literal("subscription")),
    metadata: v.optional(v.string()),
    idempotencyKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);
    const now = Date.now();
    const txRef = generateTxRef();

    // For order payments, snapshot the cart items
    let cartSnapshot: string | undefined;
    if (args.paymentType === "order") {
      const cartItems = await ctx.db
        .query("cartItems")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();

      if (cartItems.length === 0) {
        throw new Error("Cart is empty");
      }

      // Build cart snapshot with product details
      const cartData = [];
      for (const item of cartItems) {
        const product = await ctx.db.get(item.productId);
        if (!product) continue;
        if (product.status !== "active") {
          throw new Error(`Product ${product.name} is no longer available`);
        }
        if (item.quantity > product.quantity) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }
        cartData.push({
          productId: item.productId,
          quantity: item.quantity,
          price: product.price,
          sellerId: product.sellerId,
          productName: product.name,
        });
      }
      cartSnapshot = JSON.stringify(cartData);
    }

    const paymentId = await ctx.db.insert("payments", {
      userId: user._id,
      chapaTransactionRef: txRef,
      amount: args.amount,
      currency: args.currency,
      status: "pending",
      paymentType: args.paymentType,
      metadata: cartSnapshot || args.metadata,
      idempotencyKey: args.idempotencyKey,
      createdAt: now,
      updatedAt: now,
    });

    const payment = await ctx.db.get(paymentId);
    return {
      ...payment,
      txRef,
      user: {
        email: user.email,
        name: user.name,
      },
    };
  },
});

// Update payment status after verification
export const updateStatus = mutation({
  args: {
    txRef: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("success"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    chapaTrxRef: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_chapa_ref", (q) => q.eq("chapaTransactionRef", args.txRef))
      .first();

    if (!payment) {
      throw new Error("Payment not found");
    }

    // Don't re-process if already successful
    if (payment.status === "success") {
      return await ctx.db.get(payment._id);
    }

    await ctx.db.patch(payment._id, {
      status: args.status,
      chapaTrxRef: args.chapaTrxRef,
      updatedAt: Date.now(),
    });

    // If payment successful, handle based on payment type
    if (args.status === "success") {
      // Handle subscription payments
      if (payment.paymentType === "subscription" && payment.metadata) {
        try {
          const metadata = JSON.parse(payment.metadata);
          const { planId, billingCycle, businessId } = metadata;
          
          if (planId && businessId) {
            // Check for existing subscription
            const existingSub = await ctx.db
              .query("subscriptions")
              .withIndex("by_business", (q) => q.eq("businessId", businessId))
              .first();
            
            const now = Date.now();
            const periodDays = billingCycle === "annual" ? 365 : 30;
            const periodMs = periodDays * 24 * 60 * 60 * 1000;
            
            if (existingSub) {
              // Update existing subscription
              await ctx.db.patch(existingSub._id, {
                planId: planId,
                status: "active",
                billingCycle: billingCycle || "monthly",
                currentPeriodStart: now,
                currentPeriodEnd: now + periodMs,
                lastPaymentId: payment._id,
                cancelAtPeriodEnd: false,
                trialEndsAt: undefined,
                updatedAt: now,
              });
            } else {
              // Create new subscription
              await ctx.db.insert("subscriptions", {
                businessId: businessId,
                planId: planId,
                status: "active",
                billingCycle: billingCycle || "monthly",
                currentPeriodStart: now,
                currentPeriodEnd: now + periodMs,
                cancelAtPeriodEnd: false,
                lastPaymentId: payment._id,
                createdAt: now,
                updatedAt: now,
              });
            }
          }
        } catch (subError) {
          console.error("Failed to process subscription payment:", subError);
        }
      }
      
      // Handle order payments
      if (payment.paymentType === "order" && payment.metadata) {
        const now = Date.now();

        // Parse cart snapshot
        let cartData: Array<{
          productId: string;
          quantity: number;
          price: number;
          sellerId: string;
          productName: string;
        }>;

        try {
          cartData = JSON.parse(payment.metadata);
        } catch {
          console.error("Failed to parse cart snapshot");
          return await ctx.db.get(payment._id);
        }

        // Get user info
        const user = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("_id"), payment.userId))
          .first();

        if (!user) {
          console.error("User not found for payment");
          return await ctx.db.get(payment._id);
        }

        // Group items by seller
        const itemsBySeller = new Map<string, typeof cartData>();
        for (const item of cartData) {
          if (!itemsBySeller.has(item.sellerId)) {
            itemsBySeller.set(item.sellerId, []);
          }
          itemsBySeller.get(item.sellerId)!.push(item);
        }

        const createdOrderIds: Id<"orders">[] = [];

        // Create one order per seller
        for (const [sellerId, items] of itemsBySeller.entries()) {
          let totalAmount = 0;
          const orderItems = [];

          for (const item of items) {
            const itemTotal = item.price * item.quantity;
            totalAmount += itemTotal;
            orderItems.push({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            });
          }

          // Get seller info
          const seller = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("_id"), sellerId))
            .first();
          const sellerName = seller?.name || seller?.email || "Unknown Seller";

          // Create order
          const orderId = await ctx.db.insert("orders", {
            userId: user._id,
            buyerId: user._id,
            sellerId: sellerId,
            title: `Order from ${sellerName}`,
            customer: user.name || user.email,
            amount: totalAmount,
            status: "processing", // Already paid
            description: `Order containing ${items.length} item(s) - Payment ref: ${payment.chapaTransactionRef}`,
            createdAt: now,
            updatedAt: now,
          });

          createdOrderIds.push(orderId);

          // Create order items and update product quantities
          for (const item of orderItems) {
            const productId = item.productId as Id<"products">;

            await ctx.db.insert("orderItems", {
              orderId,
              productId,
              quantity: item.quantity,
              price: item.price,
              createdAt: now,
            });

            // Update product quantity
            const product = await ctx.db.get(productId);
            if (product) {
              const newQuantity = Math.max(0, product.quantity - item.quantity);
              await ctx.db.patch(productId, {
                quantity: newQuantity,
                updatedAt: now,
              });
            }
          }
        }

        // Clear user's cart
        const cartItems = await ctx.db
          .query("cartItems")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();

        for (const cartItem of cartItems) {
          await ctx.db.delete(cartItem._id);
        }

        // Update payment with first order ID for reference
        if (createdOrderIds.length > 0) {
          await ctx.db.patch(payment._id, {
            orderId: createdOrderIds[0],
            updatedAt: Date.now(),
          });
        }
      }
    }

    return await ctx.db.get(payment._id);
  },
});

// Get payment by transaction reference
export const getByTxRef = query({
  args: { txRef: v.string() },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_chapa_ref", (q) => q.eq("chapaTransactionRef", args.txRef))
      .first();

    return payment;
  },
});

// Get payment by idempotency key (for deduplication)
export const getByIdempotencyKey = query({
  args: {
    idempotencyKey: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user by clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.userId))
      .first();

    if (!user) return null;

    // Find payment with matching idempotency key for this user
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("idempotencyKey"), args.idempotencyKey))
      .first();

    if (!payments) return null;

    // Return payment with checkout URL placeholder (actual URL would be from Chapa)
    return {
      ...payments,
      checkoutUrl: null, // This would need to be stored if we want to return it
    };
  },
});

// List user's payments
export const list = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("success"),
        v.literal("failed"),
        v.literal("cancelled")
      )
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    let payments = await ctx.db
      .query("payments")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    if (args.status) {
      payments = payments.filter((p) => p.status === args.status);
    }

    return payments.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Get payment with order details
export const getWithOrder = query({
  args: { paymentId: v.id("payments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    const payment = await ctx.db.get(args.paymentId);
    if (!payment) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || payment.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    let order = null;
    if (payment.orderId) {
      order = await ctx.db.get(payment.orderId);
    }

    return {
      ...payment,
      order,
    };
  },
});

// Get payment by ID (admin only)
export const getById = query({
  args: { paymentId: v.id("payments") },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.paymentId);
    return payment;
  },
});

// Record a refund (admin only)
export const recordRefund = mutation({
  args: {
    paymentId: v.id("payments"),
    refundAmount: v.number(),
    refundReason: v.string(),
    refundReference: v.string(),
    adminUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) {
      throw new Error("Payment not found");
    }

    // Update payment with refund info
    await ctx.db.patch(args.paymentId, {
      refundedAt: Date.now(),
      refundAmount: args.refundAmount,
      refundReason: args.refundReason,
      refundReference: args.refundReference,
      refundedByUserId: args.adminUserId,
    });

    return { success: true };
  },
});

// List subscription payments (admin only for refund management)
export const listSubscriptionPayments = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const payments = await ctx.db
      .query("payments")
      .filter((q) => q.eq(q.field("paymentType"), "subscription"))
      .order("desc")
      .take(limit);

    // Get user details for each payment
    const paymentsWithUsers = await Promise.all(
      payments.map(async (payment) => {
        // userId is stored as string in schema but represents Id<"users">
        const user = await ctx.db.get(payment.userId as Id<"users">);
        return {
          ...payment,
          user: user ? { 
            name: user.name, 
            email: user.email,
            clerkId: user.clerkId,
          } : null,
        };
      })
    );

    return paymentsWithUsers;
  },
});

