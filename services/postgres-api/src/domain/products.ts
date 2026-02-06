import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import {
  inventoryTransactions,
  productImages,
  products,
  users,
  businesses as businessesTable
} from "../db/schema";
import {
  checkProductLimit,
  getOrCreateUser,
  PlanLimitError,
  toDoc,
  type RequestContext
} from "./helpers";

export async function list(
  ctx: RequestContext,
  args: { sellerId?: string; status?: "active" | "inactive" }
) {
  if (!ctx.auth.userId) throw new Error("Not authenticated");

  let result: typeof products.$inferSelect[] = [];

  if (args.sellerId && args.status) {
    result = await db
      .select()
      .from(products)
      .where(and(eq(products.sellerId, args.sellerId), eq(products.status, args.status)));
  } else if (args.sellerId) {
    result = await db.select().from(products).where(eq(products.sellerId, args.sellerId));
  } else if (args.status) {
    result = await db.select().from(products).where(eq(products.status, args.status));
  } else {
    result = await db.select().from(products);
  }

  return result.sort((a, b) => b.createdAt - a.createdAt).map((p) => toDoc(p));
}

export async function get(ctx: RequestContext, args: { id: string }) {
  if (!ctx.auth.userId) throw new Error("Not authenticated");
  const product = await db.select().from(products).where(eq(products.id, args.id)).limit(1);
  return toDoc(product[0] ?? null);
}

export async function create(
  ctx: RequestContext,
  args: {
    name: string;
    description?: string;
    price: number;
    quantity: number;
    sku?: string;
    lowStockThreshold?: number;
    reorderQuantity?: number;
    category?: string;
    status?: "active" | "inactive";
    country?: string;
    minOrderQuantity?: number;
    specifications?: string;
    tags?: string[];
  }
) {
  const user = await getOrCreateUser(ctx);

  const productLimit = await checkProductLimit(user.id);
  if (!productLimit.allowed) {
    throw new PlanLimitError("products", productLimit.current, productLimit.limit);
  }

  if (args.lowStockThreshold !== undefined && args.lowStockThreshold < 0) {
    throw new Error("Low stock threshold must be 0 or greater");
  }
  if (args.reorderQuantity !== undefined && args.reorderQuantity < 0) {
    throw new Error("Reorder quantity must be 0 or greater");
  }

  if (args.sku && args.sku.trim()) {
    const existingSku = await db
      .select()
      .from(products)
      .where(and(eq(products.sellerId, user.clerkId), eq(products.sku, args.sku)))
      .limit(1);
    if (existingSku[0]) {
      throw new Error("SKU already exists for another product");
    }
  }

  const now = Date.now();
  const productId = crypto.randomUUID();

  await db.insert(products).values({
    id: productId,
    sellerId: user.clerkId,
    name: args.name,
    description: args.description,
    price: args.price,
    quantity: args.quantity,
    sku: args.sku,
    lowStockThreshold: args.lowStockThreshold,
    reorderQuantity: args.reorderQuantity,
    category: args.category,
    status: args.status ?? "active",
    country: args.country,
    minOrderQuantity: args.minOrderQuantity,
    specifications: args.specifications,
    tags: args.tags,
    createdAt: now,
    updatedAt: now
  });

  if (args.quantity > 0) {
    await db.insert(inventoryTransactions).values({
      id: crypto.randomUUID(),
      productId,
      sellerId: user.clerkId,
      type: "restock",
      direction: "in",
      quantity: args.quantity,
      previousQuantity: 0,
      newQuantity: args.quantity,
      reason: "Initial stock",
      createdBy: user.id,
      createdAt: now
    });
  }

  const product = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  return toDoc(product[0] ?? null);
}

