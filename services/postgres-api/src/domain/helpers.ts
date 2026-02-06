import { eq, and, gte } from "drizzle-orm";
import { db } from "../db/client";
import { users, subscriptions, subscriptionPlans, products, orders, originCalculations } from "../db/schema";
import type { AuthContext } from "../auth/clerk";

export type UserRole = "buyer" | "seller" | "admin";

export interface PlanLimits {
  maxProducts: number;
  maxMonthlyOrders: number;
  maxOriginCalculations: number;
  maxHsCodeLookups: number;
  maxTeamMembers: number;
  prioritySupport: "none" | "email" | "chat" | "dedicated";
  analytics: "basic" | "advanced" | "full" | "custom";
  apiAccess: "none" | "limited" | "full";
}

export const DEFAULT_PLAN_LIMITS: PlanLimits = {
  maxProducts: 10,
  maxMonthlyOrders: 50,
  maxOriginCalculations: 5,
  maxHsCodeLookups: 10,
  maxTeamMembers: 1,
  prioritySupport: "none",
  analytics: "basic",
  apiAccess: "none"
};

export interface RequestContext {
  auth: AuthContext;
}

function nowMs() {
  return Date.now();
}

export async function getCurrentUser(ctx: RequestContext) {
  if (!ctx.auth.userId) return null;
  const result = await db.select().from(users).where(eq(users.clerkId, ctx.auth.userId)).limit(1);
  return result[0] ?? null;
}

export async function getOrCreateUser(ctx: RequestContext) {
  if (!ctx.auth.userId) {
    throw new Error("Not authenticated");
  }

  const existing = await db.select().from(users).where(eq(users.clerkId, ctx.auth.userId)).limit(1);
  if (existing[0]) return existing[0];

  const userId = crypto.randomUUID();
  const email = typeof ctx.auth.claims?.email === "string" ? ctx.auth.claims.email : "";
  const name = typeof ctx.auth.claims?.name === "string" ? ctx.auth.claims.name : undefined;
  const imageUrl = typeof ctx.auth.claims?.picture === "string" ? ctx.auth.claims.picture : undefined;

  await db.insert(users).values({
    id: userId,
    clerkId: ctx.auth.userId,
    email,
    name,
    imageUrl,
    role: "buyer"
  });

  const created = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!created[0]) {
    throw new Error("Failed to create user");
  }
  return created[0];
}

export async function requireUser(ctx: RequestContext) {
  const user = await getCurrentUser(ctx);
  if (!user) throw new Error("Not authenticated");
  return user;
}

export async function requireAdmin(ctx: RequestContext) {
  const user = await requireUser(ctx);
  if (user.role !== "admin") throw new Error("Unauthorized: Admin access required");
  return user;
}

export async function requireSeller(ctx: RequestContext) {
  const user = await requireUser(ctx);
  if (user.role !== "seller" && user.role !== "admin") {
    throw new Error("Unauthorized: Seller access required");
  }
  return user;
}

export async function requireRole(ctx: RequestContext, allowedRoles: UserRole[]) {
  const user = await requireUser(ctx);
  if (!user.role || !allowedRoles.includes(user.role as UserRole)) {
    throw new Error(`Unauthorized: Required role: ${allowedRoles.join(" or ")}`);
  }
  return user;
}

