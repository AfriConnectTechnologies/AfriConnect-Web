import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { businesses, chatReports, products, users } from "../db/schema";
import { getCurrentUser, requireUser, toDoc, type RequestContext } from "./helpers";

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

function shortHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function generateChannelId(prefix: string, ...ids: string[]): string {
  const sorted = [...ids].sort();
  const combined = sorted.join("_");
  const hash = shortHash(combined);
  return `${prefix}_${hash}`;
}

export async function getProductChannelInfo(ctx: RequestContext, args: { productId: string }) {
  const user = await getCurrentUser(ctx);
  if (!user) return null;

  const product = await db.select().from(products).where(eq(products.id, args.productId)).limit(1);
  if (!product[0]) return null;

  const seller = await db.select().from(users).where(eq(users.id, product[0].sellerId)).limit(1);
  if (!seller[0]) return null;

  let business = null;
  if (seller[0].businessId) {
    const b = await db.select().from(businesses).where(eq(businesses.id, seller[0].businessId)).limit(1);
    business = b[0] ?? null;
  }

  const channelId = generateChannelId("p", args.productId, user.id, seller[0].id);
  const currentUserStreamId = user.clerkId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const sellerStreamId = seller[0].clerkId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const currentUserName = user.name || user.email || "User";
  const sellerNameDisplay = seller[0].name || seller[0].email || "Seller";

  return {
    channelId,
    channelType: "messaging",
    productId: args.productId,
    productName: product[0].name,
    sellerId: seller[0].id,
    sellerName: sellerNameDisplay,
    sellerClerkId: seller[0].clerkId,
    sellerStreamId,
    currentUserStreamId,
    currentUserName,
    members: [currentUserStreamId, sellerStreamId],
    memberNames: [currentUserName, sellerNameDisplay],
    businessName: business?.name,
    isOwnProduct: user.id === seller[0].id
  };
}

export async function getBusinessChannelInfo(ctx: RequestContext, args: { businessId: string }) {
  const user = await getCurrentUser(ctx);
  if (!user) return null;

  const business = await db.select().from(businesses).where(eq(businesses.id, args.businessId)).limit(1);
  if (!business[0]) return null;

  const owner = await db.select().from(users).where(eq(users.id, business[0].ownerId)).limit(1);
  if (!owner[0]) return null;

  const channelId = generateChannelId("b", args.businessId, user.id, owner[0].id);
  const currentUserStreamId = user.clerkId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const ownerStreamId = owner[0].clerkId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const currentUserName = user.name || user.email || "User";
  const ownerNameDisplay = owner[0].name || owner[0].email || "Owner";

  return {
    channelId,
    channelType: "messaging",
    businessId: args.businessId,
    businessName: business[0].name,
    ownerId: owner[0].id,
    ownerName: ownerNameDisplay,
    ownerClerkId: owner[0].clerkId,
    ownerStreamId,
    currentUserStreamId,
    currentUserName,
    members: [currentUserStreamId, ownerStreamId],
    memberNames: [currentUserName, ownerNameDisplay],
    isOwnBusiness: user.id === owner[0].id
  };
}

export async function reportConversation(ctx: RequestContext, args: { channelId: string; reason: string }) {
  const user = await requireUser(ctx);

  const existing = await db
    .select()
    .from(chatReports)
    .where(and(eq(chatReports.channelId, args.channelId), eq(chatReports.reporterId, user.id)))
    .limit(1);

  if (existing[0] && existing[0].status === "pending") {
    throw new ValidationError("You have already reported this conversation");
  }

  const reportId = crypto.randomUUID();
  await db.insert(chatReports).values({
    id: reportId,
    channelId: args.channelId,
    reporterId: user.id,
    reason: args.reason,
    status: "pending",
    createdAt: Date.now()
  });

  return reportId;
}

export async function listChatReports(ctx: RequestContext, args: { status?: "pending" | "reviewed" | "resolved" }) {
  const user = await requireUser(ctx);
  if (user.role !== "admin") throw new Error("Unauthorized: Admin access required");

  let reports = await db.select().from(chatReports);
  if (args.status) reports = reports.filter((r) => r.status === args.status);

  const enriched = await Promise.all(
    reports.map(async (report) => {
      const reporter = await db.select().from(users).where(eq(users.id, report.reporterId)).limit(1);
      return { ...toDoc(report), reporterName: reporter[0]?.name || reporter[0]?.email || "Unknown" };
    })
  );

  return enriched.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

export async function updateReportStatus(
  ctx: RequestContext,
  args: { reportId: string; status: "pending" | "reviewed" | "resolved" }
) {
  const user = await requireUser(ctx);
  if (user.role !== "admin") throw new Error("Unauthorized: Admin access required");

  await db.update(chatReports).set({ status: args.status }).where(eq(chatReports.id, args.reportId));
  const updated = await db.select().from(chatReports).where(eq(chatReports.id, args.reportId)).limit(1);
  return toDoc(updated[0] ?? null);
}

export async function getStreamUserId(ctx: RequestContext) {
  const user = await getCurrentUser(ctx);
  if (!user) return null;
  return user.clerkId.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export async function deleteChannelReports(ctx: RequestContext, args: { channelId: string }) {
  const user = await requireUser(ctx);
  const reports = await db.select().from(chatReports).where(eq(chatReports.channelId, args.channelId));

  let deletedCount = 0;
  for (const report of reports) {
    if (user.role === "admin" || report.reporterId === user.id) {
      await db.delete(chatReports).where(eq(chatReports.id, report.id));
      deletedCount++;
    }
  }

  return { deletedCount };
}
