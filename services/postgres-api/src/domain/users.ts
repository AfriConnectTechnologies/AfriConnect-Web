import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { businesses, users } from "../db/schema";
import { requireAdmin, requireEmailFromClaims, toDoc, toDocs, type RequestContext } from "./helpers";

export async function getCurrentUser(ctx: RequestContext) {
  if (!ctx.auth.userId) return null;
  const result = await db.select().from(users).where(eq(users.clerkId, ctx.auth.userId)).limit(1);
  return toDoc(result[0] ?? null);
}

export async function ensureUser(ctx: RequestContext) {
  if (!ctx.auth.userId) {
    throw new Error("Not authenticated");
  }

  const existing = await db.select().from(users).where(eq(users.clerkId, ctx.auth.userId)).limit(1);
  if (existing[0]) {
    const user = existing[0];
    const shouldSendWelcomeEmail = !user.welcomeEmailSent;
    const shouldSendVerificationEmail = !user.emailVerified && !user.welcomeEmailSent;
    return {
      userId: user.id,
      isNewUser: false,
      shouldSendWelcomeEmail,
      shouldSendVerificationEmail,
      emailVerified: user.emailVerified ?? false,
      email: user.email,
      name: user.name ?? undefined
    };
  }

  const email = requireEmailFromClaims(ctx);
  const name = typeof ctx.auth.claims?.name === "string" ? ctx.auth.claims.name : undefined;
  const imageUrl = typeof ctx.auth.claims?.picture === "string" ? ctx.auth.claims.picture : undefined;

  const userId = crypto.randomUUID();
  await db.insert(users).values({
    id: userId,
    clerkId: ctx.auth.userId,
    email,
    name,
    imageUrl,
    role: "buyer",
    welcomeEmailSent: false,
    emailVerified: false
  });

  return {
    userId,
    isNewUser: true,
    shouldSendWelcomeEmail: true,
    shouldSendVerificationEmail: true,
    emailVerified: false,
    email,
    name
  };
}

export async function markWelcomeEmailSent(ctx: RequestContext) {
  if (!ctx.auth.userId) throw new Error("Not authenticated");
  const user = await db.select().from(users).where(eq(users.clerkId, ctx.auth.userId)).limit(1);
  if (!user[0]) return;
  await db.update(users).set({ welcomeEmailSent: true }).where(eq(users.id, user[0].id));
}

export async function updateProfile(ctx: RequestContext, args: { name?: string }) {
  if (!ctx.auth.userId) throw new Error("Not authenticated");
  const user = await db.select().from(users).where(eq(users.clerkId, ctx.auth.userId)).limit(1);
  if (!user[0]) throw new Error("User not found");

  await db.update(users).set({ name: args.name ?? undefined }).where(eq(users.id, user[0].id));
  const updated = await db.select().from(users).where(eq(users.id, user[0].id)).limit(1);
  return toDoc(updated[0] ?? null);
}

export async function getUserRole(ctx: RequestContext) {
  if (!ctx.auth.userId) return null;
  const user = await db.select().from(users).where(eq(users.clerkId, ctx.auth.userId)).limit(1);
  return user[0]?.role ?? "buyer";
}

export async function listUsers(
  ctx: RequestContext,
  args: { role?: "buyer" | "seller" | "admin"; search?: string }
) {
  await requireAdmin(ctx);

  let result: typeof users.$inferSelect[] = [];
  if (args.role) {
    result = await db.select().from(users).where(eq(users.role, args.role));
  } else {
    result = await db.select().from(users);
  }

  if (args.search) {
    const searchLower = args.search.toLowerCase();
    result = result.filter(
      (u) => u.name?.toLowerCase().includes(searchLower) || u.email.toLowerCase().includes(searchLower)
    );
  }

  const usersWithBusiness = await Promise.all(
    result.map(async (user) => {
      let business = null;
      if (user.businessId) {
        const b = await db.select().from(businesses).where(eq(businesses.id, user.businessId)).limit(1);
        business = toDoc(b[0] ?? null);
      }
      return { ...toDoc(user), business };
    })
  );

  return usersWithBusiness;
}

export async function getUsersByRole(ctx: RequestContext, args: { role: "buyer" | "seller" | "admin" }) {
  await requireAdmin(ctx);
  const result = await db.select().from(users).where(eq(users.role, args.role));
  return toDocs(result as any) as any;
}

export async function setUserRole(
  ctx: RequestContext,
  args: { userId: string; role: "buyer" | "seller" | "admin" }
) {
  const admin = await requireAdmin(ctx);

  if (admin.id === args.userId && args.role !== "admin") {
    throw new Error("Cannot change your own admin role");
  }

  const user = await db.select().from(users).where(eq(users.id, args.userId)).limit(1);
  if (!user[0]) throw new Error("User not found");

  await db.update(users).set({ role: args.role }).where(eq(users.id, args.userId));
  const updated = await db.select().from(users).where(eq(users.id, args.userId)).limit(1);
  return toDoc(updated[0] ?? null);
}

export async function getUser(ctx: RequestContext, args: { userId: string }) {
  await requireAdmin(ctx);
  const result = await db.select().from(users).where(eq(users.id, args.userId)).limit(1);
  return toDoc(result[0] ?? null);
}
