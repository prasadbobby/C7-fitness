import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs";

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    // Validate file size (max 5MB as requested)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 });
    }

    // Convert file to base64 for database storage (production-friendly)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64String = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64String}`;

    console.log('File uploaded successfully:', {
      userId: user.id,
      fileType: file.type,
      fileSize: file.size,
      base64Length: base64String.length
    });

    return NextResponse.json({
      success: true,
      url: dataUrl,
      filename: file.name,
      fileType: file.type,
      fileSize: file.size
    });

  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({
      error: "Internal server error",
      details: error.message
    }, { status: 500 });
  }
}