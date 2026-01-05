import { NextRequest, NextResponse } from "next/server";
import { verifyPayment } from "@/lib/chapa";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import crypto from "crypto";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Verify webhook signature from Chapa
function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("x-chapa-signature") || 
                      request.headers.get("Chapa-Signature");

    // Verify webhook signature if encryption key is available
    const webhookSecret = process.env.CHAPA_ENCRYPTION_KEY;
    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(payload, signature, webhookSecret);
      if (!isValid) {
        console.error("Invalid webhook signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    const body = JSON.parse(payload);
    const { tx_ref, status, trx_ref } = body;

    if (!tx_ref) {
      return NextResponse.json(
        { error: "Missing transaction reference" },
        { status: 400 }
      );
    }

    console.log(`Webhook received for tx_ref: ${tx_ref}, status: ${status}`);

    // Verify the payment with Chapa to confirm
    let verifiedStatus = status;
    try {
      const verification = await verifyPayment(tx_ref);
      verifiedStatus = verification.data.status;
    } catch (verifyError) {
      console.error("Error verifying payment:", verifyError);
      // Continue with the status from webhook if verification fails
    }

    // Map Chapa status to our status
    let paymentStatus: "success" | "failed" | "pending" | "cancelled";
    switch (verifiedStatus?.toLowerCase()) {
      case "success":
      case "successful":
        paymentStatus = "success";
        break;
      case "failed":
        paymentStatus = "failed";
        break;
      case "pending":
        paymentStatus = "pending";
        break;
      default:
        paymentStatus = "failed";
    }

    // Update payment in database
    await convex.mutation(api.payments.updateStatus, {
      txRef: tx_ref,
      status: paymentStatus,
      chapaTrxRef: trx_ref,
    });

    console.log(`Payment ${tx_ref} updated to status: ${paymentStatus}`);

    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
    });

  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// Handle GET requests (Chapa sometimes sends GET for callbacks)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const txRef = searchParams.get("tx_ref") || searchParams.get("trx_ref");
  const status = searchParams.get("status");

  if (!txRef) {
    return NextResponse.json(
      { error: "Missing transaction reference" },
      { status: 400 }
    );
  }

  // Verify and update payment
  try {
    const verification = await verifyPayment(txRef);
    const paymentStatus = verification.data.status === "success" ? "success" : "failed";

    await convex.mutation(api.payments.updateStatus, {
      txRef,
      status: paymentStatus,
      chapaTrxRef: verification.data.reference,
    });

    return NextResponse.json({
      success: true,
      status: paymentStatus,
    });
  } catch (error) {
    console.error("Webhook GET processing error:", error);
    
    // If verification fails but we have status from query, use that
    if (status) {
      const paymentStatus = status === "success" ? "success" : "failed";
      await convex.mutation(api.payments.updateStatus, {
        txRef,
        status: paymentStatus,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Webhook processed",
    });
  }
}

