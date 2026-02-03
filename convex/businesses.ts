import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireUser, getOrCreateUser } from "./helpers";
import { createLogger, flushLogs } from "./lib/logger";

// Create a new business (user becomes a seller)
export const createBusiness = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    country: v.string(),
    city: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    category: v.string(),
    businessLicenceImageUrl: v.optional(v.string()),
    businessLicenceNumber: v.optional(v.string()),
    memoOfAssociationImageUrl: v.optional(v.string()),
    tinCertificateImageUrl: v.optional(v.string()),
    tinCertificateNumber: v.optional(v.string()),
    hasImportExportPermit: v.optional(v.boolean()),
    importExportPermitImageUrl: v.optional(v.string()),
    importExportPermitNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const log = createLogger("businesses.createBusiness");
    
    try {
      log.info("Business creation initiated", {
        name: args.name,
        country: args.country,
        city: args.city,
        category: args.category,
      });

      const user = await getOrCreateUser(ctx);
      log.setContext({ userId: user.clerkId });

      // Check if user already has a business
      if (user.businessId) {
        log.warn("Business creation failed - user already has a business", {
          existingBusinessId: user.businessId,
        });
        await flushLogs();
        throw new Error("You already have a registered business");
      }

      const now = Date.now();
      const businessId = await ctx.db.insert("businesses", {
        ownerId: user._id,
        name: args.name,
        description: args.description,
        country: args.country,
        city: args.city,
        address: args.address,
        phone: args.phone,
        website: args.website,
        category: args.category,
        businessLicenceImageUrl: args.businessLicenceImageUrl,
        businessLicenceNumber: args.businessLicenceNumber,
        memoOfAssociationImageUrl: args.memoOfAssociationImageUrl,
        tinCertificateImageUrl: args.tinCertificateImageUrl,
        tinCertificateNumber: args.tinCertificateNumber,
        hasImportExportPermit: args.hasImportExportPermit,
        importExportPermitImageUrl: args.importExportPermitImageUrl,
        importExportPermitNumber: args.importExportPermitNumber,
        verificationStatus: "pending",
        createdAt: now,
        updatedAt: now,
      });

      log.setContext({ businessId });

      // Update user to seller role and link business
      await ctx.db.patch(user._id, {
        role: "seller",
        businessId: businessId,
      });

      log.info("Business created successfully", {
        businessId,
        businessName: args.name,
        country: args.country,
        category: args.category,
        ownerRole: "seller",
        verificationStatus: "pending",
      });

      const business = await ctx.db.get(businessId);
      
      await flushLogs();
      
      // Return business with owner info for email notifications
      return {
        ...business,
        ownerEmail: user.email,
        ownerName: user.name,
      };
    } catch (error) {
      log.error("Business creation failed", error, {
        name: args.name,
        country: args.country,
        category: args.category,
      });
      await flushLogs();
      throw error;
    }
  },
});

