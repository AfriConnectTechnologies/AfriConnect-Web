import { z } from "zod";
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_JWT_ISSUER_DOMAIN: z.string().min(1),
  CLERK_JWT_TEMPLATE: z.string().min(1),
  CRON_SECRET: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  CHAPA_SECRET_KEY: z.string().optional(),
  CHAPA_WEBHOOK_SECRET: z.string().optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional()
});

export const env = envSchema.parse(process.env);
