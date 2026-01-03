import { MutationCtx } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

/**
 * Gets the current authenticated user, creating them if they don't exist.
 * This eliminates race conditions where mutations run before ensureUser completes.
 */
export async function getOrCreateUser(ctx: MutationCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    throw new Error("Not authenticated");
  }

  let user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first();

  if (!user) {
    const userId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: identity.email ?? "",
      name: typeof identity.name === "string" ? identity.name : undefined,
      imageUrl: typeof identity.picture === "string" ? identity.picture : undefined,
    });
    user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("Failed to create user");
    }
  }

  return user;
}

