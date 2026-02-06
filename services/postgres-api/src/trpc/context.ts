import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { verifyClerkAuthHeader } from "../auth/clerk";
import { db } from "../db/client";

export async function createContext(opts: FetchCreateContextFnOptions) {
  const auth = await verifyClerkAuthHeader(opts.req.headers.get("authorization") ?? undefined);

  return {
    db,
    auth
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
