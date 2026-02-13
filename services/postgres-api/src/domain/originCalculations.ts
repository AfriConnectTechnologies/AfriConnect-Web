import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { originCalculations } from "../db/schema";
import { requireUser, toDoc, type RequestContext } from "./helpers";

export async function saveOriginCalculation(
  ctx: RequestContext,
  args: {
    productId?: string;
    productName: string;
    costOfMaterials: number;
    laborCosts: number;
    factoryOverheads: number;
    profitMargin: number;
    nonOriginatingMaterials: number;
    vnmDetails?: string;
    currency: string;
  }
) {
  const user = await requireUser(ctx);
  if (!user.businessId) throw new Error("You don't have a registered business");

  const exWorksPrice =
    args.costOfMaterials + args.laborCosts + args.factoryOverheads + args.profitMargin;
  if (exWorksPrice <= 0) throw new Error("Ex-Works price must be greater than zero");

  const vnmPercentage = (args.nonOriginatingMaterials / exWorksPrice) * 100;
  const isEligible = vnmPercentage <= 60;

  const id = crypto.randomUUID();
  await db.insert(originCalculations).values({
    id,
    businessId: user.businessId,
    productId: args.productId,
    productName: args.productName,
    costOfMaterials: args.costOfMaterials,
    laborCosts: args.laborCosts,
    factoryOverheads: args.factoryOverheads,
    profitMargin: args.profitMargin,
    exWorksPrice,
    nonOriginatingMaterials: args.nonOriginatingMaterials,
    vnmDetails: args.vnmDetails,
    vnmPercentage: Math.round(vnmPercentage * 100) / 100,
    isEligible,
    currency: args.currency,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  const created = await db.select().from(originCalculations).where(eq(originCalculations.id, id)).limit(1);
  return toDoc(created[0] ?? null);
}

export async function updateOriginCalculation(
  ctx: RequestContext,
  args: {
    calculationId: string;
    productId?: string;
    productName: string;
    costOfMaterials: number;
    laborCosts: number;
    factoryOverheads: number;
    profitMargin: number;
    nonOriginatingMaterials: number;
    vnmDetails?: string;
    currency: string;
  }
) {
  const user = await requireUser(ctx);
  if (!user.businessId) throw new Error("You don't have a registered business");

  const calculation = await db
    .select()
    .from(originCalculations)
    .where(eq(originCalculations.id, args.calculationId))
    .limit(1);
  if (!calculation[0]) throw new Error("Calculation not found");
  if (calculation[0].businessId !== user.businessId) {
    throw new Error("Unauthorized: You can only update your own calculations");
  }

  const exWorksPrice =
    args.costOfMaterials + args.laborCosts + args.factoryOverheads + args.profitMargin;
  if (exWorksPrice <= 0) throw new Error("Ex-Works price must be greater than zero");

  const vnmPercentage = (args.nonOriginatingMaterials / exWorksPrice) * 100;
  const isEligible = vnmPercentage <= 60;

  await db.update(originCalculations).set({
    productId: args.productId,
    productName: args.productName,
    costOfMaterials: args.costOfMaterials,
    laborCosts: args.laborCosts,
    factoryOverheads: args.factoryOverheads,
    profitMargin: args.profitMargin,
    exWorksPrice,
    nonOriginatingMaterials: args.nonOriginatingMaterials,
    vnmDetails: args.vnmDetails,
    vnmPercentage: Math.round(vnmPercentage * 100) / 100,
    isEligible,
    currency: args.currency,
    updatedAt: Date.now()
  }).where(eq(originCalculations.id, args.calculationId));

  const updated = await db.select().from(originCalculations).where(eq(originCalculations.id, args.calculationId)).limit(1);
  return toDoc(updated[0] ?? null);
}

export async function deleteOriginCalculation(ctx: RequestContext, args: { calculationId: string }) {
  const user = await requireUser(ctx);
  if (!user.businessId) throw new Error("You don't have a registered business");

  const calculation = await db
    .select()
    .from(originCalculations)
    .where(eq(originCalculations.id, args.calculationId))
    .limit(1);
  if (!calculation[0]) throw new Error("Calculation not found");
  if (calculation[0].businessId !== user.businessId) {
    throw new Error("Unauthorized: You can only delete your own calculations");
  }

  await db.delete(originCalculations).where(eq(originCalculations.id, args.calculationId));
  return { success: true };
}

export async function getMyOriginCalculations(ctx: RequestContext) {
  const user = await requireUser(ctx);
  if (!user.businessId) return [];
  const calculations = await db
    .select()
    .from(originCalculations)
    .where(eq(originCalculations.businessId, user.businessId));
  return calculations.sort((a, b) => b.createdAt - a.createdAt).map((c) => toDoc(c));
}

export async function getOriginCalculation(ctx: RequestContext, args: { calculationId: string }) {
  const user = await requireUser(ctx);
  const calculation = await db
    .select()
    .from(originCalculations)
    .where(eq(originCalculations.id, args.calculationId))
    .limit(1);
  if (!calculation[0]) return null;
  if (calculation[0].businessId !== user.businessId) return null;
  return toDoc(calculation[0] ?? null);
}

export async function getOriginCalculationsSummary(ctx: RequestContext) {
  const user = await requireUser(ctx);
  if (!user.businessId) {
    return { totalCalculations: 0, eligibleCount: 0, notEligibleCount: 0, hasCalculations: false };
  }

  const calculations = await db
    .select()
    .from(originCalculations)
    .where(eq(originCalculations.businessId, user.businessId));

  const eligibleCount = calculations.filter((c) => c.isEligible).length;
  const notEligibleCount = calculations.filter((c) => !c.isEligible).length;

  return {
    totalCalculations: calculations.length,
    eligibleCount,
    notEligibleCount,
    hasCalculations: calculations.length > 0
  };
}

export async function hasOriginCalculations(ctx: RequestContext) {
  const user = await requireUser(ctx);
  if (!user.businessId) return false;
  const calculation = await db
    .select()
    .from(originCalculations)
    .where(eq(originCalculations.businessId, user.businessId))
    .limit(1);
  return calculation.length > 0;
}
