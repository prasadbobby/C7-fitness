import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { fitbitService } from "@/services/fitbitService";

export const dynamic = 'force-dynamic';

// GET - Initiate Fitbit OAuth flow
export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authUrl = fitbitService.getAuthorizationUrl();

    return NextResponse.json({
      success: true,
      authUrl,
      message: "Redirect user to this URL to authorize Fitbit access"
    });

  } catch (error) {
    console.error("Error initiating Fitbit auth:", error);
    return NextResponse.json(
      {
        error: "Failed to initiate Fitbit authorization",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}