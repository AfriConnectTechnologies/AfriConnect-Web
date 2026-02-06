import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { subscriptionPlans, subscriptions } from "../db/schema";
import { requireAdmin, toDoc, type RequestContext } from "./helpers";
import { DEFAULT_PLAN_LIMITS } from "./planLimits";

export { DEFAULT_PLAN_LIMITS } from "./planLimits";
export type { PlanLimits } from "./planLimits";

export async function list(ctx: RequestContext) {
  void ctx;
  const plans = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
  return plans.sort((a, b) => a.sortOrder - b.sortOrder).map((p) => toDoc(p));
}

export async function listAll(ctx: RequestContext) {
  await requireAdmin(ctx);
  const plans = await db.select().from(subscriptionPlans);
  return plans.sort((a, b) => a.sortOrder - b.sortOrder).map((p) => toDoc(p));
}

export async function getBySlug(ctx: RequestContext, args: { slug: string }) {
  void ctx;
  const plan = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.slug, args.slug)).limit(1);
  return toDoc(plan[0] ?? null);
}

export async function getById(ctx: RequestContext, args: { planId: string }) {
  void ctx;
  const plan = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, args.planId)).limit(1);
  return toDoc(plan[0] ?? null);
}

export async function create(
  ctx: RequestContext,
  args: {
    name: string;
    slug: string;
    description?: string;
    targetCustomer?: string;
    monthlyPrice: number;
    annualPrice: number;
    currency: string;
    features: string;
    limits: string;
    isActive: boolean;
    isPopular?: boolean;
    sortOrder: number;
  }
) {
  await requireAdmin(ctx);

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(args.slug)) {
    throw new Error("Slug must be lowercase alphanumeric with optional hyphens (kebab-case)");
  }
  if (args.monthlyPrice < 0 || args.annualPrice < 0) {
    throw new Error("Prices must be non-negative numbers");
  }
  if (args.annualPrice > args.monthlyPrice * 12) {
    throw new Error("Annual price cannot exceed monthly price × 12");
  }
  try {
    const features = JSON.parse(args.features);
    if (!Array.isArray(features)) throw new Error("Features must be a JSON array");
  } catch (e) {
    throw new Error("Invalid features JSON: " + (e instanceof Error ? e.message : "Parse error"));
  }
  try {
    JSON.parse(args.limits);
  } catch (e) {
    throw new Error("Invalid limits JSON: " + (e instanceof Error ? e.message : "Parse error"));
  }

  const existing = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.slug, args.slug)).limit(1);
  if (existing[0]) throw new Error(`Plan with slug "${args.slug}" already exists`);

  const now = Date.now();
  const planId = crypto.randomUUID();
  await db.insert(subscriptionPlans).values({
    id: planId,
    name: args.name,
    slug: args.slug,
    description: args.description,
    targetCustomer: args.targetCustomer,
    monthlyPrice: args.monthlyPrice,
    annualPrice: args.annualPrice,
    currency: args.currency,
    features: args.features,
    limits: args.limits,
    isActive: args.isActive,
    isPopular: args.isPopular,
    sortOrder: args.sortOrder,
    createdAt: now,
    updatedAt: now
  });

  return planId;
}

export async function update(
  ctx: RequestContext,
  args: {
    planId: string;
    name?: string;
    description?: string;
    targetCustomer?: string;
    monthlyPrice?: number;
    annualPrice?: number;
    features?: string;
    limits?: string;
    isActive?: boolean;
    isPopular?: boolean;
    sortOrder?: number;
  }
) {
  await requireAdmin(ctx);
  const plan = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, args.planId)).limit(1);
  if (!plan[0]) throw new Error("Plan not found");

  const { planId, ...updates } = args;
  const validUpdates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) validUpdates[key] = value;
  }

  await db.update(subscriptionPlans).set({ ...validUpdates, updatedAt: Date.now() }).where(eq(subscriptionPlans.id, planId));
  const updated = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId)).limit(1);
  return toDoc(updated[0] ?? null);
}

const CANONICAL_USD_PRICES: Record<string, { monthlyPrice: number; annualPrice: number; targetCustomer: string }> = {
  starter: { monthlyPrice: 2900, annualPrice: 27800, targetCustomer: "Small SMBs" },
  growth: { monthlyPrice: 7900, annualPrice: 75800, targetCustomer: "Growing SMBs" },
  pro: { monthlyPrice: 14900, annualPrice: 143000, targetCustomer: "Mid-Market" },
  enterprise: { monthlyPrice: 0, annualPrice: 0, targetCustomer: "Large orgs" }
};

export async function updatePricesToUsd(ctx: RequestContext) {
  await requireAdmin(ctx);
  const plans = await db.select().from(subscriptionPlans);
  let updated = 0;
  for (const plan of plans) {
    const canonical = CANONICAL_USD_PRICES[plan.slug];
    if (canonical) {
      await db.update(subscriptionPlans).set({
        monthlyPrice: canonical.monthlyPrice,
        annualPrice: canonical.annualPrice,
        currency: "USD",
        targetCustomer: canonical.targetCustomer,
        updatedAt: Date.now()
      }).where(eq(subscriptionPlans.id, plan.id));
      updated++;
    }
  }
  return { updated };
}

