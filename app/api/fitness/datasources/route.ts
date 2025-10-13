import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { google } from "googleapis";
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

    // Set up Google Fitness client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: decrypt(connection.accessToken),
      refresh_token: connection.refreshToken ? decrypt(connection.refreshToken) : undefined,
    });

    const fitness = google.fitness({ version: 'v1', auth: oauth2Client });

    console.log("\n=== DISCOVERING DATA SOURCES ===");

    // Get available data sources
    const dataSourcesResponse = await fitness.users.dataSources.list({
      userId: 'me'
    });

    const dataSources = dataSourcesResponse.data.dataSource || [];

    console.log(`Found ${dataSources.length} data sources:`);

    const stepSources = [];
    const heartRateSources = [];
    const distanceSources = [];
    const calorieSources = [];

    for (const source of dataSources) {
      console.log(`\n- Data Source: ${source.dataStreamId}`);
      console.log(`  Type: ${source.dataType?.name}`);
      console.log(`  App: ${source.application?.name}`);
      console.log(`  Device: ${source.device?.model || 'Unknown'}`);

      // Categorize data sources
      if (source.dataType?.name === 'com.google.step_count.delta') {
        stepSources.push({
          id: source.dataStreamId,
          app: source.application?.name,
          device: source.device?.model
        });
      } else if (source.dataType?.name === 'com.google.heart_rate.bpm') {
        heartRateSources.push({
          id: source.dataStreamId,
          app: source.application?.name,
          device: source.device?.model
        });
      } else if (source.dataType?.name === 'com.google.distance.delta') {
        distanceSources.push({
          id: source.dataStreamId,
          app: source.application?.name,
          device: source.device?.model
        });
      } else if (source.dataType?.name === 'com.google.calories.expended') {
        calorieSources.push({
          id: source.dataStreamId,
          app: source.application?.name,
          device: source.device?.model
        });
      }
    }

    console.log("\n=== CATEGORIZED SOURCES ===");
    console.log("Step Sources:", stepSources.length);
    console.log("Heart Rate Sources:", heartRateSources.length);
    console.log("Distance Sources:", distanceSources.length);
    console.log("Calorie Sources:", calorieSources.length);
    console.log("================================\n");

    return NextResponse.json({
      totalSources: dataSources.length,
      categorized: {
        steps: stepSources,
        heartRate: heartRateSources,
        distance: distanceSources,
        calories: calorieSources
      },
      allSources: dataSources.map(source => ({
        id: source.dataStreamId,
        type: source.dataType?.name,
        app: source.application?.name,
        device: source.device?.model
      }))
    });

  } catch (error) {
    console.error("Error fetching data sources:", error);
    return NextResponse.json({
      error: "Failed to fetch data sources",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}