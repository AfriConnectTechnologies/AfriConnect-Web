import { Elysia } from "elysia";
import cors from "@elysiajs/cors";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./trpc/router";
import { createContext } from "./trpc/context";
import { env } from "./env";
import { db } from "./db/client";
import { subscriptions, webhookEvents } from "./db/schema";
import { and, eq, lt } from "drizzle-orm";

const app = new Elysia();

app.use(
  cors({
    origin: env.NEXT_PUBLIC_APP_URL ? [env.NEXT_PUBLIC_APP_URL] : true,
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true
  })
);

app.onAfterHandle(({ set }) => {
  set.headers["X-Content-Type-Options"] = "nosniff";
  set.headers["X-Frame-Options"] = "DENY";
  set.headers["X-XSS-Protection"] = "1; mode=block";
  set.headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
  set.headers["Cache-Control"] = "no-store";
});

app.get("/health", () => ({ ok: true }));

app.all("/trpc/*", async ({ request }) => {
  return fetchRequestHandler({
    endpoint: "/trpc",
    req: request,
    router: appRouter,
    createContext
  });
});

app.post("/cron/subscriptions/process-expired", async ({ request, set }) => {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== env.CRON_SECRET) {
    set.status = 401;
    return { error: "Unauthorized" };
  }

  const now = Date.now();

  const expiredTrials = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.status, "trialing"), lt(subscriptions.currentPeriodEnd, now)));

  const cancelAtEnd = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.cancelAtPeriodEnd, true),
        lt(subscriptions.currentPeriodEnd, now)
      )
    );

  for (const sub of expiredTrials) {
    await db
      .update(subscriptions)
      .set({ status: "expired", updatedAt: now })
      .where(eq(subscriptions.id, sub.id));
  }

  for (const sub of cancelAtEnd) {
    if (sub.status === "cancelled") continue;
    await db
      .update(subscriptions)
      .set({ status: "cancelled", updatedAt: now })
      .where(eq(subscriptions.id, sub.id));
  }

  return { processed: expiredTrials.length + cancelAtEnd.length };
});

app.post("/cron/webhook-events/cleanup", async ({ request, set }) => {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== env.CRON_SECRET) {
    set.status = 401;
    return { error: "Unauthorized" };
  }

  const body = (await request.json().catch(() => ({}))) as { olderThanDays?: number };
  const days = typeof body.olderThanDays === "number" ? body.olderThanDays : 30;
  const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

  const oldEvents = await db
    .select()
    .from(webhookEvents)
    .where(lt(webhookEvents.processedAt, cutoffTime))
    .limit(500);

  for (const event of oldEvents) {
    await db.delete(webhookEvents).where(eq(webhookEvents.id, event.id));
  }

  const remaining = await db
    .select({ id: webhookEvents.id })
    .from(webhookEvents)
    .where(lt(webhookEvents.processedAt, cutoffTime))
    .limit(1);

  return { deleted: oldEvents.length, hasMore: remaining.length > 0 };
});

app.listen(4001);

console.log("postgres-api running on http://localhost:4001");
