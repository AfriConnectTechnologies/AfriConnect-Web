import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getPresignedUploadUrl,
  generateImageKey,
  getPublicUrl,
  isValidImageType,
  isR2Configured,
  MAX_FILE_SIZE,
} from "@/lib/r2";

export async function POST(request: NextRequest) {
  try {
    // Check if R2 is configured
    if (!isR2Configured()) {
      return NextResponse.json(
        { 
          error: "Image upload is not configured. Please set up R2 environment variables.",
          code: "R2_NOT_CONFIGURED"
        },
        { status: 503 }
      );
    }

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { productId, filename, contentType, fileSize } = body;

    // Validate required fields
    if (!productId || !filename || !contentType) {
      return NextResponse.json(
        { error: "Missing required fields: productId, filename, contentType" },
        { status: 400 }
      );
    }

    // Validate content type
    if (!isValidImageType(contentType)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    // Validate file size
    if (fileSize && fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 }
      );
    }

    // Generate unique key for the image
    const key = generateImageKey(productId, filename);

    // Get presigned upload URL
    const uploadUrl = await getPresignedUploadUrl(key, contentType);

    // Get the public URL for after upload
    const publicUrl = getPublicUrl(key);

    return NextResponse.json({
      uploadUrl,
      key,
      publicUrl,
    });
  } catch (error) {
    console.error("Error generating upload URL:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    // Check for specific error types
    if (errorMessage.includes("Missing R2 configuration")) {
      return NextResponse.json(
        { 
          error: "Image upload is not configured. Please contact support.",
          code: "R2_NOT_CONFIGURED"
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
