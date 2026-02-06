import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "../env";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10
});

export const db = drizzle(pool);

export type DbClient = typeof db;
