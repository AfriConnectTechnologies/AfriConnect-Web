import { and, eq, lt, ne } from "drizzle-orm";
import { db } from "../db/client";
import { businesses, orders, originCalculations, products, subscriptionPlans, subscriptions, users } from "../db/schema";
import { DEFAULT_PLAN_LIMITS, PlanLimits } from "./subscriptionPlans";
import { getCurrentUser, requireAdmin, requireUser, toDoc, type RequestContext } from "./helpers";

export async function getCurrentSubscription(ctx: RequestContext) {
  const user = await getCurrentUser(ctx);
  if (!user || !user.businessId) return null;

  const subscription = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.businessId, user.businessId))
    .limit(1);
  if (!subscription[0]) return null;

  const plan = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, subscription[0].planId)).limit(1);
  return { ...toDoc(subscription[0] ?? null), plan: plan[0] ? toDoc(plan[0]) : null };
}

export async function getByBusiness(ctx: RequestContext, args: { businessId: string }) {
  void ctx;
  const subscription = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.businessId, args.businessId))
    .limit(1);
  if (!subscription[0]) return null;
  const plan = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, subscription[0].planId)).limit(1);
  return { ...toDoc(subscription[0] ?? null), plan: plan[0] ? toDoc(plan[0]) : null };
}

export async function getById(ctx: RequestContext, args: { subscriptionId: string }) {
  void ctx;
  const subscription = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.id, args.subscriptionId))
    .limit(1);
  if (!subscription[0]) return null;
  const plan = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, subscription[0].planId)).limit(1);
  return { ...toDoc(subscription[0] ?? null), plan: plan[0] ? toDoc(plan[0]) : null };
}

export async function create(
  ctx: RequestContext,
  args: {
    businessId: string;
    planId: string;
    billingCycle: "monthly" | "annual";
    paymentId?: string;
    startTrial?: boolean;
  }
) {
  const user = await requireUser(ctx);
  const business = await db.select().from(businesses).where(eq(businesses.id, args.businessId)).limit(1);
  if (!business[0] || business[0].ownerId !== user.id) {
    throw new Error("Unauthorized: You can only create subscriptions for your own business");
  }

  const existing = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.businessId, args.businessId))
    .limit(1);
  if (existing[0] && (existing[0].status === "active" || existing[0].status === "trialing")) {
    throw new Error("Business already has an active subscription");
  }

  const plan = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, args.planId)).limit(1);
  if (!plan[0] || !plan[0].isActive) throw new Error("Invalid or inactive plan");

  const now = Date.now();
  const periodDays = args.billingCycle === "annual" ? 365 : 30;
  const periodMs = periodDays * 24 * 60 * 60 * 1000;
  const trialDays = 14;
  const trialMs = trialDays * 24 * 60 * 60 * 1000;

  const subscriptionId = crypto.randomUUID();
  await db.insert(subscriptions).values({
    id: subscriptionId,
    businessId: args.businessId,
    planId: args.planId,
    status: args.startTrial ? "trialing" : "active",
    billingCycle: args.billingCycle,
    currentPeriodStart: now,
    currentPeriodEnd: args.startTrial ? now + trialMs : now + periodMs,
    cancelAtPeriodEnd: false,
    trialEndsAt: args.startTrial ? now + trialMs : undefined,
    lastPaymentId: args.paymentId,
    createdAt: now,
    updatedAt: now
  });

  if (existing[0]) {
    await db.delete(subscriptions).where(eq(subscriptions.id, existing[0].id));
  }

  return subscriptionId;
}

export async function activateAfterPayment(ctx: RequestContext, args: { subscriptionId: string; paymentId: string }) {
  void ctx;
  const subscription = await db.select().from(subscriptions).where(eq(subscriptions.id, args.subscriptionId)).limit(1);
  if (!subscription[0]) throw new Error("Subscription not found");

  const now = Date.now();
  const periodDays = subscription[0].billingCycle === "annual" ? 365 : 30;
  const periodMs = periodDays * 24 * 60 * 60 * 1000;

  await db
    .update(subscriptions)
    .set({
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: now + periodMs,
      lastPaymentId: args.paymentId,
      trialEndsAt: undefined,
      updatedAt: now
    })
    .where(eq(subscriptions.id, args.subscriptionId));

  const updated = await db.select().from(subscriptions).where(eq(subscriptions.id, args.subscriptionId)).limit(1);
  return toDoc(updated[0] ?? null);
}

