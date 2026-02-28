import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { internal } from "../../../convex/_generated/api.js";

const here = dirname(fileURLToPath(import.meta.url));
const serviceRoot = resolve(here, "..");
const localEnv = resolve(serviceRoot, ".env");
const rootEnv = resolve(serviceRoot, "..", "..", ".env");

if (existsSync(localEnv)) {
  config({ path: localEnv });
}
if (existsSync(rootEnv)) {
  config({ path: rootEnv, override: false });
}

const CONVEX_URL = process.env.CONVEX_URL;
const rawAdminKey = process.env.CONVEX_ADMIN_KEY ?? process.env.CONVEX_DEPLOY_KEY;
const CONVEX_ADMIN_KEY = rawAdminKey
  ?.trim()
  .replace(/^['"]|['"]$/g, "")
  .replace(/\s+/g, "");

if (!CONVEX_URL || !CONVEX_ADMIN_KEY) {
  throw new Error("CONVEX_URL and CONVEX_ADMIN_KEY (or CONVEX_DEPLOY_KEY) are required to export data.");
}

const keyPreview = CONVEX_ADMIN_KEY.slice(0, 6);
console.log(`Using Convex URL: ${CONVEX_URL}`);
console.log(`Using Convex admin key prefix: ${keyPreview}… (len=${CONVEX_ADMIN_KEY.length})`);

const client = new ConvexHttpClient(CONVEX_URL);
client.setAdminAuth(CONVEX_ADMIN_KEY);

const tables = [
  { name: "users", query: internal.export.listUsers },
  { name: "businesses", query: internal.export.listBusinesses },
  { name: "orders", query: internal.export.listOrders },
  { name: "products", query: internal.export.listProducts },
  { name: "productImages", query: internal.export.listProductImages },
  { name: "inventoryTransactions", query: internal.export.listInventoryTransactions },
  { name: "cartItems", query: internal.export.listCartItems },
  { name: "orderItems", query: internal.export.listOrderItems },
  { name: "payments", query: internal.export.listPayments },
  { name: "verificationTokens", query: internal.export.listVerificationTokens },
  { name: "subscriptionPlans", query: internal.export.listSubscriptionPlans },
  { name: "subscriptions", query: internal.export.listSubscriptions },
  { name: "paymentAuditLogs", query: internal.export.listPaymentAuditLogs },
  { name: "webhookEvents", query: internal.export.listWebhookEvents },
  { name: "chatReports", query: internal.export.listChatReports },
  { name: "businessProducts", query: internal.export.listBusinessProducts },
  { name: "originCalculations", query: internal.export.listOriginCalculations }
];

const exportDir = join(process.cwd(), "export-data");
mkdirSync(exportDir, { recursive: true });

for (const table of tables) {
  const rows = await client.query(table.query, {});
  writeFileSync(join(exportDir, `${table.name}.json`), JSON.stringify(rows, null, 2));
}
