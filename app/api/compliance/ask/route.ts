import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { z } from "zod";

import { askComplianceAssistant } from "@/lib/compliance-ai/service";
import { isComplianceEnabledForEmail } from "@/lib/features";

const requestSchema = z.object({
  question: z.string().trim().min(5).max(2000),
  filters: z
    .object({
      country: z.string().trim().min(1).optional(),
      jurisdiction: z.string().trim().min(1).optional(),
      language: z.string().trim().min(1).optional(),
      documentType: z.string().trim().min(1).optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const userEmail = user?.emailAddresses[0]?.emailAddress;
    if (!isComplianceEnabledForEmail(userEmail)) {
      return NextResponse.json(
        { error: "Compliance tools are currently unavailable." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please provide a valid compliance question." },
        { status: 400 }
      );
    }

    const answer = await askComplianceAssistant(
      parsed.data.question,
      parsed.data.filters
    );

    return NextResponse.json(answer);
  } catch (error) {
    console.error("Compliance AI ask route failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to answer compliance question",
      },
      { status: 500 }
    );
  }
}