export async function update(
  ctx: RequestContext,
  args: {
    id: string;
    name?: string;
    description?: string;
    price?: number;
    quantity?: number;
    sku?: string;
    lowStockThreshold?: number;
    reorderQuantity?: number;
    category?: string;
    status?: "active" | "inactive";
    country?: string;
    minOrderQuantity?: number;
    specifications?: string;
    tags?: string[];
  }
) {
  if (!ctx.auth.userId) throw new Error("Not authenticated");
  const product = await db.select().from(products).where(eq(products.id, args.id)).limit(1);
  if (!product[0]) throw new Error("Product not found");

  const user = await db.select().from(users).where(eq(users.clerkId, ctx.auth.userId)).limit(1);
  if (!user[0] || product[0].sellerId !== user[0].id) {
    throw new Error("Unauthorized");
  }

  if (args.lowStockThreshold !== undefined && args.lowStockThreshold < 0) {
    throw new Error("Low stock threshold must be 0 or greater");
  }
  if (args.reorderQuantity !== undefined && args.reorderQuantity < 0) {
    throw new Error("Reorder quantity must be 0 or greater");
  }

  if (args.sku && args.sku.trim() && args.sku !== product[0].sku) {
    const existingSku = await db
      .select()
      .from(products)
      .where(and(eq(products.sellerId, user[0].clerkId), eq(products.sku, args.sku)))
      .limit(1);
    if (existingSku[0] && existingSku[0].id !== args.id) {
      throw new Error("SKU already exists for another product");
    }
  }

  const updates: Partial<typeof products.$inferInsert> = {
    updatedAt: Date.now()
  };

  if (args.name !== undefined) updates.name = args.name;
  if (args.description !== undefined) updates.description = args.description;
  if (args.price !== undefined) updates.price = args.price;
  if (args.quantity !== undefined) updates.quantity = args.quantity;
  if (args.sku !== undefined) updates.sku = args.sku;
  if (args.lowStockThreshold !== undefined) updates.lowStockThreshold = args.lowStockThreshold;
  if (args.reorderQuantity !== undefined) updates.reorderQuantity = args.reorderQuantity;
  if (args.category !== undefined) updates.category = args.category;
  if (args.status !== undefined) updates.status = args.status;
  if (args.country !== undefined) updates.country = args.country;
  if (args.minOrderQuantity !== undefined) updates.minOrderQuantity = args.minOrderQuantity;
  if (args.specifications !== undefined) updates.specifications = args.specifications;
  if (args.tags !== undefined) updates.tags = args.tags;

  await db.update(products).set(updates).where(eq(products.id, args.id));

  if (args.quantity !== undefined && args.quantity !== product[0].quantity) {
    const delta = args.quantity - product[0].quantity;
    await db.insert(inventoryTransactions).values({
      id: crypto.randomUUID(),
      productId: args.id,
      sellerId: product[0].sellerId,
      type: "correction",
      direction: delta > 0 ? "in" : "out",
      quantity: Math.abs(delta),
      previousQuantity: product[0].quantity,
      newQuantity: args.quantity,
      reason: "Manual inventory update",
      createdBy: user[0].id,
      createdAt: Date.now()
    });
  }

  const updated = await db.select().from(products).where(eq(products.id, args.id)).limit(1);
  return toDoc(updated[0] ?? null);
}

export async function remove(ctx: RequestContext, args: { id: string }) {
  if (!ctx.auth.userId) throw new Error("Not authenticated");
  const product = await db.select().from(products).where(eq(products.id, args.id)).limit(1);
  if (!product[0]) throw new Error("Product not found");

  const user = await db.select().from(users).where(eq(users.clerkId, ctx.auth.userId)).limit(1);
  if (!user[0] || product[0].sellerId !== user[0].id) {
    throw new Error("Unauthorized");
  }

  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, args.id));

  const r2Keys: string[] = [];
  for (const image of images) {
    r2Keys.push(image.r2Key);
    await db.delete(productImages).where(eq(productImages.id, image.id));
  }

  await db.delete(products).where(eq(products.id, args.id));
  return { r2Keys };
}

export async function marketplace(
  ctx: RequestContext,
  args: {
    category?: string;
    country?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: "newest" | "price_asc" | "price_desc";
  }
) {
  if (!ctx.auth.userId) throw new Error("Not authenticated");

  const all = await db.select().from(products).where(eq(products.status, "active"));
  let filtered = all;

  if (args.category) filtered = filtered.filter((p) => p.category === args.category);
  if (args.country) filtered = filtered.filter((p) => p.country === args.country);
  if (args.search) {
    const searchLower = args.search.toLowerCase();
    filtered = filtered.filter(
      (p) => p.name.toLowerCase().includes(searchLower) || p.description?.toLowerCase().includes(searchLower)
    );
  }
  if (args.minPrice !== undefined) filtered = filtered.filter((p) => p.price >= args.minPrice!);
  if (args.maxPrice !== undefined) filtered = filtered.filter((p) => p.price <= args.maxPrice!);

  const sortBy = args.sortBy ?? "newest";
  let sorted = filtered;
  switch (sortBy) {
    case "price_asc":
      sorted = filtered.sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      sorted = filtered.sort((a, b) => b.price - a.price);
      break;
    default:
      sorted = filtered.sort((a, b) => b.createdAt - a.createdAt);
  }

  const withImages = await Promise.all(
    sorted.map(async (product) => {
      const primaryImage = await db
        .select()
        .from(productImages)
        .where(and(eq(productImages.productId, product.id), eq(productImages.isPrimary, true)))
        .limit(1);
      return {
        ...toDoc(product),
        primaryImageUrl: primaryImage[0]?.url ?? null
      };
    })
  );

  return withImages;
}

