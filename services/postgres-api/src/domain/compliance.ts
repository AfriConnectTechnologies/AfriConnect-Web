import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { businessProducts } from "../db/schema";
import { requireUser, toDoc, type RequestContext } from "./helpers";

export async function addBusinessProduct(
  ctx: RequestContext,
  args: {
    hsCode: string;
    productName: string;
    productNameAmharic?: string;
    isCompliant: boolean;
    currentRate?: string;
    rates?: string;
    country?: string;
  }
) {
  const user = await requireUser(ctx);
  if (!user.businessId) throw new Error("You don't have a registered business");

  const existing = await db
    .select()
    .from(businessProducts)
    .where(
      and(
        eq(businessProducts.businessId, user.businessId),
        eq(businessProducts.hsCode, args.hsCode),
        eq(businessProducts.country, args.country || "ethiopia")
      )
    )
    .limit(1);

  if (existing[0]) {
    throw new Error("This HS code is already added to your business for this country");
  }

  const id = crypto.randomUUID();
  await db.insert(businessProducts).values({
    id,
    businessId: user.businessId,
    hsCode: args.hsCode,
    productName: args.productName,
    productNameAmharic: args.productNameAmharic,
    isCompliant: args.isCompliant,
    currentRate: args.currentRate,
    rates: args.rates,
    country: args.country || "ethiopia",
    createdAt: Date.now()
  });

  const created = await db.select().from(businessProducts).where(eq(businessProducts.id, id)).limit(1);
  return toDoc(created[0] ?? null);
}

export async function removeBusinessProduct(ctx: RequestContext, args: { productId: string }) {
  const user = await requireUser(ctx);
  if (!user.businessId) throw new Error("You don't have a registered business");

  const product = await db.select().from(businessProducts).where(eq(businessProducts.id, args.productId)).limit(1);
  if (!product[0]) throw new Error("Product not found");
  if (product[0].businessId !== user.businessId) {
    throw new Error("Unauthorized: You can only remove your own products");
  }

  await db.delete(businessProducts).where(eq(businessProducts.id, args.productId));
  return { success: true };
}

export async function getMyBusinessProducts(ctx: RequestContext) {
  const user = await requireUser(ctx);
  if (!user.businessId) return [];
  const productsList = await db
    .select()
    .from(businessProducts)
    .where(eq(businessProducts.businessId, user.businessId));
  return productsList.sort((a, b) => b.createdAt - a.createdAt).map((p) => toDoc(p));
}

export async function getBusinessProducts(ctx: RequestContext, args: { businessId: string }) {
  void ctx;
  const productsList = await db
    .select()
    .from(businessProducts)
    .where(eq(businessProducts.businessId, args.businessId));
  return productsList.sort((a, b) => b.createdAt - a.createdAt).map((p) => toDoc(p));
}

export async function getComplianceSummary(ctx: RequestContext) {
  const user = await requireUser(ctx);
  if (!user.businessId) {
    return { totalProducts: 0, compliantProducts: 0, nonCompliantProducts: 0, hasCompletedCheck: false };
  }

  const productsList = await db
    .select()
    .from(businessProducts)
    .where(eq(businessProducts.businessId, user.businessId));
  const compliant = productsList.filter((p) => p.isCompliant);
  const nonCompliant = productsList.filter((p) => !p.isCompliant);

  return {
    totalProducts: productsList.length,
    compliantProducts: compliant.length,
    nonCompliantProducts: nonCompliant.length,
    hasCompletedCheck: productsList.length > 0
  };
}

export async function hasCompletedComplianceCheck(ctx: RequestContext) {
  const user = await requireUser(ctx);
  if (!user.businessId) return false;
  const product = await db
    .select()
    .from(businessProducts)
    .where(eq(businessProducts.businessId, user.businessId))
    .limit(1);
  return product.length > 0;
}
