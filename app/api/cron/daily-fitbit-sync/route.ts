import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { fitbitService } from "@/services/fitbitService";

export const dynamic = 'force-dynamic';

// Daily Fitbit sync cron job - runs at 11:55 PM every day
export async function POST(request: NextRequest) {
  try {
    console.log('\n=== DAILY FITBIT SYNC CRON JOB START ===');
    console.log(`Triggered at: ${new Date().toISOString()}`);

    // Verify cron authorization (optional security)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'fitbit-daily-sync-2025';

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.log('❌ Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get ALL Fitbit connections (both syncEnabled: true and false)
    // We want to store step data for all users, regardless of their sync preference
    const allConnections = await prisma.fitbitConnection.findMany({
      where: {
        isConnected: true
        // Removed syncEnabled: true - now syncs ALL connected users
      },
      select: {
        id: true,
        userId: true,
        lastSyncAt: true,
        syncEnabled: true // Still get this field for logging
      }
    });

    console.log(`📊 Found ${allConnections.length} connected Fitbit users to sync (including syncEnabled: false)`);

    if (allConnections.length === 0) {
      console.log('✅ No connected users found - sync complete');
      return NextResponse.json({
        success: true,
        message: 'No connected users to sync',
        synced: 0
      });
    }

    const syncResults = {
      total: allConnections.length,
      successful: 0,
      failed: 0,
      syncEnabledUsers: 0,
      syncDisabledUsers: 0,
      errors: [] as string[]
    };

    // Get today's date for syncing
    const today = new Date();
    const todayStart = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0));
    const todayEnd = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999));

    console.log(`🗓️  Syncing data for: ${todayStart.toISOString().split('T')[0]}`);

    // Sync each user's data with rate limiting
    for (let i = 0; i < allConnections.length; i++) {
      const connection = allConnections[i];

      try {
        console.log(`\n🔄 Syncing user ${i + 1}/${allConnections.length}: ${connection.userId}`);
        console.log(`   syncEnabled: ${connection.syncEnabled ? 'true' : 'false'} (syncing anyway for data completeness)`);

        // Track user type for reporting
        if (connection.syncEnabled) {
          syncResults.syncEnabledUsers++;
        } else {
          syncResults.syncDisabledUsers++;
        }

        // Check if today's data already exists
        const existingData = await prisma.fitbitDailyData.findFirst({
          where: {
            userId: connection.userId,
            date: {
              gte: todayStart,
              lte: todayEnd
            }
          }
        });

        if (existingData) {
          // Data exists, but check if it's from early in the day (might be stale)
          const dataAge = Date.now() - existingData.lastSyncedAt.getTime();
          const ageInHours = Math.floor(dataAge / (1000 * 60 * 60));

          if (ageInHours < 6) {
            console.log(`   ⏭️  Skipping - recent data exists (${ageInHours}h old)`);
            syncResults.successful++;
            continue;
          } else {
            console.log(`   🔄 Refreshing stale data (${ageInHours}h old)`);
          }
        } else {
          console.log(`   📅 No existing data for today - fetching from Fitbit`);
        }

        // Perform the sync for ALL users (regardless of syncEnabled setting)
        await fitbitService.syncStepsData(connection.userId, todayStart, todayEnd);

        console.log(`   ✅ Successfully synced user: ${connection.userId}`);
        syncResults.successful++;

        // Rate limiting: Wait 2 seconds between users to avoid hitting Fitbit API limits
        if (i < allConnections.length - 1) {
          console.log(`   ⏳ Rate limiting delay (2s)...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (error) {
        const errorMessage = `User ${connection.userId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.log(`   ❌ Failed to sync user ${connection.userId}:`, error);

        syncResults.failed++;
        syncResults.errors.push(errorMessage);

        // Don't let one user's failure stop the entire process
        continue;
      }
    }

    // Log final results
    console.log(`\n📈 Daily sync complete:`);
    console.log(`   Total users: ${syncResults.total}`);
    console.log(`   - syncEnabled: true: ${syncResults.syncEnabledUsers}`);
    console.log(`   - syncEnabled: false: ${syncResults.syncDisabledUsers}`);
    console.log(`   Successful: ${syncResults.successful}`);
    console.log(`   Failed: ${syncResults.failed}`);
    console.log(`   Success rate: ${((syncResults.successful / syncResults.total) * 100).toFixed(1)}%`);

    if (syncResults.errors.length > 0) {
      console.log(`\n❌ Errors encountered:`);
      syncResults.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    console.log('=== DAILY FITBIT SYNC CRON JOB END ===\n');

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: syncResults
    });

  } catch (error) {
    console.error('❌ Fatal error in daily sync cron job:', error);

    return NextResponse.json({
      success: false,
      error: 'Daily sync failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Optional: Allow GET for manual testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Daily Fitbit Sync Cron Job',
    description: 'POST to this endpoint to trigger daily sync for all users',
    usage: 'curl -X POST /api/cron/daily-fitbit-sync -H "Authorization: Bearer <CRON_SECRET>"',
    note: 'This endpoint should be called by external cron service at 11:59 PM daily'
  });
}