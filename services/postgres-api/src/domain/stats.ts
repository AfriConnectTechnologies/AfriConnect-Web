import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { orders, users } from "../db/schema";
import type { RequestContext } from "./helpers";

export async function getDashboardStats(ctx: RequestContext) {
  if (!ctx.auth.userId) throw new Error("Not authenticated");

  const user = await db.select().from(users).where(eq(users.clerkId, ctx.auth.userId)).limit(1);
  if (!user[0]) {
    return { totalOrders: 0, totalRevenue: 0, pendingOrders: 0, completedOrders: 0 };
  }

  const ordersList = await db.select().from(orders).where(eq(orders.userId, user[0].id));
  const totalOrders = ordersList.length;
  const totalRevenue = ordersList.filter((o) => o.status === "completed").reduce((sum, o) => sum + o.amount, 0);
  const pendingOrders = ordersList.filter((o) => o.status === "pending" || o.status === "processing").length;
  const completedOrders = ordersList.filter((o) => o.status === "completed").length;

  return { totalOrders, totalRevenue, pendingOrders, completedOrders };
}