export async function cancel(ctx: RequestContext, args: { subscriptionId: string }) {
  const user = await requireUser(ctx);
  const subscription = await db.select().from(subscriptions).where(eq(subscriptions.id, args.subscriptionId)).limit(1);
  if (!subscription[0]) throw new Error("Subscription not found");

  const business = await db.select().from(businesses).where(eq(businesses.id, subscription[0].businessId)).limit(1);
  if (!business[0] || business[0].ownerId !== user.id) throw new Error("Unauthorized");
  if (subscription[0].status === "cancelled") throw new Error("Subscription is already cancelled");

  await db
    .update(subscriptions)
    .set({
      cancelAtPeriodEnd: true,
      cancelledAt: Date.now(),
      updatedAt: Date.now()
    })
    .where(eq(subscriptions.id, args.subscriptionId));

  const updated = await db.select().from(subscriptions).where(eq(subscriptions.id, args.subscriptionId)).limit(1);
  return toDoc(updated[0] ?? null);
}

export async function reactivate(ctx: RequestContext, args: { subscriptionId: string }) {
  const user = await requireUser(ctx);
  const subscription = await db.select().from(subscriptions).where(eq(subscriptions.id, args.subscriptionId)).limit(1);
  if (!subscription[0]) throw new Error("Subscription not found");

  const business = await db.select().from(businesses).where(eq(businesses.id, subscription[0].businessId)).limit(1);
  if (!business[0] || business[0].ownerId !== user.id) throw new Error("Unauthorized");

  if (subscription[0].status === "cancelled" || subscription[0].status === "expired") {
    throw new Error("Cannot reactivate cancelled or expired subscription. Please start a new subscription.");
  }
  if (!subscription[0].cancelAtPeriodEnd) throw new Error("Subscription is not pending cancellation");

  await db
    .update(subscriptions)
    .set({
      cancelAtPeriodEnd: false,
      cancelledAt: undefined,
      updatedAt: Date.now()
    })
    .where(eq(subscriptions.id, args.subscriptionId));

  const updated = await db.select().from(subscriptions).where(eq(subscriptions.id, args.subscriptionId)).limit(1);
  return toDoc(updated[0] ?? null);
}

export async function changePlan(ctx: RequestContext, args: { subscriptionId: string; newPlanId: string }) {
  const user = await requireUser(ctx);
  const subscription = await db.select().from(subscriptions).where(eq(subscriptions.id, args.subscriptionId)).limit(1);
  if (!subscription[0]) throw new Error("Subscription not found");

  const business = await db.select().from(businesses).where(eq(businesses.id, subscription[0].businessId)).limit(1);
  if (!business[0] || business[0].ownerId !== user.id) throw new Error("Unauthorized");

  if (subscription[0].status !== "active" && subscription[0].status !== "trialing") {
    throw new Error("Can only change plan on active subscriptions");
  }

  const currentPlan = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, subscription[0].planId)).limit(1);
  const newPlan = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, args.newPlanId)).limit(1);
  if (!newPlan[0] || !newPlan[0].isActive) throw new Error("Invalid or inactive plan");

  await db.update(subscriptions).set({ planId: args.newPlanId, updatedAt: Date.now() }).where(eq(subscriptions.id, args.subscriptionId));

  const updated = await db.select().from(subscriptions).where(eq(subscriptions.id, args.subscriptionId)).limit(1);
  return toDoc(updated[0] ?? null);
}

export async function updateStatus(
  ctx: RequestContext,
  args: { subscriptionId: string; status: "active" | "past_due" | "cancelled" | "trialing" | "expired" }
) {
  if (!ctx.auth.userId) throw new Error("Unauthorized: Authentication required");
  const user = await db.select().from(users).where(eq(users.clerkId, ctx.auth.userId)).limit(1);
  if (!user[0] || user[0].role !== "admin") throw new Error("Unauthorized: Admin access required");

  const subscription = await db.select().from(subscriptions).where(eq(subscriptions.id, args.subscriptionId)).limit(1);
  if (!subscription[0]) throw new Error("Subscription not found");

  await db.update(subscriptions).set({ status: args.status, updatedAt: Date.now() }).where(eq(subscriptions.id, args.subscriptionId));
  const updated = await db.select().from(subscriptions).where(eq(subscriptions.id, args.subscriptionId)).limit(1);
  return toDoc(updated[0] ?? null);
}

export async function hasActiveSubscription(ctx: RequestContext, args: { businessId: string }) {
  void ctx;
  const subscription = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.businessId, args.businessId))
    .limit(1);
  if (!subscription[0]) return false;
  return subscription[0].status === "active" || subscription[0].status === "trialing";
}