export async function getBusinessPlanLimits(businessId: string): Promise<PlanLimits> {
  const subscription = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.businessId, businessId))
    .limit(1);

  const sub = subscription[0];
  if (!sub || sub.status === "cancelled" || sub.status === "expired") {
    return DEFAULT_PLAN_LIMITS;
  }

  const plan = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, sub.planId)).limit(1);
  if (!plan[0]) return DEFAULT_PLAN_LIMITS;

  try {
    const parsed = JSON.parse(plan[0].limits ?? "{}");
    const validated: PlanLimits = {
      maxProducts: typeof parsed.maxProducts === "number" ? parsed.maxProducts : DEFAULT_PLAN_LIMITS.maxProducts,
      maxMonthlyOrders: typeof parsed.maxMonthlyOrders === "number" ? parsed.maxMonthlyOrders : DEFAULT_PLAN_LIMITS.maxMonthlyOrders,
      maxOriginCalculations: typeof parsed.maxOriginCalculations === "number" ? parsed.maxOriginCalculations : DEFAULT_PLAN_LIMITS.maxOriginCalculations,
      maxHsCodeLookups: typeof parsed.maxHsCodeLookups === "number" ? parsed.maxHsCodeLookups : DEFAULT_PLAN_LIMITS.maxHsCodeLookups,
      maxTeamMembers: typeof parsed.maxTeamMembers === "number" ? parsed.maxTeamMembers : DEFAULT_PLAN_LIMITS.maxTeamMembers,
      prioritySupport: ["none", "email", "chat", "dedicated"].includes(parsed.prioritySupport)
        ? parsed.prioritySupport
        : DEFAULT_PLAN_LIMITS.prioritySupport,
      analytics: ["basic", "advanced", "full", "custom"].includes(parsed.analytics)
        ? parsed.analytics
        : DEFAULT_PLAN_LIMITS.analytics,
      apiAccess: ["none", "limited", "full"].includes(parsed.apiAccess)
        ? parsed.apiAccess
        : DEFAULT_PLAN_LIMITS.apiAccess
    };
    return validated;
  } catch {
    return DEFAULT_PLAN_LIMITS;
  }
}

export function isWithinLimit(current: number, limit: number) {
  if (limit === -1) return true;
  return current < limit;
}

export async function checkProductLimit(userId: string) {
  const productRows = await db.select({ id: products.id }).from(products).where(eq(products.sellerId, userId));
  const current = productRows.length;

  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const businessId = user[0]?.businessId ?? null;

  let limits = DEFAULT_PLAN_LIMITS;
  if (businessId) {
    limits = await getBusinessPlanLimits(businessId);
  }

  const unlimited = limits.maxProducts === -1;
  const allowed = isWithinLimit(current, limits.maxProducts);

  return { allowed, current, limit: limits.maxProducts, unlimited };
}

export async function checkOriginCalculationLimit(businessId: string) {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthStartMs = monthStart.getTime();

  const calculations = await db
    .select({ id: originCalculations.id })
    .from(originCalculations)
    .where(and(eq(originCalculations.businessId, businessId), gte(originCalculations.createdAt, monthStartMs)));

  const current = calculations.length;
  const limits = await getBusinessPlanLimits(businessId);
  const unlimited = limits.maxOriginCalculations === -1;
  const allowed = isWithinLimit(current, limits.maxOriginCalculations);

  return { allowed, current, limit: limits.maxOriginCalculations, unlimited };
}

export async function checkOrderLimit(sellerId: string) {
  const seller = await db.select().from(users).where(eq(users.id, sellerId)).limit(1);
  const businessId = seller[0]?.businessId ?? null;

  if (!businessId) {
    return { allowed: true, current: 0, limit: DEFAULT_PLAN_LIMITS.maxMonthlyOrders, unlimited: false };
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthStartMs = monthStart.getTime();

  const ordersRows = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.sellerId, sellerId), gte(orders.createdAt, monthStartMs)));

  const current = ordersRows.length;
  const limits = await getBusinessPlanLimits(businessId);
  const unlimited = limits.maxMonthlyOrders === -1;
  const allowed = isWithinLimit(current, limits.maxMonthlyOrders);

  return { allowed, current, limit: limits.maxMonthlyOrders, unlimited };
}

export class PlanLimitError extends Error {
  constructor(public feature: string, public current: number, public limit: number) {
    super(`You've reached your ${feature} limit (${current}/${limit}). Please upgrade your plan to continue.`);
    this.name = "PlanLimitError";
  }
}

export function toDoc<T extends { id: string }>(row: T | null) {
  if (!row) return null;
  const { id, ...rest } = row as T & { id: string };
  return { _id: id, ...rest };
}

export function toDocs<T extends { id: string }>(rows: T[]) {
  return rows.map((row) => toDoc(row));
}
