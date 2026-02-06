import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { productImages, products } from "../db/schema";
import { getOrCreateUser, type RequestContext, toDoc } from "./helpers";

const MAX_IMAGES_PER_PRODUCT = 5;

export async function saveImage(
  ctx: RequestContext,
  args: { productId: string; r2Key: string; url: string; isPrimary?: boolean }
) {
  const user = await getOrCreateUser(ctx);
  return db.transaction(async (tx) => {
    const product = await tx.select().from(products).where(eq(products.id, args.productId)).limit(1);
    if (!product[0]) throw new Error("Product not found");
    if (product[0].sellerId !== user.id) {
      throw new Error("Unauthorized: You don't own this product");
    }

    const existingImages = await tx
      .select()
      .from(productImages)
      .where(eq(productImages.productId, args.productId));

    if (existingImages.length >= MAX_IMAGES_PER_PRODUCT) {
      throw new Error(`Maximum of ${MAX_IMAGES_PER_PRODUCT} images allowed per product`);
    }

    const order = existingImages.length;
    const isPrimary = args.isPrimary ?? existingImages.length === 0;

    if (isPrimary) {
      for (const img of existingImages) {
        if (img.isPrimary) {
          await tx.update(productImages).set({ isPrimary: false }).where(eq(productImages.id, img.id));
        }
      }
    }

    const imageId = crypto.randomUUID();
    await tx.insert(productImages).values({
      id: imageId,
      productId: args.productId,
      r2Key: args.r2Key,
      url: args.url,
      order,
      isPrimary,
      createdAt: Date.now()
    });

    const saved = await tx.select().from(productImages).where(eq(productImages.id, imageId)).limit(1);
    return toDoc(saved[0] ?? null);
  });
}

export async function deleteImage(ctx: RequestContext, args: { imageId: string }) {
  const user = await getOrCreateUser(ctx);
  return db.transaction(async (tx) => {
    const image = await tx.select().from(productImages).where(eq(productImages.id, args.imageId)).limit(1);
    if (!image[0]) throw new Error("Image not found");

    const product = await tx.select().from(products).where(eq(products.id, image[0].productId)).limit(1);
    if (!product[0] || product[0].sellerId !== user.id) {
      throw new Error("Unauthorized");
    }

    const wasPrimary = image[0].isPrimary;
    const productId = image[0].productId;

    await tx.delete(productImages).where(eq(productImages.id, args.imageId));

    if (wasPrimary) {
      const remaining = await tx.select().from(productImages).where(eq(productImages.productId, productId));
      if (remaining.length > 0) {
        const sorted = remaining.sort((a, b) => a.order - b.order);
        await tx.update(productImages).set({ isPrimary: true }).where(eq(productImages.id, sorted[0].id));
      }
    }

    const remainingImages = await tx.select().from(productImages).where(eq(productImages.productId, productId));
    const sorted = remainingImages.sort((a, b) => a.order - b.order);
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].order !== i) {
        await tx.update(productImages).set({ order: i }).where(eq(productImages.id, sorted[i].id));
      }
    }

    return { r2Key: image[0].r2Key };
  });
}

export async function reorderImages(
  ctx: RequestContext,
  args: { productId: string; imageIds: string[] }
) {
  const user = await getOrCreateUser(ctx);
  return db.transaction(async (tx) => {
    const product = await tx.select().from(products).where(eq(products.id, args.productId)).limit(1);
    if (!product[0] || product[0].sellerId !== user.id) throw new Error("Unauthorized");

    for (let i = 0; i < args.imageIds.length; i++) {
      const image = await tx.select().from(productImages).where(eq(productImages.id, args.imageIds[i])).limit(1);
      if (image[0] && image[0].productId === args.productId) {
        await tx.update(productImages).set({ order: i }).where(eq(productImages.id, args.imageIds[i]));
      }
    }
    return true;
  });
}

export async function setPrimaryImage(ctx: RequestContext, args: { imageId: string }) {
  const user = await getOrCreateUser(ctx);
  return db.transaction(async (tx) => {
    const image = await tx.select().from(productImages).where(eq(productImages.id, args.imageId)).limit(1);
    if (!image[0]) throw new Error("Image not found");

    const product = await tx.select().from(products).where(eq(products.id, image[0].productId)).limit(1);
    if (!product[0] || product[0].sellerId !== user.id) throw new Error("Unauthorized");

    const existingImages = await tx
      .select()
      .from(productImages)
      .where(eq(productImages.productId, image[0].productId));

    for (const img of existingImages) {
      if (img.isPrimary && img.id !== args.imageId) {
        await tx.update(productImages).set({ isPrimary: false }).where(eq(productImages.id, img.id));
      }
    }

    await tx.update(productImages).set({ isPrimary: true }).where(eq(productImages.id, args.imageId));
    return true;
  });
}

export async function getByProduct(ctx: RequestContext, args: { productId: string }) {
  void ctx;
  const images = await db.select().from(productImages).where(eq(productImages.productId, args.productId));
  return images.sort((a, b) => a.order - b.order).map((img) => toDoc(img));
}

export async function getPrimaryImage(ctx: RequestContext, args: { productId: string }) {
  void ctx;
  const image = await db
    .select()
    .from(productImages)
    .where(and(eq(productImages.productId, args.productId), eq(productImages.isPrimary, true)))
    .limit(1);
  return toDoc(image[0] ?? null);
}

export async function deleteAllForProduct(ctx: RequestContext, args: { productId: string }) {
  if (!ctx.auth.userId) throw new Error("Not authenticated");
  return db.transaction(async (tx) => {
    const images = await tx.select().from(productImages).where(eq(productImages.productId, args.productId));
    const r2Keys: string[] = [];
    for (const image of images) {
      r2Keys.push(image.r2Key);
      await tx.delete(productImages).where(eq(productImages.id, image.id));
    }
    return { r2Keys };
  });
}
