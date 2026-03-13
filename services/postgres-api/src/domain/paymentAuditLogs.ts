import { and, eq, lt } from "drizzle-orm";
import { db } from "../db/client";
import { paymentAuditLogs, webhookEvents } from "../db/schema";
import { requireAdmin, toDoc, type RequestContext } from "./helpers";

export async function create(
  ctx: RequestContext,
  args: {
    paymentId?: string;
    userId?: string;
    action: string;
    status: string;
    ipAddress?: string;
    userAgent?: string;
    txRef?: string;
    metadata?: string;
    errorMessage?: string;
  }
) {
  void ctx;
  const id = crypto.randomUUID();
  await db.insert(paymentAuditLogs).values({
    id,
    paymentId: args.paymentId,
    userId: args.userId,
    action: args.action,
    status: args.status,
    ipAddress: args.ipAddress,
    userAgent: args.userAgent,
    txRef: args.txRef,
    metadata: args.metadata,
    errorMessage: args.errorMessage,
    createdAt: Date.now()
  });

  return id;
}

export async function isWebhookProcessed(ctx: RequestContext, args: { txRef: string }) {
  void ctx;
  const event = await db.select().from(webhookEvents).where(eq(webhookEvents.txRef, args.txRef)).limit(1);
  return !!event[0];
}

export async function markWebhookProcessed(
  ctx: RequestContext,
  args: { txRef: string; eventType: string; signature?: string }
) {
  void ctx;
  const existing = await db.select().from(webhookEvents).where(eq(webhookEvents.txRef, args.txRef)).limit(1);
  if (existing[0]) return { alreadyProcessed: true, eventId: existing[0].id };

  const eventId = crypto.randomUUID();
  await db.insert(webhookEvents).values({
    id: eventId,
    txRef: args.txRef,
    eventType: args.eventType,
    signature: args.signature,
    processedAt: Date.now()
  });

  const allEvents = await db.select().from(webhookEvents).where(eq(webhookEvents.txRef, args.txRef));
  if (allEvents.length > 1) {
    allEvents.sort((a, b) => (a.id < b.id ? -1 : 1));
    const winner = allEvents[0];
    if (winner.id !== eventId) {
      await db.delete(webhookEvents).where(eq(webhookEvents.id, eventId));
      return { alreadyProcessed: true, eventId: winner.id };
    }

    for (const event of allEvents.slice(1)) {
      await db.delete(webhookEvents).where(eq(webhookEvents.id, event.id));
    }
  }

  return { alreadyProcessed: false, eventId };
}

export async function getByPayment(ctx: RequestContext, args: { paymentId: string }) {
  await requireAdmin(ctx);
  const logs = await db.select().from(paymentAuditLogs).where(eq(paymentAuditLogs.paymentId, args.paymentId));
  return logs.sort((a, b) => b.createdAt - a.createdAt).map((l) => toDoc(l));
}

export async function listRecent(ctx: RequestContext, args: { limit?: number; action?: string }) {
  await requireAdmin(ctx);
  const limit = args.limit || 100;

  let logs = await db.select().from(paymentAuditLogs);
  if (args.action) logs = logs.filter((l) => l.action === args.action);

  return logs.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit).map((l) => toDoc(l));
}

export async function getByTxRef(ctx: RequestContext, args: { txRef: string }) {
  await requireAdmin(ctx);
  const logs = await db.select().from(paymentAuditLogs).where(eq(paymentAuditLogs.txRef, args.txRef));
  return logs.sort((a, b) => b.createdAt - a.createdAt).map((l) => toDoc(l));
}

export async function cleanupOldWebhookEvents(ctx: RequestContext, args: { olderThanDays?: number }) {
  await requireAdmin(ctx);
  const days = args.olderThanDays || 30;
  const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

  const oldEvents = await db
    .select()
    .from(webhookEvents)
    .where(lt(webhookEvents.processedAt, cutoffTime))
    .limit(500);

  let deleted = 0;
  for (const event of oldEvents) {
    await db.delete(webhookEvents).where(eq(webhookEvents.id, event.id));
    deleted++;
  }

  const remaining = await db
    .select({ id: webhookEvents.id })
    .from(webhookEvents)
    .where(lt(webhookEvents.processedAt, cutoffTime))
    .limit(1);

  return { deleted, hasMore: remaining.length > 0 };
}
