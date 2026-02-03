import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { z } from "zod";
import { Id } from "@/convex/_generated/dataModel";

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
};

const impersonateSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export async function POST(request: NextRequest) {
  try {
    const { userId: adminClerkId, getToken } = await auth();
    if (!adminClerkId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: SECURITY_HEADERS }
      );
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500, headers: SECURITY_HEADERS }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    const validation = impersonateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Validation failed" },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    const { userId } = validation.data;

    if (!/^[a-zA-Z0-9]+$/.test(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    const convex = new ConvexHttpClient(convexUrl);
    const token = await getToken({ template: "convex" });
    if (!token) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401, headers: SECURITY_HEADERS }
      );
    }
    convex.setAuth(token);

    const admin = await convex.query(api.users.getCurrentUser);
    if (!admin || admin.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403, headers: SECURITY_HEADERS }
      );
    }

    const targetUser = await convex.query(api.users.getUser, {
      userId: userId as Id<"users">,
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: SECURITY_HEADERS }
      );
    }

    if (targetUser.clerkId === adminClerkId) {
      return NextResponse.json(
        { error: "You are already signed in as this user" },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    const clerk = await clerkClient();
    const signInToken = await clerk.signInTokens.createSignInToken({
      userId: targetUser.clerkId,
      expiresInSeconds: 10 * 60,
    });

    return NextResponse.json(
      { url: signInToken.url },
      { status: 200, headers: SECURITY_HEADERS }
    );
  } catch (error) {
    console.error("Impersonation failed:", error);
    return NextResponse.json(
      { error: "Failed to impersonate user" },
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
}
