import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import prisma from "@/prisma/prisma";
import { encrypt } from "@/utils/encryption";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log("Google Fitness callback started");

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // This contains the userId
    const error = searchParams.get("error");

    console.log("Callback params:", { code: !!code, state, error });

    if (error) {
      console.log("OAuth error:", error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/step-tracking?error=auth_denied`
      );
    }

    if (!code || !state) {
      console.log("Missing code or state");
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/step-tracking?error=invalid_callback`
      );
    }

    const userId = state;
    console.log("Processing for user:", userId);

    // Exchange authorization code for tokens
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google-fitness/callback`
    );

    console.log("Exchanging code for tokens...");
    const { tokens } = await oauth2Client.getToken(code);
    console.log("Tokens received:", {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiryDate: tokens.expiry_date
    });

    if (!tokens.access_token) {
      console.log("No access token received");
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/step-tracking?error=token_error`
      );
    }

    // Encrypt tokens before storing
    console.log("Encrypting tokens...");
    const encryptedAccessToken = encrypt(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;
    console.log("Tokens encrypted successfully");

    // Calculate token expiry
    const tokenExpiry = new Date();
    if (tokens.expiry_date) {
      tokenExpiry.setTime(tokens.expiry_date);
    } else {
      // Default to 1 hour if no expiry provided
      tokenExpiry.setHours(tokenExpiry.getHours() + 1);
    }

    // Store connection in database
    console.log("Storing connection in database...");
    await prisma.googleFitnessConnection.upsert({
      where: { userId },
      update: {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiry,
        isConnected: true,
        syncEnabled: true,
        lastSyncAt: null, // Reset last sync
        updatedAt: new Date(),
      },
      create: {
        userId,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiry,
        isConnected: true,
        syncEnabled: true,
      },
    });

    console.log(`Google Fitness connected successfully for user: ${userId}`);

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/step-tracking?connected=true`
    );
  } catch (error) {
    console.error("Detailed error in Google Fitness callback:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/step-tracking?error=callback_error&details=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`
    );
  }
}