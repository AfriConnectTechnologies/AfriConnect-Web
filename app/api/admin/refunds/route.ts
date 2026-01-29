import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { processRefund, ChapaError } from "@/lib/chapa";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { z } from "zod";
import { Id } from "@/convex/_generated/dataModel";

// Security headers
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
};

// Validation schema
const refundSchema = z.object({
  paymentId: z.string().min(1, "Payment ID is required"),
  reason: z.string().max(500, "Reason too long").optional(),
  amount: z.number().positive("Amount must be positive").optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: SECURITY_HEADERS }
      );
    }

    // Create authenticated Convex client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    const token = await getToken({ template: "convex" });
    if (token) {
      convex.setAuth(token);
    }

    // Check if user is admin
    const currentUser = await convex.query(api.users.getCurrentUser);
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403, headers: SECURITY_HEADERS }
      );
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    const validation = refundSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Validation failed" },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    const { paymentId, reason, amount } = validation.data;

    // Get payment details from Convex
    const payment = await convex.query(api.payments.getById, {
      paymentId: paymentId as Id<"payments">,
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404, headers: SECURITY_HEADERS }
      );
    }

    // Only allow refunds for subscription payments
    if (payment.paymentType !== "subscription") {
      return NextResponse.json(
        { error: "Refunds are only available for subscription payments" },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    // Only allow refunds for successful payments
    if (payment.status !== "success") {
      return NextResponse.json(
        { error: "Can only refund successful payments" },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    // Check if already refunded
    if (payment.refundedAt) {
      return NextResponse.json(
        { error: "This payment has already been refunded" },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    // Get the Chapa transaction reference
    const chapaTrxRef = payment.chapaTrxRef;
    if (!chapaTrxRef) {
      return NextResponse.json(
        { error: "No Chapa transaction reference found for this payment" },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    // Generate unique refund reference
    const refundReference = `REF-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Process refund with Chapa
    const refundResponse = await processRefund(chapaTrxRef, {
      reason: reason || "Subscription refund requested by admin",
      amount: amount ? amount.toString() : undefined, // If not provided, full refund
      reference: refundReference,
      meta: {
        payment_id: paymentId,
        admin_user_id: userId,
        refund_type: "subscription",
      },
    });

    // Record refund in Convex
    await convex.mutation(api.payments.recordRefund, {
      paymentId: paymentId as Id<"payments">,
      refundAmount: amount || payment.amount,
      refundReason: reason || "Admin initiated refund",
      refundReference,
      adminUserId: userId,
    });

    // If this was a subscription payment, cancel the subscription
    if (payment.metadata) {
      try {
        const metadata = JSON.parse(payment.metadata);
        if (metadata.businessId) {
          const subscription = await convex.query(api.subscriptions.getByBusiness, {
            businessId: metadata.businessId as Id<"businesses">,
          });
          if (subscription) {
            await convex.mutation(api.subscriptions.updateStatus, {
              subscriptionId: subscription._id,
              status: "cancelled",
            });
          }
        }
      } catch (e) {
        console.error("Failed to cancel subscription after refund:", e);
        // Don't fail the refund if subscription cancellation fails
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Refund processed successfully",
        refund: {
          reference: refundReference,
          amount: amount || payment.amount,
          currency: payment.currency,
          chapaResponse: refundResponse.data,
        },
      },
      { headers: SECURITY_HEADERS }
    );
  } catch (error) {
    console.error("Refund error:", error);

    if (error instanceof ChapaError) {
      return NextResponse.json(
        { error: error.message || "Failed to process refund with payment provider" },
        { status: error.statusCode || 503, headers: SECURITY_HEADERS }
      );
    }

    return NextResponse.json(
      { error: "Failed to process refund" },
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
}
