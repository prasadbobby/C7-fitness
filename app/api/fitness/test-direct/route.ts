import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/prisma/prisma";
import { decrypt } from "@/utils/encryption";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Google Fitness connection
    const connection = await prisma.googleFitnessConnection.findUnique({
      where: { userId, isConnected: true }
    });

    if (!connection) {
      return NextResponse.json({
        error: "Google Fitness not connected"
      }, { status: 400 });
    }

    console.log("\n=== DIRECT API TEST (like HTML) ===");

    // Get access token
    const accessToken = decrypt(connection.accessToken);
    console.log("Access token available:", !!accessToken);
    console.log("Token expires at:", connection.tokenExpiry);

    // Use exact same approach as working HTML test
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    console.log("Time range:");
    console.log("- Start:", new Date(oneDayAgo).toISOString());
    console.log("- End:", new Date(now).toISOString());
    console.log("- Start millis:", oneDayAgo);
    console.log("- End millis:", now);

    const requestBody = {
      aggregateBy: [{
        dataTypeName: "com.google.step_count.delta"
      }],
      bucketByTime: {
        durationMillis: 86400000 // 24 hours
      },
      startTimeMillis: oneDayAgo.toString(),
      endTimeMillis: now.toString()
    };

    console.log("Request body:", JSON.stringify(requestBody, null, 2));

    // Make direct fetch request (like HTML test)
    const response = await fetch(
      "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody)
      }
    );

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", errorText);
      return NextResponse.json({
        error: "Google Fitness API error",
        status: response.status,
        details: errorText
      }, { status: response.status });
    }

    const data = await response.json();
    console.log("Raw response data:", JSON.stringify(data, null, 2));

    // Process data exactly like HTML test
    let totalSteps = 0;
    if (data.bucket && data.bucket.length > 0) {
      data.bucket.forEach((bucket: any) => {
        if (bucket.dataset) {
          bucket.dataset.forEach((dataset: any) => {
            if (dataset.point) {
              dataset.point.forEach((point: any) => {
                if (point.value && point.value[0]) {
                  const stepValue = point.value[0].intVal || point.value[0];
                  totalSteps += stepValue;
                  console.log("Found step value:", stepValue);
                }
              });
            }
          });
        }
      });
    }

    console.log("Total steps calculated:", totalSteps);
    console.log("=====================================\n");

    return NextResponse.json({
      success: true,
      totalSteps,
      rawData: data,
      debugInfo: {
        timeRange: {
          start: new Date(oneDayAgo).toISOString(),
          end: new Date(now).toISOString(),
          startMillis: oneDayAgo,
          endMillis: now
        },
        bucketsFound: data.bucket?.length || 0,
        hasData: totalSteps > 0
      }
    });

  } catch (error) {
    console.error("Error in direct API test:", error);
    return NextResponse.json({
      error: "Test failed",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}