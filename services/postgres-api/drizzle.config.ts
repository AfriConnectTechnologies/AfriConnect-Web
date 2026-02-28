import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const localEnv = resolve(here, ".env");
const rootEnv = resolve(here, "..", "..", ".env");

if (existsSync(localEnv)) {
  config({ path: localEnv });
}
if (existsSync(rootEnv)) {
  config({ path: rootEnv, override: false });
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for drizzle-kit");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL
  }
});
