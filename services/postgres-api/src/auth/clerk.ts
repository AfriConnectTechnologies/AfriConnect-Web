import { env } from "../env";
import { createClerkClient, verifyToken } from "@clerk/backend";

export interface AuthContext {
  userId: string | null;
  sessionId: string | null;
  claims: Record<string, unknown> | null;
}

const clerk = createClerkClient({
  secretKey: env.CLERK_SECRET_KEY
});

export async function verifyClerkAuthHeader(authorization?: string): Promise<AuthContext> {
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return { userId: null, sessionId: null, claims: null };
  }

  const token = authorization.replace("Bearer ", "").trim();
  if (!token) {
    return { userId: null, sessionId: null, claims: null };
  }

  const payload = (await verifyToken(token, {
    secretKey: env.CLERK_SECRET_KEY,
    audience: env.CLERK_JWT_TEMPLATE
  })) as { sub?: string; sid?: string; [key: string]: unknown } | undefined;

  const userId = typeof payload?.sub === "string" ? payload.sub : null;
  const sessionId = typeof payload?.sid === "string" ? payload.sid : null;

  return {
    userId,
    sessionId,
    claims: (payload ?? null) as Record<string, unknown> | null
  };
}

export async function getClerkUser(userId: string) {
  return clerk.users.getUser(userId);
}
