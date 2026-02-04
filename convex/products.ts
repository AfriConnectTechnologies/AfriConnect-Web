import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getOrCreateUser, checkProductLimit, PlanLimitError } from "./helpers";
import { createLogger, flushLogs } from "./lib/logger";

export const list = query({
  args: {
    sellerId: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    let products;

    if (args.sellerId && args.status) {
      products = await ctx.db
        .query("products")
        .withIndex("by_seller_status", (q) =>
          q.eq("sellerId", args.sellerId!).eq("status", args.status!)
        )
        .collect();
    } else if (args.sellerId) {
      products = await ctx.db
        .query("products")
        .withIndex("by_seller", (q) => q.eq("sellerId", args.sellerId!))
        .collect();
    } else if (args.status) {
      products = await ctx.db
        .query("products")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      products = await ctx.db.query("products").collect();
    }

    return products.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const get = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    const product = await ctx.db.get(args.id);
    if (!product) {
      return null;
    }

    return product;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    quantity: v.number(),
    sku: v.optional(v.string()),
    lowStockThreshold: v.optional(v.number()),
    reorderQuantity: v.optional(v.number()),
    category: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
    country: v.optional(v.string()),
    minOrderQuantity: v.optional(v.number()),
    specifications: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const log = createLogger("products.create");
    
    try {
      log.info("Product creation initiated", {
        name: args.name,
        price: args.price,
        quantity: args.quantity,
        category: args.category,
        country: args.country,
        status: args.status ?? "active",
      });

      const user = await getOrCreateUser(ctx);
      log.setContext({ userId: user.clerkId });

      // Check product limit based on subscription plan
      const productLimit = await checkProductLimit(ctx, user._id);
      if (!productLimit.allowed) {
        log.warn("Product creation failed - plan limit reached", {
          currentProducts: productLimit.current,
          limit: productLimit.limit,
        });
        await flushLogs();
        throw new PlanLimitError("products", productLimit.current, productLimit.limit);
      }

      log.debug("Product limit check passed", {
        currentProducts: productLimit.current,
        limit: productLimit.limit,
      });

      if (args.lowStockThreshold !== undefined && args.lowStockThreshold < 0) {
        throw new Error("Low stock threshold must be 0 or greater");
      }
      if (args.reorderQuantity !== undefined && args.reorderQuantity < 0) {
        throw new Error("Reorder quantity must be 0 or greater");
      }

      if (args.sku && args.sku.trim()) {
        const existingSku = await ctx.db
          .query("products")
          .withIndex("by_seller_sku", (q) =>
            q.eq("sellerId", user.clerkId).eq("sku", args.sku)
          )
          .first();
        if (existingSku) {
          throw new Error("SKU already exists for another product");
        }
      }
        if (existingSku) {
          throw new Error("SKU already exists for another product");
        }
      }

      const now = Date.now();
      const productId = await ctx.db.insert("products", {
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
        updatedAt: now,
      });

      if (args.quantity > 0) {
        await ctx.db.insert("inventoryTransactions", {
          productId,
          sellerId: user.clerkId,
          type: "restock",
          direction: "in",
          quantity: args.quantity,
          previousQuantity: 0,
          newQuantity: args.quantity,
          reason: "Initial stock",
          createdBy: user._id,
          createdAt: now,
        });
      }

      log.info("Product created successfully", {
        productId,
        name: args.name,
        price: args.price,
        quantity: args.quantity,
        category: args.category,
        status: args.status ?? "active",
      });

      await flushLogs();
      return await ctx.db.get(productId);
    } catch (error) {
      log.error("Product creation failed", error, {
        name: args.name,
        price: args.price,
      });
      await flushLogs();
      throw error;
    }
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    quantity: v.optional(v.number()),
    sku: v.optional(v.string()),
    lowStockThreshold: v.optional(v.number()),
    reorderQuantity: v.optional(v.number()),
    category: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
    country: v.optional(v.string()),
    minOrderQuantity: v.optional(v.number()),
    specifications: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const log = createLogger("products.update");
    
    try {
      log.info("Product update initiated", {
        productId: args.id,
        fieldsToUpdate: Object.keys(args).filter(k => k !== "id" && args[k as keyof typeof args] !== undefined),
      });

      const identity = await ctx.auth.getUserIdentity();
      if (identity === null) {
        log.warn("Product update failed - not authenticated");
        await flushLogs();
        throw new Error("Not authenticated");
      }

      log.setContext({ userId: identity.subject });

      const product = await ctx.db.get(args.id);
      if (!product) {
        log.error("Product update failed - not found", undefined, { productId: args.id });
        await flushLogs();
        throw new Error("Product not found");
      }

      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();

      if (!user || product.sellerId !== user._id) {
        log.warn("Product update failed - unauthorized", {
          productId: args.id,
          productOwnerId: product.sellerId,
          requestingUserId: user?._id,
        });
        await flushLogs();
        throw new Error("Unauthorized");
      }

      if (args.lowStockThreshold !== undefined && args.lowStockThreshold < 0) {
        throw new Error("Low stock threshold must be 0 or greater");
      }
      if (args.reorderQuantity !== undefined && args.reorderQuantity < 0) {
        throw new Error("Reorder quantity must be 0 or greater");
      }

      if (args.sku && args.sku.trim() && args.sku !== product.sku) {
        const existingSku = await ctx.db
          .query("products")
          .withIndex("by_seller_sku", (q) =>
            q.eq("sellerId", user.clerkId).eq("sku", args.sku)
          )
          .first();
        if (existingSku && existingSku._id !== args.id) {
          throw new Error("SKU already exists for another product");
        }
      }
        if (existingSku && existingSku._id !== args.id) {
          throw new Error("SKU already exists for another product");
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, ...updates } = args;
      const now = Date.now();
      await ctx.db.patch(args.id, {
        ...updates,
        updatedAt: now,
      });

      if (args.quantity !== undefined && args.quantity !== product.quantity) {
        const delta = args.quantity - product.quantity;
        await ctx.db.insert("inventoryTransactions", {
          productId: args.id,
          sellerId: product.sellerId,
          type: "correction",
          direction: delta > 0 ? "in" : "out",
          quantity: Math.abs(delta),
          previousQuantity: product.quantity,
          newQuantity: args.quantity,
          reason: "Manual inventory update",
          createdBy: user._id,
          createdAt: now,
        });
      }

      log.info("Product updated successfully", {
        productId: args.id,
        productName: args.name || product.name,
        fieldsUpdated: Object.keys(updates).filter(k => updates[k as keyof typeof updates] !== undefined),
      });

      await flushLogs();
      return await ctx.db.get(args.id);
    } catch (error) {
      log.error("Product update failed", error, { productId: args.id });
      await flushLogs();
      throw error;
    }
  },
});