// Update business profile (seller only, own business)
export const updateBusiness = mutation({
  args: {
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    category: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    businessLicenceImageUrl: v.optional(v.string()),
    businessLicenceNumber: v.optional(v.string()),
    memoOfAssociationImageUrl: v.optional(v.string()),
    tinCertificateImageUrl: v.optional(v.string()),
    tinCertificateNumber: v.optional(v.string()),
    hasImportExportPermit: v.optional(v.boolean()),
    importExportPermitImageUrl: v.optional(v.string()),
    importExportPermitNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const log = createLogger("businesses.updateBusiness");
    
    try {
      log.info("Business update initiated", {
        fieldsToUpdate: Object.keys(args).filter(k => args[k as keyof typeof args] !== undefined),
      });

      const user = await requireUser(ctx);
      log.setContext({ userId: user.clerkId });

      if (!user.businessId) {
        log.warn("Business update failed - no business registered");
        await flushLogs();
        throw new Error("You don't have a registered business");
      }

      log.setContext({ businessId: user.businessId });

      const business = await ctx.db.get(user.businessId);
      if (!business) {
        log.error("Business update failed - not found", undefined, {
          businessId: user.businessId,
        });
        await flushLogs();
        throw new Error("Business not found");
      }

      // Only owner can update their business
      if (business.ownerId !== user._id) {
        log.warn("Business update failed - unauthorized", {
          businessOwnerId: business.ownerId,
          requestingUserId: user._id,
        });
        await flushLogs();
        throw new Error("Unauthorized: You can only update your own business");
      }

      const updates: Partial<typeof args & { updatedAt: number }> = {
        updatedAt: Date.now(),
      };

      if (args.name !== undefined) updates.name = args.name;
      if (args.description !== undefined) updates.description = args.description;
      if (args.country !== undefined) updates.country = args.country;
      if (args.city !== undefined) updates.city = args.city;
      if (args.address !== undefined) updates.address = args.address;
      if (args.phone !== undefined) updates.phone = args.phone;
      if (args.website !== undefined) updates.website = args.website;
      if (args.category !== undefined) updates.category = args.category;
      if (args.logoUrl !== undefined) updates.logoUrl = args.logoUrl;
      if (args.businessLicenceImageUrl !== undefined) updates.businessLicenceImageUrl = args.businessLicenceImageUrl;
      if (args.businessLicenceNumber !== undefined) updates.businessLicenceNumber = args.businessLicenceNumber;
      if (args.memoOfAssociationImageUrl !== undefined) updates.memoOfAssociationImageUrl = args.memoOfAssociationImageUrl;
      if (args.tinCertificateImageUrl !== undefined) updates.tinCertificateImageUrl = args.tinCertificateImageUrl;
      if (args.tinCertificateNumber !== undefined) updates.tinCertificateNumber = args.tinCertificateNumber;
      if (args.hasImportExportPermit !== undefined) updates.hasImportExportPermit = args.hasImportExportPermit;
      if (args.importExportPermitImageUrl !== undefined) updates.importExportPermitImageUrl = args.importExportPermitImageUrl;
      if (args.importExportPermitNumber !== undefined) updates.importExportPermitNumber = args.importExportPermitNumber;

      await ctx.db.patch(user.businessId, updates);

      log.info("Business updated successfully", {
        businessId: user.businessId,
        businessName: updates.name || business.name,
        fieldsUpdated: Object.keys(updates).filter(k => k !== "updatedAt"),
      });

      await flushLogs();
      return await ctx.db.get(user.businessId);
    } catch (error) {
      log.error("Business update failed", error);
      await flushLogs();
      throw error;
    }
  },
});

// Get business by ID
export const getBusiness = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const business = await ctx.db.get(args.businessId);
    if (!business) {
      return null;
    }

    // Get owner info
    const owner = await ctx.db.get(business.ownerId);

    return {
      ...business,
      owner: owner
        ? {
            _id: owner._id,
            clerkId: owner.clerkId,
            name: owner.name,
            email: owner.email,
            imageUrl: owner.imageUrl,
          }
        : null,
    };
  },
});

// Get current user's business
export const getMyBusiness = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    if (!user.businessId) {
      return null;
    }

    return await ctx.db.get(user.businessId);
  },
});

