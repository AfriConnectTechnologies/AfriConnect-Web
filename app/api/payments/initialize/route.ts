import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { initializePayment, getPaymentUrls, ChapaError } from "@/lib/chapa";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount, currency = "ETB", paymentType = "order", metadata } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    // Create authenticated Convex client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    const token = await getToken({ template: "convex" });
    if (token) {
      convex.setAuth(token);
    }

    // Create payment record in Convex (also snapshots cart for order payments)
    const payment = await convex.mutation(api.payments.create, {
      amount,
      currency,
      paymentType,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Failed to create payment record" },
        { status: 500 }
      );
    }

    // Get base URL for callbacks
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      request.headers.get("origin") || 
      "http://localhost:3000";

    const urls = getPaymentUrls(baseUrl, payment.txRef);

    // Parse user name
    const firstName = user.firstName || user.username || "Customer";
    const lastName = user.lastName || "";
    const email = user.emailAddresses[0]?.emailAddress || "";

    // Initialize Chapa payment
    const chapaResponse = await initializePayment({
      amount: amount.toString(),
      currency,
      email,
      first_name: firstName,
      last_name: lastName,
      tx_ref: payment.txRef,
      callback_url: urls.callback_url,
      return_url: urls.return_url,
      customization: {
        title: "AfriConnect",
        description: paymentType === "subscription" 
          ? "Subscription" 
          : "Order Payment",
      },
      meta: {
        payment_id: payment._id?.toString() || "",
        user_id: userId,
        payment_type: paymentType,
      },
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: chapaResponse.data.checkout_url,
      txRef: payment.txRef,
      paymentId: payment._id,
    });

  } catch (error) {
    console.error("Payment initialization error:", error);

    if (error instanceof ChapaError) {
      return NextResponse.json(
        { error: error.message, details: error.response },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to initialize payment" },
      { status: 500 }
    );
  }
}

