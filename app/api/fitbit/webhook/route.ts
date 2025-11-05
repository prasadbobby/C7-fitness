import { NextRequest, NextResponse } from 'next/server';
import { enhancedFitbitService } from '@/services/enhancedFitbitService';
import { fitbitService } from '@/services/fitbitService';
import prisma from '@/prisma/prisma';
import crypto from 'crypto';

/**
 * Fitbit Webhook Endpoint
 *
 * Receives real-time notifications when user's Fitbit data changes
 * This helps solve the device dependency issue by automatically fetching
 * fresh data when Fitbit servers detect updates
 */

export const dynamic = 'force-dynamic';

// Webhook verification for Fitbit (required for security)
const FITBIT_SUBSCRIBER_VERIFICATION_CODE = process.env.FITBIT_SUBSCRIBER_VERIFICATION_CODE || 'your-verification-code';

interface FitbitWebhookNotification {
  collectionType: 'activities' | 'sleep' | 'body';
  date: string;
  ownerId: string;
  ownerType: 'user';
  subscriptionId: string;
}

// GET request is used by Fitbit for webhook verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const verify = searchParams.get('verify');

  // Fitbit webhook verification
  if (verify === FITBIT_SUBSCRIBER_VERIFICATION_CODE) {
    console.log('✅ Fitbit webhook verification successful');
    return new NextResponse('', { status: 204 });
  }

  console.log('❌ Fitbit webhook verification failed');
  return new NextResponse('Forbidden', { status: 403 });
}

// POST request receives actual webhook notifications
export async function POST(request: NextRequest) {
  try {
    console.log('📡 Received Fitbit webhook notification');

    // Verify request signature (recommended for production)
    const signature = request.headers.get('x-fitbit-signature');
    const body = await request.text();

    if (!signature) {
      console.log('❌ Missing webhook signature');
      return new NextResponse('Missing signature', { status: 400 });
    }

    // Verify webhook signature using client secret
    const expectedSignature = crypto
      .createHmac('sha1', process.env.FITBIT_CLIENT_SECRET || '')
      .update(body, 'utf8')
      .digest('base64');

    if (signature !== expectedSignature) {
      console.log('❌ Invalid webhook signature');
      return new NextResponse('Invalid signature', { status: 401 });
    }

    // Parse webhook payload
    const notifications: FitbitWebhookNotification[] = JSON.parse(body);

    console.log(`📊 Processing ${notifications.length} webhook notifications`);

    // Process each notification
    for (const notification of notifications) {
      await processWebhookNotification(notification);
    }

    console.log('✅ All webhook notifications processed successfully');
    return new NextResponse('OK', { status: 200 });

  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

async function processWebhookNotification(notification: FitbitWebhookNotification) {
  try {
    console.log(`🔄 Processing notification:`, notification);

    // Find user by Fitbit ID
    const connection = await prisma.fitbitConnection.findFirst({
      where: {
        fitbitUserId: notification.ownerId,
        isConnected: true
      }
    });

    if (!connection) {
      console.log(`⚠️ No active connection found for Fitbit user ${notification.ownerId}`);
      return;
    }

    const userId = connection.userId;
    console.log(`👤 Found user ${userId} for Fitbit ID ${notification.ownerId}`);

    // Process based on notification type
    switch (notification.collectionType) {
      case 'activities':
        await handleActivityUpdate(userId, notification.date);
        break;

      case 'sleep':
        await handleSleepUpdate(userId, notification.date);
        break;

      case 'body':
        await handleBodyUpdate(userId, notification.date);
        break;

      default:
        console.log(`⚠️ Unknown collection type: ${notification.collectionType}`);
    }

  } catch (error) {
    console.error(`❌ Error processing notification for ${notification.ownerId}:`, error);
  }
}

async function handleActivityUpdate(userId: string, date: string) {
  try {
    console.log(`🏃 Handling activity update for user ${userId} on ${date}`);

    // Fetch fresh activity data using enhanced service
    const smartData = await enhancedFitbitService.fetchSmartStepData(userId, date);

    if (smartData) {
      console.log(`📈 Updated activity data: ${smartData.steps} steps (${smartData.confidence} confidence)`);

      // Update database with fresh data
      const dayStartDate = new Date(Date.UTC(new Date(date).getFullYear(), new Date(date).getMonth(), new Date(date).getDate(), 0, 0, 0, 0));

      // Get active step goal
      const activeGoal = await prisma.stepGoal.findFirst({
        where: { userId, isActive: true }
      });

      const targetSteps = activeGoal?.dailyTarget || 10000;

      // Update step log
      await prisma.stepLog.upsert({
        where: { userId_date: { userId, date: dayStartDate } },
        create: {
          userId,
          date: dayStartDate,
          actualSteps: smartData.steps,
          targetSteps,
          carryOverSteps: 0,
          excessSteps: 0,
          dataSource: 'FITBIT',
          fitbitConnectionId: connection.id,
          isCompleted: smartData.steps >= targetSteps,
          stepGoalId: activeGoal?.id
        },
        update: {
          actualSteps: smartData.steps,
          targetSteps,
          dataSource: 'FITBIT',
          isCompleted: smartData.steps >= targetSteps,
          lastUpdated: new Date()
        }
      });

      // Send real-time notification to user (optional)
      await notifyUserOfUpdate(userId, {
        type: 'steps',
        steps: smartData.steps,
        confidence: smartData.confidence,
        date
      });

      console.log(`✅ Activity data updated successfully for user ${userId}`);
    }

  } catch (error) {
    console.error(`❌ Failed to handle activity update:`, error);
  }
}

async function handleSleepUpdate(userId: string, date: string) {
  try {
    console.log(`😴 Handling sleep update for user ${userId} on ${date}`);

    // Fetch fresh sleep data
    const sleepData = await fitbitService.fetchSleepData(userId, date);

    if (sleepData) {
      console.log(`💤 Sleep data: ${sleepData.totalMinutes} minutes`);
      // Store in database if needed
      // For now, just log the update
    }

  } catch (error) {
    console.error(`❌ Failed to handle sleep update:`, error);
  }
}

async function handleBodyUpdate(userId: string, date: string) {
  try {
    console.log(`⚖️ Handling body measurement update for user ${userId} on ${date}`);
    // Handle weight, body fat, etc. updates
    // Implementation depends on your body measurement tracking needs

  } catch (error) {
    console.error(`❌ Failed to handle body update:`, error);
  }
}

async function notifyUserOfUpdate(userId: string, update: {
  type: string;
  steps?: number;
  confidence?: string;
  date: string;
}) {
  try {
    // You could implement real-time notifications here
    // Examples: WebSocket, Server-Sent Events, Push notifications

    console.log(`📱 Notifying user ${userId} of ${update.type} update:`, update);

    // For now, just log the notification
    // In production, you might:
    // - Send WebSocket message to connected clients
    // - Store notification in database for next page load
    // - Send push notification to mobile app
    // - Update cache/Redis for real-time display

  } catch (error) {
    console.error(`❌ Failed to notify user:`, error);
  }
}