import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { fitbitService } from "@/services/fitbitService";

export const dynamic = 'force-dynamic';

// GET - Handle Fitbit OAuth callback
export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.json(
        { error: `Fitbit authorization failed: ${error}` },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: "Missing authorization code" },
        { status: 400 }
      );
    }

    console.log(`\n=== FITBIT CALLBACK ===`);
    console.log(`User: ${userId}`);
    console.log(`Code received: ${code.substring(0, 10)}...`);

    // Exchange code for tokens
    const tokenData = await fitbitService.exchangeCodeForTokens(code);

    // Store connection in database
    await fitbitService.storeConnection(userId, tokenData);

    console.log(`Fitbit connection established for user: ${userId}`);

    // Redirect to a success page or back to the app
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/step-tracking?fitbit=connected`;

    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error("Error handling Fitbit callback:", error);

    // Redirect to error page
    const errorUrl = `${process.env.NEXT_PUBLIC_APP_URL}/step-tracking?fitbit=error`;
    return NextResponse.redirect(errorUrl);
  }
}