export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const log = createLogger("products.remove");
    
    try {
      log.info("Product removal initiated", { productId: args.id });

      const identity = await ctx.auth.getUserIdentity();
      if (identity === null) {
        log.warn("Product removal failed - not authenticated");
        await flushLogs();
        throw new Error("Not authenticated");
      }

      log.setContext({ userId: identity.subject });

      const product = await ctx.db.get(args.id);
      if (!product) {
        log.error("Product removal failed - not found", undefined, { productId: args.id });
        await flushLogs();
        throw new Error("Product not found");
      }

      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();

      if (!user || product.sellerId !== user._id) {
        log.warn("Product removal failed - unauthorized", {
          productId: args.id,
          productOwnerId: product.sellerId,
          requestingUserId: user?._id,
        });
        await flushLogs();
        throw new Error("Unauthorized");
      }

      // Delete all associated images from Convex (R2 cleanup should be done via API)
      const images = await ctx.db
        .query("productImages")
        .withIndex("by_product", (q) => q.eq("productId", args.id))
        .collect();

      const r2Keys: string[] = [];
      for (const image of images) {
        r2Keys.push(image.r2Key);
        await ctx.db.delete(image._id);
      }

      await ctx.db.delete(args.id);

      log.info("Product removed successfully", {
        productId: args.id,
        productName: product.name,
        imagesDeleted: images.length,
        r2KeysToCleanup: r2Keys.length,
      });

      await flushLogs();

      // Return the R2 keys so the caller can delete them from R2
      return { r2Keys };
    } catch (error) {
      log.error("Product removal failed", error, { productId: args.id });
      await flushLogs();
      throw error;
    }
  },
});

