import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { users, verificationTokens } from "../db/schema";
import type { RequestContext } from "./helpers";

function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function createEmailVerificationToken(ctx: RequestContext) {
  if (!ctx.auth.userId) throw new Error("Not authenticated");
  const user = await db.select().from(users).where(eq(users.clerkId, ctx.auth.userId)).limit(1);
  if (!user[0]) throw new Error("User not found");

  if (user[0].emailVerified) {
    return { alreadyVerified: true, token: null };
  }

  const existingTokens = await db
    .select()
    .from(verificationTokens)
    .where(and(eq(verificationTokens.userId, user[0].id), eq(verificationTokens.type, "email")));

  for (const token of existingTokens) {
    await db.update(verificationTokens).set({ used: true }).where(eq(verificationTokens.id, token.id));
  }

  const token = generateToken();
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

  await db.insert(verificationTokens).values({
    id: crypto.randomUUID(),
    userId: user[0].id,
    token,
    type: "email",
    expiresAt,
    used: false,
    createdAt: Date.now()
  });

  return { alreadyVerified: false, token, email: user[0].email, name: user[0].name };
}

export async function verifyEmailToken(ctx: RequestContext, args: { token: string }) {
  void ctx;
  const tokenRecord = await db
    .select()
    .from(verificationTokens)
    .where(eq(verificationTokens.token, args.token))
    .limit(1);

  if (!tokenRecord[0]) {
    return { success: false, error: "Invalid verification token" };
  }

  if (tokenRecord[0].used) {
    return { success: false, error: "Token has already been used" };
  }

  if (tokenRecord[0].expiresAt < Date.now()) {
    return { success: false, error: "Token has expired" };
  }

  await db.update(verificationTokens).set({ used: true }).where(eq(verificationTokens.id, tokenRecord[0].id));

  const user = await db.select().from(users).where(eq(users.id, tokenRecord[0].userId)).limit(1);
  if (!user[0]) return { success: false, error: "User not found" };

  await db.update(users).set({ emailVerified: true, emailVerifiedAt: Date.now() }).where(eq(users.id, tokenRecord[0].userId));

  return { success: true, email: user[0].email };
}

export async function isEmailVerified(ctx: RequestContext) {
  if (!ctx.auth.userId) return { authenticated: false, verified: false };
  const user = await db.select().from(users).where(eq(users.clerkId, ctx.auth.userId)).limit(1);
  if (!user[0]) return { authenticated: true, verified: false, userExists: false };

  return {
    authenticated: true,
    verified: user[0].emailVerified ?? false,
    userExists: true,
    email: user[0].email
  };
}

export async function resendVerificationToken(ctx: RequestContext) {
  if (!ctx.auth.userId) throw new Error("Not authenticated");
  const user = await db.select().from(users).where(eq(users.clerkId, ctx.auth.userId)).limit(1);
  if (!user[0]) throw new Error("User not found");
  if (user[0].emailVerified) return { alreadyVerified: true, token: null };

  const recentTokens = await db
    .select()
    .from(verificationTokens)
    .where(and(eq(verificationTokens.userId, user[0].id), eq(verificationTokens.type, "email")))
    .orderBy(desc(verificationTokens.createdAt))
    .limit(1);

  if (recentTokens[0] && !recentTokens[0].used && Date.now() - recentTokens[0].createdAt < 60 * 1000) {
    return {
      alreadyVerified: false,
      token: null,
      rateLimited: true,
      waitSeconds: Math.ceil((60 * 1000 - (Date.now() - recentTokens[0].createdAt)) / 1000)
    };
  }

  const existingTokens = await db
    .select()
    .from(verificationTokens)
    .where(and(eq(verificationTokens.userId, user[0].id), eq(verificationTokens.type, "email")));

  for (const token of existingTokens) {
    await db.update(verificationTokens).set({ used: true }).where(eq(verificationTokens.id, token.id));
  }

  const token = generateToken();
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

  await db.insert(verificationTokens).values({
    id: crypto.randomUUID(),
    userId: user[0].id,
    token,
    type: "email",
    expiresAt,
    used: false,
    createdAt: Date.now()
  });

  return { alreadyVerified: false, token, rateLimited: false, email: user[0].email, name: user[0].name };
}
