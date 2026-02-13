import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { db } from "../src/db/client";
import * as schema from "../src/db/schema";

const exportDir = join(process.cwd(), "export-data");

const tableMap: Record<string, any> = {
  users: schema.users,
  businesses: schema.businesses,
  orders: schema.orders,
  products: schema.products,
  productImages: schema.productImages,
  inventoryTransactions: schema.inventoryTransactions,
  cartItems: schema.cartItems,
  orderItems: schema.orderItems,
  payments: schema.payments,
  verificationTokens: schema.verificationTokens,
  subscriptionPlans: schema.subscriptionPlans,
  subscriptions: schema.subscriptions,
  paymentAuditLogs: schema.paymentAuditLogs,
  webhookEvents: schema.webhookEvents,
  chatReports: schema.chatReports,
  businessProducts: schema.businessProducts,
  originCalculations: schema.originCalculations
};

const tableOrder = [
  "users",
  "businesses",
  "subscriptionPlans",
  "subscriptions",
  "products",
  "productImages",
  "inventoryTransactions",
  "businessProducts",
  "originCalculations",
  "orders",
  "orderItems",
  "cartItems",
  "payments",
  "paymentAuditLogs",
  "verificationTokens",
  "webhookEvents",
  "chatReports"
];

for (const tableName of tableOrder) {
  const file = join(exportDir, `${tableName}.json`);
  const exists = readdirSync(exportDir).includes(`${tableName}.json`);
  if (!exists) {
    continue;
  }

  const raw = readFileSync(file, "utf-8");
  const rows = JSON.parse(raw);
  if (!Array.isArray(rows)) {
    throw new Error(`Expected array for ${tableName}.json`);
  }

  const table = tableMap[tableName];
  if (!table) {
    throw new Error(`Unknown table: ${tableName}`);
  }

  for (const row of rows) {
    const { _id, _creationTime, ...rest } = row as Record<string, unknown>;
    const mapped = { id: (_id as string) ?? (row as any).id, ...rest };
    await db
      .insert(table)
      .values(mapped)
      .onConflictDoUpdate({
        target: table.id,
        set: mapped
      });
  }
}

console.log("Import complete.");