export const marketplace = query({
  args: {
    category: v.optional(v.string()),
    country: v.optional(v.string()),
    search: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    sortBy: v.optional(
      v.union(
        v.literal("newest"),
        v.literal("price_asc"),
        v.literal("price_desc")
      )
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    const products = await ctx.db
      .query("products")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    let filtered = products;

    // Apply category filter
    if (args.category) {
      filtered = filtered.filter((p) => p.category === args.category);
    }

    // Apply country filter
    if (args.country) {
      filtered = filtered.filter((p) => p.country === args.country);
    }

    // Apply search filter
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply price range filters
    if (args.minPrice !== undefined) {
      filtered = filtered.filter((p) => p.price >= args.minPrice!);
    }
    if (args.maxPrice !== undefined) {
      filtered = filtered.filter((p) => p.price <= args.maxPrice!);
    }

    // Apply sorting
    const sortBy = args.sortBy ?? "newest";
    let sorted: typeof filtered;
    switch (sortBy) {
      case "price_asc":
        sorted = filtered.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        sorted = filtered.sort((a, b) => b.price - a.price);
        break;
      case "newest":
      default:
        sorted = filtered.sort((a, b) => b.createdAt - a.createdAt);
        break;
    }

    // Include primary image for each product
    const productsWithImages = await Promise.all(
      sorted.map(async (product) => {
        const primaryImage = await ctx.db
          .query("productImages")
          .withIndex("by_product_primary", (q) =>
            q.eq("productId", product._id).eq("isPrimary", true)
          )
          .first();

        return {
          ...product,
          primaryImageUrl: primaryImage?.url ?? null,
        };
      })
    );

    return productsWithImages;
  },
});

// Public marketplace query - no authentication required
export const publicMarketplace = query({
  args: {
    category: v.optional(v.string()),
    country: v.optional(v.string()),
    search: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    sortBy: v.optional(
      v.union(
        v.literal("newest"),
        v.literal("price_asc"),
        v.literal("price_desc")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    let filtered = products;

    // Apply category filter
    if (args.category) {
      filtered = filtered.filter((p) => p.category === args.category);
    }

    // Apply country filter
    if (args.country) {
      filtered = filtered.filter((p) => p.country === args.country);
    }

    // Apply search filter
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply price range filters
    if (args.minPrice !== undefined) {
      filtered = filtered.filter((p) => p.price >= args.minPrice!);
    }
    if (args.maxPrice !== undefined) {
      filtered = filtered.filter((p) => p.price <= args.maxPrice!);
    }

    // Apply sorting
    const sortBy = args.sortBy ?? "newest";
    let sorted: typeof filtered;
    switch (sortBy) {
      case "price_asc":
        sorted = filtered.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        sorted = filtered.sort((a, b) => b.price - a.price);
        break;
      case "newest":
      default:
        sorted = filtered.sort((a, b) => b.createdAt - a.createdAt);
        break;
    }

    // Apply limit if specified
    if (args.limit && args.limit > 0) {
      sorted = sorted.slice(0, args.limit);
    }

    // Include primary image for each product
    const productsWithImages = await Promise.all(
      sorted.map(async (product) => {
        const primaryImage = await ctx.db
          .query("productImages")
          .withIndex("by_product_primary", (q) =>
            q.eq("productId", product._id).eq("isPrimary", true)
          )
          .first();

        return {
          ...product,
          primaryImageUrl: primaryImage?.url ?? null,
        };
      })
    );

    return productsWithImages;
  },
});

// Get price range of active products
export const getProductPriceRange = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    if (products.length === 0) {
      return { min: 0, max: 1000 };
    }

    const prices = products.map((p) => p.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  },
});

// Get unique countries from active products
export const getProductCountries = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const countries = [
      ...new Set(products.map((p) => p.country).filter((c): c is string => !!c)),
    ];
    return countries.sort();
  },
});

// Get unique categories from active products
export const getProductCategories = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const categories = [
      ...new Set(products.map((p) => p.category).filter((c): c is string => !!c)),
    ];
    return categories.sort();
  },
});

// Get product with all images
export const getProductWithImages = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id);
    if (!product) {
      return null;
    }

    const images = await ctx.db
      .query("productImages")
      .withIndex("by_product", (q) => q.eq("productId", args.id))
      .collect();

    const sortedImages = images.sort((a, b) => a.order - b.order);

    // Get seller information
    const seller = await ctx.db.get(product.sellerId as unknown as import("./_generated/dataModel").Id<"users">);
    
    // Get seller's business if they have one
    let business = null;
    if (seller?.businessId) {
      business = await ctx.db.get(seller.businessId);
    }

    return {
      ...product,
      images: sortedImages,
      seller: seller ? {
        _id: seller._id,
        clerkId: seller.clerkId,
        name: seller.name,
        imageUrl: seller.imageUrl,
      } : null,
      business: business ? {
        _id: business._id,
        name: business.name,
        country: business.country,
        verificationStatus: business.verificationStatus,
        logoUrl: business.logoUrl,
      } : null,
    };
  },
});

// Get related products (same category)
export const getRelatedProducts = query({
  args: {
    productId: v.id("products"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product || !product.category) {
      return [];
    }

    const products = await ctx.db
      .query("products")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Filter by same category, excluding current product
    const related = products
      .filter((p) => p.category === product.category && p._id !== args.productId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, args.limit ?? 4);

    // Include primary image for each product
    const relatedWithImages = await Promise.all(
      related.map(async (p) => {
        const primaryImage = await ctx.db
          .query("productImages")
          .withIndex("by_product_primary", (q) =>
            q.eq("productId", p._id).eq("isPrimary", true)
          )
          .first();

        return {
          ...p,
          primaryImageUrl: primaryImage?.url ?? null,
        };
      })
    );

    return relatedWithImages;
  },
});