export async function getBusinessLimits(ctx: RequestContext, args: { businessId: string }) {
  void ctx;
  const subscription = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.businessId, args.businessId))
    .limit(1);

  if (!subscription[0] || subscription[0].status === "cancelled" || subscription[0].status === "expired") {
    return DEFAULT_PLAN_LIMITS.starter;
  }

  const plan = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, subscription[0].planId)).limit(1);
  if (!plan[0]) return DEFAULT_PLAN_LIMITS.starter;

  try {
    return JSON.parse(plan[0].limits) as PlanLimits;
  } catch {
    return DEFAULT_PLAN_LIMITS.starter;
  }
}

export async function listAll(
  ctx: RequestContext,
  args: { status?: "active" | "past_due" | "cancelled" | "trialing" | "expired" }
) {
  await requireAdmin(ctx);

  const subs = args.status
    ? await db.select().from(subscriptions).where(eq(subscriptions.status, args.status))
    : await db.select().from(subscriptions);

  const enriched = await Promise.all(
    subs.map(async (sub) => {
      const plan = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, sub.planId)).limit(1);
      const business = await db.select().from(businesses).where(eq(businesses.id, sub.businessId)).limit(1);
      return { ...toDoc(sub), plan: plan[0] ? toDoc(plan[0]) : null, business: business[0] ? toDoc(business[0]) : null };
    })
  );

  return enriched;
}

export async function processExpiredSubscriptions(ctx: RequestContext) {
  void ctx;
  const now = Date.now();

  const expiredTrials = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.status, "trialing"), lt(subscriptions.currentPeriodEnd, now)));

  const cancelledAtEnd = await db
    .select()
    .from(subscriptions)
    .where(
      and(eq(subscriptions.cancelAtPeriodEnd, true), lt(subscriptions.currentPeriodEnd, now), ne(subscriptions.status, "cancelled"))
    );

  let processed = 0;
  for (const sub of expiredTrials) {
    await db.update(subscriptions).set({ status: "expired", updatedAt: now }).where(eq(subscriptions.id, sub.id));
    processed++;
  }

  for (const sub of cancelledAtEnd) {
    await db.update(subscriptions).set({ status: "cancelled", updatedAt: now }).where(eq(subscriptions.id, sub.id));
    processed++;
  }

  return { processed };
}

export async function getUsageStats(ctx: RequestContext, args: { businessId: string }) {
  if (!ctx.auth.userId) throw new Error("Unauthorized: Authentication required");
  const user = await db.select().from(users).where(eq(users.clerkId, ctx.auth.userId)).limit(1);
  if (!user[0]) throw new Error("User not found");

  const business = await db.select().from(businesses).where(eq(businesses.id, args.businessId)).limit(1);
  if (!business[0]) throw new Error("Business not found");
  if (business[0].ownerId !== user[0].id && user[0].role !== "admin") {
    throw new Error("Unauthorized: You don't have access to this business");
  }

  const subscription = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.businessId, args.businessId))
    .limit(1);

  const productsList = await db.select().from(products).where(eq(products.sellerId, business[0].ownerId));

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthStartMs = monthStart.getTime();

  const ordersList = await db.select().from(orders).where(eq(orders.sellerId, business[0].ownerId));
  const ordersThisMonth = ordersList.filter((o) => o.createdAt >= monthStartMs);

  const calculations = await db
    .select()
    .from(originCalculations)
    .where(eq(originCalculations.businessId, args.businessId));
  const calculationsThisMonth = calculations.filter((c) => c.createdAt >= monthStartMs);

  let limits = DEFAULT_PLAN_LIMITS.starter;
  if (subscription[0] && subscription[0].status !== "cancelled" && subscription[0].status !== "expired") {
    const plan = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, subscription[0].planId)).limit(1);
    if (plan[0]) {
      try {
        limits = JSON.parse(plan[0].limits) as PlanLimits;
      } catch {
        // use default
      }
    }
  }

  return {
    products: { used: productsList.length, limit: limits.maxProducts, unlimited: limits.maxProducts === -1 },
    orders: { used: ordersThisMonth.length, limit: limits.maxMonthlyOrders, unlimited: limits.maxMonthlyOrders === -1 },
    originCalculations: {
      used: calculationsThisMonth.length,
      limit: limits.maxOriginCalculations,
      unlimited: limits.maxOriginCalculations === -1
    }
  };
}
