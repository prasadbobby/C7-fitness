import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { googleFitnessService } from "@/services/googleFitnessService";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    console.log(`\n=== GOOGLE FITNESS DEBUG for ${userId} ===`);
    console.log(`Fetching data from ${yesterday.toDateString()} to ${today.toDateString()}`);

    try {
      // Test each data type individually
      console.log("\n--- Testing Steps Data ---");
      const stepsData = await googleFitnessService.fetchStepsData(userId, yesterday, today);
      console.log("Steps data:", JSON.stringify(stepsData, null, 2));

      console.log("\n--- Testing Heart Rate Data ---");
      const heartRateData = await googleFitnessService.fetchHeartRateData(userId, yesterday, today);
      console.log("Heart rate data:", JSON.stringify(heartRateData, null, 2));

      console.log("\n--- Testing Calories Data ---");
      const caloriesData = await googleFitnessService.fetchCaloriesData(userId, yesterday, today);
      console.log("Calories data:", JSON.stringify(caloriesData, null, 2));

      console.log("\n--- Testing Distance Data ---");
      const distanceData = await googleFitnessService.fetchDistanceData(userId, yesterday, today);
      console.log("Distance data:", JSON.stringify(distanceData, null, 2));

      const debugInfo = {
        userId,
        dateRange: {
          from: yesterday.toISOString(),
          to: today.toISOString()
        },
        results: {
          steps: {
            count: stepsData.length,
            data: stepsData
          },
          heartRate: {
            count: heartRateData.length,
            data: heartRateData
          },
          calories: {
            count: caloriesData.length,
            data: caloriesData
          },
          distance: {
            count: distanceData.length,
            data: distanceData
          }
        }
      };

      console.log("\n=== DEBUG SUMMARY ===");
      console.log(`Steps records: ${stepsData.length}`);
      console.log(`Heart rate records: ${heartRateData.length}`);
      console.log(`Calories records: ${caloriesData.length}`);
      console.log(`Distance records: ${distanceData.length}`);
      console.log("========================\n");

      return NextResponse.json(debugInfo);

    } catch (error) {
      console.error("Error during debug fetch:", error);
      return NextResponse.json({
        error: "Debug fetch failed",
        details: error instanceof Error ? error.message : 'Unknown error',
        userId
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Error in debug endpoint:", error);
    return NextResponse.json({
      error: "Debug endpoint failed"
    }, { status: 500 });
  }
}