import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { businesses, productImages, products, users } from "../db/schema";
import { type RequestContext, toDoc } from "./helpers";

export async function listBusinesses(
  ctx: RequestContext,
  args: { country?: string; category?: string; search?: string; limit?: number }
) {
  void ctx;
  let result = await db.select().from(businesses).where(eq(businesses.verificationStatus, "verified"));

  if (args.country) result = result.filter((b) => b.country === args.country);
  if (args.category) result = result.filter((b) => b.category === args.category);
  if (args.search) {
    const searchLower = args.search.toLowerCase();
    result = result.filter(
      (b) => b.name.toLowerCase().includes(searchLower) || b.description?.toLowerCase().includes(searchLower)
    );
  }

  const sorted = result.sort((a, b) => b.createdAt - a.createdAt);
  const limited = args.limit && args.limit > 0 ? sorted.slice(0, args.limit) : sorted;

  const withStats = await Promise.all(
    limited.map(async (business) => {
      const owner = await db.select().from(users).where(eq(users.id, business.ownerId)).limit(1);
      let productCount = 0;
      if (owner[0]) {
        const productsList = await db
          .select()
          .from(products)
          .where(and(eq(products.sellerId, owner[0].id), eq(products.status, "active")));
        productCount = productsList.length;
      }
      return { ...toDoc(business), productCount };
    })
  );

  return withStats;
}

export async function getBusiness(ctx: RequestContext, args: { businessId: string }) {
  void ctx;
  const business = await db.select().from(businesses).where(eq(businesses.id, args.businessId)).limit(1);
  if (!business[0]) return null;
  if (business[0].verificationStatus !== "verified") return null;

  const owner = await db.select().from(users).where(eq(users.id, business[0].ownerId)).limit(1);
  return {
    ...toDoc(business[0]),
    owner: owner[0]
      ? {
          _id: owner[0].id,
          name: owner[0].name,
          imageUrl: owner[0].imageUrl
        }
      : null
  };
}

export async function getBusinessProducts(
  ctx: RequestContext,
  args: { businessId: string; category?: string; sortBy?: "newest" | "price_asc" | "price_desc" }
) {
  void ctx;
  const business = await db.select().from(businesses).where(eq(businesses.id, args.businessId)).limit(1);
  if (!business[0] || business[0].verificationStatus !== "verified") return [];

  const owner = await db.select().from(users).where(eq(users.id, business[0].ownerId)).limit(1);
  if (!owner[0]) return [];

  let productsList = await db
    .select()
    .from(products)
    .where(and(eq(products.sellerId, owner[0].id), eq(products.status, "active")));

  if (args.category) productsList = productsList.filter((p) => p.category === args.category);

  const sortBy = args.sortBy ?? "newest";
  let sorted = productsList;
  switch (sortBy) {
    case "price_asc":
      sorted = productsList.sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      sorted = productsList.sort((a, b) => b.price - a.price);
      break;
    default:
      sorted = productsList.sort((a, b) => b.createdAt - a.createdAt);
  }

  const withImages = await Promise.all(
    sorted.map(async (product) => {
      const primaryImage = await db
        .select()
        .from(productImages)
        .where(and(eq(productImages.productId, product.id), eq(productImages.isPrimary, true)))
        .limit(1);
      return { ...toDoc(product), primaryImageUrl: primaryImage[0]?.url ?? null };
    })
  );

  return withImages;
}

export async function getBusinessStats(ctx: RequestContext, args: { businessId: string }) {
  void ctx;
  const business = await db.select().from(businesses).where(eq(businesses.id, args.businessId)).limit(1);
  if (!business[0] || business[0].verificationStatus !== "verified") return null;

  const owner = await db.select().from(users).where(eq(users.id, business[0].ownerId)).limit(1);
  if (!owner[0]) return { productCount: 0, categories: [] as string[] };

  const productsList = await db
    .select()
    .from(products)
    .where(and(eq(products.sellerId, owner[0].id), eq(products.status, "active")));

  const categories = [...new Set(productsList.map((p) => p.category).filter((c): c is string => !!c))];

  return { productCount: productsList.length, categories: categories.sort() };
}

export async function getCountries(ctx: RequestContext) {
  void ctx;
  const all = await db
    .select({ country: businesses.country })
    .from(businesses)
    .where(eq(businesses.verificationStatus, "verified"));
  const countries = [...new Set(all.map((b) => b.country))];
  return countries.sort();
}

export async function getCategories(ctx: RequestContext) {
  void ctx;
  const all = await db
    .select({ category: businesses.category })
    .from(businesses)
    .where(eq(businesses.verificationStatus, "verified"));
  const categories = [...new Set(all.map((b) => b.category))];
  return categories.sort();
}

export async function searchBusinesses(ctx: RequestContext, args: { query: string; limit?: number }) {
  void ctx;
  if (!args.query.trim()) return [];
  const businessesList = await db
    .select()
    .from(businesses)
    .where(eq(businesses.verificationStatus, "verified"));

  const searchLower = args.query.toLowerCase();
  const filtered = businessesList.filter(
    (b) =>
      b.name.toLowerCase().includes(searchLower) ||
      b.description?.toLowerCase().includes(searchLower) ||
      b.category.toLowerCase().includes(searchLower) ||
      b.country.toLowerCase().includes(searchLower)
  );

  const sorted = filtered.sort((a, b) => b.createdAt - a.createdAt);
  const limited = args.limit && args.limit > 0 ? sorted.slice(0, args.limit) : sorted;
  return limited.map((b) => toDoc(b));
}
