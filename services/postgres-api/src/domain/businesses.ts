import { and, eq, or } from "drizzle-orm";
import { db } from "../db/client";
import { businesses, users } from "../db/schema";
import { getOrCreateUser, requireAdmin, requireUser, toDoc, type RequestContext } from "./helpers";

export async function createBusiness(
  ctx: RequestContext,
  args: {
    name: string;
    description?: string;
    country: string;
    city?: string;
    address?: string;
    phone?: string;
    website?: string;
    category: string;
    businessLicenceImageUrl?: string;
    businessLicenceNumber?: string;
    memoOfAssociationImageUrl?: string;
    tinCertificateImageUrl?: string;
    tinCertificateNumber?: string;
    hasImportExportPermit?: boolean;
    importExportPermitImageUrl?: string;
    importExportPermitNumber?: string;
  }
) {
  const user = await getOrCreateUser(ctx);
  if (user.businessId) {
    throw new Error("You already have a registered business");
  }

  const now = Date.now();
  const businessId = crypto.randomUUID();

  await db.insert(businesses).values({
    id: businessId,
    ownerId: user.id,
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
    updatedAt: now
  });

  await db.update(users).set({ role: "seller", businessId }).where(eq(users.id, user.id));

  const business = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1);

  return {
    ...toDoc(business[0] ?? null),
    ownerEmail: user.email,
    ownerName: user.name
  };
}

export async function updateBusiness(
  ctx: RequestContext,
  args: {
    name?: string;
    description?: string;
    country?: string;
    city?: string;
    address?: string;
    phone?: string;
    website?: string;
    category?: string;
    logoUrl?: string;
    businessLicenceImageUrl?: string;
    businessLicenceNumber?: string;
    memoOfAssociationImageUrl?: string;
    tinCertificateImageUrl?: string;
    tinCertificateNumber?: string;
    hasImportExportPermit?: boolean;
    importExportPermitImageUrl?: string;
    importExportPermitNumber?: string;
  }
) {
  const user = await requireUser(ctx);
  if (!user.businessId) throw new Error("You don't have a registered business");

  const business = await db.select().from(businesses).where(eq(businesses.id, user.businessId)).limit(1);
  if (!business[0]) throw new Error("Business not found");
  if (business[0].ownerId !== user.id) throw new Error("Unauthorized: You can only update your own business");

  const updates: Partial<typeof businesses.$inferInsert> = { updatedAt: Date.now() };

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

  await db.update(businesses).set(updates).where(eq(businesses.id, user.businessId));

  const updated = await db.select().from(businesses).where(eq(businesses.id, user.businessId)).limit(1);
  return toDoc(updated[0] ?? null);
}

export async function getBusiness(ctx: RequestContext, args: { businessId: string }) {
  const business = await db.select().from(businesses).where(eq(businesses.id, args.businessId)).limit(1);
  if (!business[0]) return null;
  const owner = await db.select().from(users).where(eq(users.id, business[0].ownerId)).limit(1);
  return {
    ...toDoc(business[0]),
    owner: owner[0]
      ? {
          _id: owner[0].id,
          clerkId: owner[0].clerkId,
          name: owner[0].name,
          email: owner[0].email,
          imageUrl: owner[0].imageUrl
        }
      : null
  };
}

export async function getMyBusiness(ctx: RequestContext) {
  const user = await requireUser(ctx);
  if (!user.businessId) return null;
  const business = await db.select().from(businesses).where(eq(businesses.id, user.businessId)).limit(1);
  return toDoc(business[0] ?? null);
}

export async function listBusinesses(
  ctx: RequestContext,
  args: { status?: "pending" | "verified" | "rejected"; country?: string; category?: string; search?: string }
) {
  await requireAdmin(ctx);
  let result: typeof businesses.$inferSelect[] = [];

  if (args.status) {
    result = await db.select().from(businesses).where(eq(businesses.verificationStatus, args.status));
  } else {
    result = await db.select().from(businesses);
  }

  if (args.country) result = result.filter((b) => b.country === args.country);
  if (args.category) result = result.filter((b) => b.category === args.category);
  if (args.search) {
    const searchLower = args.search.toLowerCase();
    result = result.filter(
      (b) => b.name.toLowerCase().includes(searchLower) || b.description?.toLowerCase().includes(searchLower)
    );
  }

  const withOwner = await Promise.all(
    result.map(async (business) => {
      const owner = await db.select().from(users).where(eq(users.id, business.ownerId)).limit(1);
      return {
        ...toDoc(business),
        owner: owner[0]
          ? {
              _id: owner[0].id,
              name: owner[0].name,
              email: owner[0].email
            }
          : null
      };
    })
  );

  return withOwner.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

export async function isDocumentUrlAllowed(ctx: RequestContext, args: { url: string }) {
  await requireAdmin(ctx);
  const [byLicence, byMemo, byTin, byPermit] = await Promise.all([
    db.select().from(businesses).where(eq(businesses.businessLicenceImageUrl, args.url)).limit(1),
    db.select().from(businesses).where(eq(businesses.memoOfAssociationImageUrl, args.url)).limit(1),
    db.select().from(businesses).where(eq(businesses.tinCertificateImageUrl, args.url)).limit(1),
    db.select().from(businesses).where(eq(businesses.importExportPermitImageUrl, args.url)).limit(1)
  ]);
  return !!(byLicence[0] ?? byMemo[0] ?? byTin[0] ?? byPermit[0]);
}

export async function verifyBusiness(
  ctx: RequestContext,
  args: { businessId: string; status: "verified" | "rejected" }
) {
  await requireAdmin(ctx);
  const business = await db.select().from(businesses).where(eq(businesses.id, args.businessId)).limit(1);
  if (!business[0]) throw new Error("Business not found");

  await db
    .update(businesses)
    .set({ verificationStatus: args.status, updatedAt: Date.now() })
    .where(eq(businesses.id, args.businessId));

  const updated = await db.select().from(businesses).where(eq(businesses.id, args.businessId)).limit(1);
  const owner = await db.select().from(users).where(eq(users.id, business[0].ownerId)).limit(1);

  return {
    ...toDoc(updated[0] ?? null),
    ownerEmail: owner[0]?.email,
    ownerName: owner[0]?.name
  };
}

export async function getCountries(ctx: RequestContext) {
  void ctx;
  const all = await db.select({ country: businesses.country }).from(businesses);
  const countries = [...new Set(all.map((b) => b.country))];
  return countries.sort();
}

export async function getCategories(ctx: RequestContext) {
  void ctx;
  const all = await db.select({ category: businesses.category }).from(businesses);
  const categories = [...new Set(all.map((b) => b.category))];
  return categories.sort();
}

export async function publicDirectory(
  ctx: RequestContext,
  args: { country?: string; category?: string; search?: string; limit?: number }
) {
  void ctx;
  let result = await db
    .select()
    .from(businesses)
    .where(eq(businesses.verificationStatus, "verified"));

  if (args.country) result = result.filter((b) => b.country === args.country);
  if (args.category) result = result.filter((b) => b.category === args.category);
  if (args.search) {
    const searchLower = args.search.toLowerCase();
    result = result.filter(
      (b) => b.name.toLowerCase().includes(searchLower) || b.description?.toLowerCase().includes(searchLower)
    );
  }

  const sorted = result.sort((a, b) => b.createdAt - a.createdAt);
  if (args.limit && args.limit > 0) {
    return sorted.slice(0, args.limit).map((b) => toDoc(b));
  }
  return sorted.map((b) => toDoc(b));
}
