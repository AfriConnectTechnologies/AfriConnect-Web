import { NextRequest, NextResponse } from "next/server";
import { verifyPayment, ChapaError } from "@/lib/chapa";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { COMMERCE_ENABLED } from "@/lib/features";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  // Check if commerce features are enabled
  if (!COMMERCE_ENABLED) {
    return NextResponse.json(
      { error: "Payment features are currently unavailable. Coming soon!" },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const txRef = searchParams.get("tx_ref");

    if (!txRef) {
      return NextResponse.json(
        { error: "Transaction reference is required" },
        { status: 400 }
      );
    }

    // Verify with Chapa
    const chapaResponse = await verifyPayment(txRef);

    // Update payment status in Convex
    const status = chapaResponse.data.status === "success" ? "success" : "failed";
    
    await convex.mutation(api.payments.updateStatus, {
      txRef,
      status,
      chapaTrxRef: chapaResponse.data.reference,
    });

    return NextResponse.json({
      success: true,
      status,
      data: {
        amount: chapaResponse.data.amount,
        currency: chapaResponse.data.currency,
        reference: chapaResponse.data.reference,
        tx_ref: chapaResponse.data.tx_ref,
        payment_method: chapaResponse.data.method,
        created_at: chapaResponse.data.created_at,
      },
    });

  } catch (error) {
    console.error("Payment verification error:", error);

    if (error instanceof ChapaError) {
      return NextResponse.json(
        { error: error.message, details: error.response },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Also support POST for flexibility
  const body = await request.json();
  const txRef = body.tx_ref;

  if (!txRef) {
    return NextResponse.json(
      { error: "Transaction reference is required" },
      { status: 400 }
    );
  }

  // Create a new URL with the tx_ref as query param
  const url = new URL(request.url);
  url.searchParams.set("tx_ref", txRef);
  
  // Create a new request with the modified URL
  const newRequest = new NextRequest(url, {
    method: "GET",
    headers: request.headers,
  });

  return GET(newRequest);
}