// List all businesses with filters (admin only)
export const listBusinesses = query({
  args: {
    status: v.optional(
      v.union(v.literal("pending"), v.literal("verified"), v.literal("rejected"))
    ),
    country: v.optional(v.string()),
    category: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let businesses;

    if (args.status) {
      businesses = await ctx.db
        .query("businesses")
        .withIndex("by_status", (q) => q.eq("verificationStatus", args.status!))
        .collect();
    } else {
      businesses = await ctx.db.query("businesses").collect();
    }

    // Apply additional filters
    if (args.country) {
      businesses = businesses.filter((b) => b.country === args.country);
    }

    if (args.category) {
      businesses = businesses.filter((b) => b.category === args.category);
    }

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      businesses = businesses.filter(
        (b) =>
          b.name.toLowerCase().includes(searchLower) ||
          b.description?.toLowerCase().includes(searchLower)
      );
    }

    // Fetch owner info for each business
    const businessesWithOwner = await Promise.all(
      businesses.map(async (business) => {
        const owner = await ctx.db.get(business.ownerId);
        return {
          ...business,
          owner: owner
            ? {
                _id: owner._id,
                name: owner.name,
                email: owner.email,
              }
            : null,
        };
      })
    );

    return businessesWithOwner.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Check if a document URL is stored on any business (admin only). Used to authorize document view.
// Uses indexed lookups (O(1) per field) instead of scanning all businesses.
export const isDocumentUrlAllowed = query({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const [byLicence, byMemo, byTin, byPermit] = await Promise.all([
      ctx.db
        .query("businesses")
        .withIndex("by_businessLicenceImageUrl", (q) =>
          q.eq("businessLicenceImageUrl", args.url)
        )
        .first(),
      ctx.db
        .query("businesses")
        .withIndex("by_memoOfAssociationImageUrl", (q) =>
          q.eq("memoOfAssociationImageUrl", args.url)
        )
        .first(),
      ctx.db
        .query("businesses")
        .withIndex("by_tinCertificateImageUrl", (q) =>
          q.eq("tinCertificateImageUrl", args.url)
        )
        .first(),
      ctx.db
        .query("businesses")
        .withIndex("by_importExportPermitImageUrl", (q) =>
          q.eq("importExportPermitImageUrl", args.url)
        )
        .first(),
    ]);
    return !!(byLicence ?? byMemo ?? byTin ?? byPermit);
  },
});

// Verify or reject business (admin only)
export const verifyBusiness = mutation({
  args: {
    businessId: v.id("businesses"),
    status: v.union(v.literal("verified"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    const log = createLogger("businesses.verifyBusiness");
    
    try {
      log.info("Business verification initiated", {
        businessId: args.businessId,
        newStatus: args.status,
      });

      const admin = await requireAdmin(ctx);
      log.setContext({ userId: admin.clerkId, businessId: args.businessId });

      const business = await ctx.db.get(args.businessId);
      if (!business) {
        log.error("Business verification failed - not found", undefined, {
          businessId: args.businessId,
        });
        await flushLogs();
        throw new Error("Business not found");
      }

      const previousStatus = business.verificationStatus;

      await ctx.db.patch(args.businessId, {
        verificationStatus: args.status,
        updatedAt: Date.now(),
      });

      const updatedBusiness = await ctx.db.get(args.businessId);
      
      // Get owner info for email notification
      const owner = await ctx.db.get(business.ownerId);

      log.info("Business verification completed", {
        businessId: args.businessId,
        businessName: business.name,
        previousStatus,
        newStatus: args.status,
        ownerId: business.ownerId,
        ownerEmailPresent: !!owner?.email, // Don't log PII, just indicate presence
        adminId: admin._id,
      });

      await flushLogs();
      
      return {
        ...updatedBusiness,
        ownerEmail: owner?.email,
        ownerName: owner?.name,
      };
    } catch (error) {
      log.error("Business verification failed", error, {
        businessId: args.businessId,
        newStatus: args.status,
      });
      await flushLogs();
      throw error;
    }
  },
});

// Get unique countries from businesses (for filters)
export const getCountries = query({
  args: {},
  handler: async (ctx) => {
    const businesses = await ctx.db.query("businesses").collect();
    const countries = [...new Set(businesses.map((b) => b.country))];
    return countries.sort();
  },
});

// Get unique categories from businesses (for filters)
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const businesses = await ctx.db.query("businesses").collect();
    const categories = [...new Set(businesses.map((b) => b.category))];
    return categories.sort();
  },
});

// Public directory - list verified businesses
export const publicDirectory = query({
  args: {
    country: v.optional(v.string()),
    category: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let businesses = await ctx.db
      .query("businesses")
      .withIndex("by_status", (q) => q.eq("verificationStatus", "verified"))
      .collect();

    // Apply filters
    if (args.country) {
      businesses = businesses.filter((b) => b.country === args.country);
    }

    if (args.category) {
      businesses = businesses.filter((b) => b.category === args.category);
    }

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      businesses = businesses.filter(
        (b) =>
          b.name.toLowerCase().includes(searchLower) ||
          b.description?.toLowerCase().includes(searchLower)
      );
    }

    const sorted = businesses.sort((a, b) => b.createdAt - a.createdAt);

    if (args.limit && args.limit > 0) {
      return sorted.slice(0, args.limit);
    }

    return sorted;
  },
});