export async function deleteAll(ctx: RequestContext, args: { force?: boolean }) {
  void args;
  await requireAdmin(ctx);
  const existingPlans = await db.select().from(subscriptionPlans);
  if (existingPlans.length === 0) return { deleted: 0 };

  const allSubs = await db.select().from(subscriptions);
  const hasActiveSubscriptions = allSubs.some((sub) => sub.status === "active" || sub.status === "trialing");
  if (hasActiveSubscriptions) {
    throw new Error("Cannot delete plans while active subscriptions exist");
  }

  let deleted = 0;
  for (const plan of existingPlans) {
    await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, plan.id));
    deleted++;
  }

  return { deleted };
}

export async function seedPlans(ctx: RequestContext) {
  const existingPlans = await db.select().from(subscriptionPlans);
  if (existingPlans.length > 0) {
    await requireAdmin(ctx);
    throw new Error("Plans already exist. Delete existing plans first.");
  }

  const now = Date.now();
  const plans = [
    {
      name: "Starter",
      slug: "starter",
      description: "Perfect for small businesses just getting started",
      targetCustomer: "Small SMBs",
      monthlyPrice: 2900,
      annualPrice: 27800,
      currency: "USD",
      features: JSON.stringify([
        "Up to 10 products",
        "50 orders per month",
        "5 origin calculations",
        "Basic analytics",
        "Email support"
      ]),
      limits: JSON.stringify(DEFAULT_PLAN_LIMITS.starter),
      isActive: true,
      isPopular: false,
      sortOrder: 1,
      createdAt: now,
      updatedAt: now
    },
    {
      name: "Growth",
      slug: "growth",
      description: "For growing businesses ready to scale",
      targetCustomer: "Growing SMBs",
      monthlyPrice: 7900,
      annualPrice: 75800,
      currency: "USD",
      features: JSON.stringify([
        "Up to 50 products",
        "200 orders per month",
        "25 origin calculations",
        "Advanced analytics",
        "Priority email support",
        "Limited API access"
      ]),
      limits: JSON.stringify(DEFAULT_PLAN_LIMITS.growth),
      isActive: true,
      isPopular: true,
      sortOrder: 2,
      createdAt: now,
      updatedAt: now
    },
    {
      name: "Pro",
      slug: "pro",
      description: "Full-featured plan for established businesses",
      targetCustomer: "Mid-Market",
      monthlyPrice: 14900,
      annualPrice: 143000,
      currency: "USD",
      features: JSON.stringify([
        "Up to 200 products",
        "1,000 orders per month",
        "100 origin calculations",
        "Full analytics suite",
        "Chat support",
        "Full API access",
        "Team collaboration"
      ]),
      limits: JSON.stringify(DEFAULT_PLAN_LIMITS.pro),
      isActive: true,
      isPopular: false,
      sortOrder: 3,
      createdAt: now,
      updatedAt: now
    },
    {
      name: "Enterprise",
      slug: "enterprise",
      description: "Custom solutions for large organizations",
      targetCustomer: "Large orgs",
      monthlyPrice: 0,
      annualPrice: 0,
      currency: "USD",
      features: JSON.stringify([
        "Unlimited products",
        "Unlimited orders",
        "Unlimited origin calculations",
        "Custom analytics & reporting",
        "Dedicated account manager",
        "Full API access",
        "Custom integrations",
        "SLA guarantee"
      ]),
      limits: JSON.stringify(DEFAULT_PLAN_LIMITS.enterprise),
      isActive: true,
      isPopular: false,
      sortOrder: 4,
      createdAt: now,
      updatedAt: now
    }
  ];

  const createdIds: string[] = [];
  for (const plan of plans) {
    const id = crypto.randomUUID();
    await db.insert(subscriptionPlans).values({ id, ...plan });
    createdIds.push(id);
  }

  return { created: createdIds.length, ids: createdIds };
}

export async function calculatePrice(
  ctx: RequestContext,
  args: { planId: string; billingCycle: "monthly" | "annual" }
) {
  void ctx;
  const plan = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, args.planId)).limit(1);
  if (!plan[0]) throw new Error("Plan not found");

  const price = args.billingCycle === "annual" ? plan[0].annualPrice : plan[0].monthlyPrice;
  const savings = args.billingCycle === "annual" ? plan[0].monthlyPrice * 12 - plan[0].annualPrice : 0;
  const annualEquivalent = plan[0].monthlyPrice * 12;
  const savingsPercent = savings > 0 && annualEquivalent > 0 ? Math.round((savings / annualEquivalent) * 100) : 0;

  return {
    price,
    currency: plan[0].currency,
    billingCycle: args.billingCycle,
    savings,
    savingsPercent
  };
}