export async function publicMarketplace(
  ctx: RequestContext,
  args: {
    category?: string;
    country?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: "newest" | "price_asc" | "price_desc";
    limit?: number;
  }
) {
  void ctx;
  const all = await db.select().from(products).where(eq(products.status, "active"));
  let filtered = all;

  if (args.category) filtered = filtered.filter((p) => p.category === args.category);
  if (args.country) filtered = filtered.filter((p) => p.country === args.country);
  if (args.search) {
    const searchLower = args.search.toLowerCase();
    filtered = filtered.filter(
      (p) => p.name.toLowerCase().includes(searchLower) || p.description?.toLowerCase().includes(searchLower)
    );
  }
  if (args.minPrice !== undefined) filtered = filtered.filter((p) => p.price >= args.minPrice!);
  if (args.maxPrice !== undefined) filtered = filtered.filter((p) => p.price <= args.maxPrice!);

  const sortBy = args.sortBy ?? "newest";
  let sorted = filtered;
  switch (sortBy) {
    case "price_asc":
      sorted = filtered.sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      sorted = filtered.sort((a, b) => b.price - a.price);
      break;
    default:
      sorted = filtered.sort((a, b) => b.createdAt - a.createdAt);
  }

  if (args.limit && args.limit > 0) sorted = sorted.slice(0, args.limit);

  const withImages = await Promise.all(
    sorted.map(async (product) => {
      const primaryImage = await db
        .select()
        .from(productImages)
        .where(and(eq(productImages.productId, product.id), eq(productImages.isPrimary, true)))
        .limit(1);
      return {
        ...toDoc(product),
        primaryImageUrl: primaryImage[0]?.url ?? null
      };
    })
  );

  return withImages;
}

export async function getProductPriceRange(ctx: RequestContext) {
  void ctx;
  const all = await db.select().from(products).where(eq(products.status, "active"));
  if (all.length === 0) return { min: 0, max: 1000 };
  const prices = all.map((p) => p.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export async function getProductCountries(ctx: RequestContext) {
  void ctx;
  const all = await db.select().from(products).where(eq(products.status, "active"));
  const countries = [...new Set(all.map((p) => p.country).filter((c): c is string => !!c))];
  return countries.sort();
}

export async function getProductCategories(ctx: RequestContext) {
  void ctx;
  const all = await db.select().from(products).where(eq(products.status, "active"));
  const categories = [...new Set(all.map((p) => p.category).filter((c): c is string => !!c))];
  return categories.sort();
}

export async function getProductWithImages(ctx: RequestContext, args: { id: string }) {
  void ctx;
  const product = await db.select().from(products).where(eq(products.id, args.id)).limit(1);
  if (!product[0]) return null;

  const images = await db.select().from(productImages).where(eq(productImages.productId, args.id));
  const sortedImages = images.sort((a, b) => a.order - b.order);

  const seller = await db.select().from(users).where(eq(users.id, product[0].sellerId)).limit(1);
  let business = null;
  if (seller[0]?.businessId) {
    const b = await db.select().from(businessesTable).where(eq(businessesTable.id, seller[0].businessId)).limit(1);
    business = b[0];
  }

  return {
    ...toDoc(product[0]),
    images: sortedImages.map((img) => toDoc(img)),
    seller: seller[0]
      ? {
          _id: seller[0].id,
          clerkId: seller[0].clerkId,
          name: seller[0].name,
          imageUrl: seller[0].imageUrl
        }
      : null,
    business: business
      ? {
          _id: business.id,
          name: business.name,
          country: business.country,
          verificationStatus: business.verificationStatus,
          logoUrl: business.logoUrl
        }
      : null
  };
}

export async function getRelatedProducts(
  ctx: RequestContext,
  args: { productId: string; limit?: number }
) {
  void ctx;
  const product = await db.select().from(products).where(eq(products.id, args.productId)).limit(1);
  if (!product[0] || !product[0].category) return [];

  const all = await db.select().from(products).where(eq(products.status, "active"));
  const related = all
    .filter((p) => p.category === product[0].category && p.id !== args.productId)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, args.limit ?? 4);

  const withImages = await Promise.all(
    related.map(async (p) => {
      const primaryImage = await db
        .select()
        .from(productImages)
        .where(and(eq(productImages.productId, p.id), eq(productImages.isPrimary, true)))
        .limit(1);
      return {
        ...toDoc(p),
        primaryImageUrl: primaryImage[0]?.url ?? null
      };
    })
  );

  return withImages;
}
