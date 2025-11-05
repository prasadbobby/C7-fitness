import { fitbitService } from "./fitbitService";
import prisma from "@/prisma/prisma";

/**
 * Enhanced Fitbit Service with multiple sync strategies to address device dependency
 *
 * Problem: Fitbit only updates server data when user opens mobile app or device syncs
 * Solutions:
 * 1. Intraday API for minute-level data
 * 2. Webhook subscriptions for real-time updates
 * 3. Smart polling with user behavior patterns
 * 4. Multiple data sources and fallbacks
 */

interface IntradayResponse {
  'activities-steps-intraday': {
    dataset: Array<{
      time: string;
      value: number;
    }>;
    datasetInterval: number;
    datasetType: string;
  };
  'activities-steps': Array<{
    dateTime: string;
    value: string;
  }>;
}

interface UserSyncPattern {
  userId: string;
  avgSyncTime: number; // Average hour of day when user typically syncs
  lastDeviceSync: Date;
  syncFrequency: number; // Hours between typical syncs
  isActiveUser: boolean;
}

export class EnhancedFitbitService {
  private baseService = fitbitService;

  /**
   * Strategy 1: Use Intraday API for more real-time step data
   * Intraday API provides minute-by-minute data that updates more frequently
   */
  async fetchIntradaySteps(userId: string, date: string): Promise<{ steps: number; lastUpdateTime: Date } | null> {
    const accessToken = await this.baseService.getValidAccessToken(userId);
    if (!accessToken) {
      throw new Error('No valid Fitbit access token');
    }

    try {
      // Fetch intraday steps (minute-level data)
      const response = await fetch(
        `https://api.fitbit.com/1/user/-/activities/steps/date/${date}/1d/1min.json`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limited by Fitbit API');
        }
        throw new Error(`Failed to fetch intraday data: ${response.statusText}`);
      }

      const data: IntradayResponse = await response.json();

      // Sum up all minute-level step data for total steps
      const totalSteps = data['activities-steps-intraday'].dataset.reduce(
        (sum, entry) => sum + entry.value, 0
      );

      // Get the last data point time to know when data was last updated
      const lastDataPoint = data['activities-steps-intraday'].dataset.slice(-1)[0];
      const lastUpdateTime = lastDataPoint
        ? new Date(`${date}T${lastDataPoint.time}`)
        : new Date();

      console.log(`📊 Intraday data: ${totalSteps} steps, last update: ${lastUpdateTime.toISOString()}`);

      return {
        steps: totalSteps,
        lastUpdateTime
      };

    } catch (error) {
      console.error('❌ Failed to fetch intraday data:', error);
      // Fallback to regular daily API
      return null;
    }
  }

  /**
   * Strategy 2: Smart sync with multiple data sources
   * Try intraday first, fallback to daily API, then to cached data
   */
  async fetchSmartStepData(userId: string, date: string): Promise<{
    steps: number;
    confidence: 'high' | 'medium' | 'low';
    source: 'intraday' | 'daily-api' | 'cached';
    lastSync: Date;
  } | null> {

    // Try intraday API first (most accurate)
    try {
      const intradayData = await this.fetchIntradaySteps(userId, date);
      if (intradayData) {
        return {
          steps: intradayData.steps,
          confidence: 'high',
          source: 'intraday',
          lastSync: intradayData.lastUpdateTime
        };
      }
    } catch (error) {
      console.log('📱 Intraday API not available, trying daily API...');
    }

    // Fallback to regular daily API
    try {
      const dailyData = await this.baseService.fetchActivityData(userId, date);
      if (dailyData) {
        return {
          steps: dailyData.steps,
          confidence: 'medium',
          source: 'daily-api',
          lastSync: new Date()
        };
      }
    } catch (error) {
      console.log('📊 Daily API failed, checking cached data...');
    }

    // Final fallback to cached data
    const cachedData = await this.getCachedStepData(userId, date);
    if (cachedData) {
      return {
        steps: cachedData.steps,
        confidence: 'low',
        source: 'cached',
        lastSync: cachedData.lastSyncedAt
      };
    }

    return null;
  }

  /**
   * Strategy 3: Webhook subscription for real-time updates
   * Register webhook to get notified when Fitbit data changes
   */
  async setupWebhookSubscription(userId: string): Promise<boolean> {
    const accessToken = await this.baseService.getValidAccessToken(userId);
    if (!accessToken) {
      return false;
    }

    try {
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/fitbit/webhook`;

      const response = await fetch('https://api.fitbit.com/1/user/-/activities/apiSubscriptions.json', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          collectionType: 'activities',
          callbackURL: webhookUrl
        })
      });

      if (response.ok) {
        console.log(`✅ Webhook subscription created for user ${userId}`);
        return true;
      } else {
        console.error(`❌ Failed to create webhook subscription: ${response.statusText}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Error setting up webhook:', error);
      return false;
    }
  }

  /**
   * Strategy 4: User sync pattern analysis
   * Learn when users typically sync their devices and proactively fetch data
   */
  async analyzeUserSyncPattern(userId: string): Promise<UserSyncPattern> {
    // Get user's historical sync times from database
    const recentSyncs = await prisma.fitbitDailyData.findMany({
      where: { userId },
      orderBy: { lastSyncedAt: 'desc' },
      take: 30, // Last 30 syncs
      select: {
        lastSyncedAt: true,
        date: true
      }
    });

    if (recentSyncs.length === 0) {
      return {
        userId,
        avgSyncTime: 9, // Default to 9 AM
        lastDeviceSync: new Date(),
        syncFrequency: 24, // Default to once daily
        isActiveUser: false
      };
    }

    // Calculate average sync time (hour of day)
    const syncHours = recentSyncs.map(sync => sync.lastSyncedAt.getHours());
    const avgSyncTime = syncHours.reduce((sum, hour) => sum + hour, 0) / syncHours.length;

    // Calculate sync frequency
    const syncIntervals = [];
    for (let i = 0; i < recentSyncs.length - 1; i++) {
      const interval = (recentSyncs[i].lastSyncedAt.getTime() - recentSyncs[i + 1].lastSyncedAt.getTime()) / (1000 * 60 * 60);
      syncIntervals.push(interval);
    }
    const avgSyncFrequency = syncIntervals.length > 0
      ? syncIntervals.reduce((sum, interval) => sum + interval, 0) / syncIntervals.length
      : 24;

    // Determine if user is active (synced in last 48 hours)
    const lastSync = recentSyncs[0].lastSyncedAt;
    const isActiveUser = (Date.now() - lastSync.getTime()) < (48 * 60 * 60 * 1000);

    return {
      userId,
      avgSyncTime: Math.round(avgSyncTime),
      lastDeviceSync: lastSync,
      syncFrequency: Math.round(avgSyncFrequency),
      isActiveUser
    };
  }

  /**
   * Strategy 5: Proactive sync scheduling
   * Schedule syncs based on user patterns and device activity
   */
  async scheduleProactiveSync(userId: string): Promise<void> {
    const pattern = await this.analyzeUserSyncPattern(userId);

    // If user typically syncs around this time, try fetching fresh data
    const currentHour = new Date().getHours();
    const hoursSinceLastSync = (Date.now() - pattern.lastDeviceSync.getTime()) / (1000 * 60 * 60);

    const shouldSync = (
      // User typically syncs around this time (±2 hours)
      Math.abs(currentHour - pattern.avgSyncTime) <= 2 ||
      // It's been longer than their typical sync frequency
      hoursSinceLastSync >= pattern.syncFrequency ||
      // User is active and it's been more than 4 hours
      (pattern.isActiveUser && hoursSinceLastSync >= 4)
    );

    if (shouldSync) {
      console.log(`🔄 Proactive sync triggered for user ${userId} based on pattern analysis`);
      try {
        const today = new Date().toISOString().split('T')[0];
        await this.fetchSmartStepData(userId, today);
      } catch (error) {
        console.error(`❌ Proactive sync failed for user ${userId}:`, error);
      }
    }
  }

  /**
   * Strategy 6: Multi-source data validation
   * Compare data from multiple sources to detect stale data
   */
  async validateStepDataFreshness(userId: string, date: string): Promise<{
    isFresh: boolean;
    recommendation: string;
    sources: Array<{ source: string; steps: number; timestamp: Date; confidence: number }>;
  }> {
    const sources = [];

    // Try intraday API
    try {
      const intradayData = await this.fetchIntradaySteps(userId, date);
      if (intradayData) {
        sources.push({
          source: 'intraday',
          steps: intradayData.steps,
          timestamp: intradayData.lastUpdateTime,
          confidence: 0.9
        });
      }
    } catch (error) {
      // Ignore errors, just skip this source
    }

    // Try daily API
    try {
      const dailyData = await this.baseService.fetchActivityData(userId, date);
      if (dailyData) {
        sources.push({
          source: 'daily-api',
          steps: dailyData.steps,
          timestamp: new Date(),
          confidence: 0.7
        });
      }
    } catch (error) {
      // Ignore errors, just skip this source
    }

    // Get cached data
    const cachedData = await this.getCachedStepData(userId, date);
    if (cachedData) {
      sources.push({
        source: 'cached',
        steps: cachedData.steps,
        timestamp: cachedData.lastSyncedAt,
        confidence: 0.3
      });
    }

    // Analyze data freshness
    const now = new Date();
    const freshThreshold = 30 * 60 * 1000; // 30 minutes

    const freshSources = sources.filter(s => (now.getTime() - s.timestamp.getTime()) < freshThreshold);
    const isFresh = freshSources.length > 0;

    // Generate recommendations
    let recommendation = '';
    if (!isFresh) {
      recommendation = 'Please open your Fitbit app to sync the latest step data.';
    } else if (sources.length > 1) {
      const stepVariance = Math.max(...sources.map(s => s.steps)) - Math.min(...sources.map(s => s.steps));
      if (stepVariance > 1000) {
        recommendation = 'Step data varies significantly between sources. Consider manual sync.';
      } else {
        recommendation = 'Step data appears fresh and consistent.';
      }
    } else {
      recommendation = 'Step data appears current.';
    }

    return {
      isFresh,
      recommendation,
      sources
    };
  }

  /**
   * Helper: Get cached step data
   */
  private async getCachedStepData(userId: string, date: string): Promise<{
    steps: number;
    lastSyncedAt: Date;
  } | null> {
    const dayStartDate = new Date(Date.UTC(new Date(date).getFullYear(), new Date(date).getMonth(), new Date(date).getDate(), 0, 0, 0, 0));

    const cached = await prisma.fitbitDailyData.findFirst({
      where: {
        userId,
        date: dayStartDate
      },
      select: {
        steps: true,
        lastSyncedAt: true
      }
    });

    return cached ? {
      steps: cached.steps,
      lastSyncedAt: cached.lastSyncedAt
    } : null;
  }

  /**
   * User-friendly sync status with actionable recommendations
   */
  async getSyncStatusWithRecommendations(userId: string): Promise<{
    status: 'fresh' | 'stale' | 'very_stale' | 'unknown';
    lastSync: Date | null;
    recommendation: string;
    canImprove: boolean;
    improvementTips: string[];
  }> {
    const today = new Date().toISOString().split('T')[0];
    const validation = await this.validateStepDataFreshness(userId, today);
    const pattern = await this.analyzeUserSyncPattern(userId);

    const now = new Date();
    const hoursSinceSync = pattern.lastDeviceSync
      ? (now.getTime() - pattern.lastDeviceSync.getTime()) / (1000 * 60 * 60)
      : 999;

    let status: 'fresh' | 'stale' | 'very_stale' | 'unknown';
    let recommendation: string;
    let improvementTips: string[] = [];

    if (hoursSinceSync < 1) {
      status = 'fresh';
      recommendation = 'Your step data is current! 🎉';
    } else if (hoursSinceSync < 6) {
      status = 'stale';
      recommendation = 'Step data is a few hours old. Consider syncing for latest count.';
      improvementTips.push('Open your Fitbit app to sync latest data');
    } else if (hoursSinceSync < 24) {
      status = 'very_stale';
      recommendation = 'Step data is quite old. Please sync your Fitbit device.';
      improvementTips.push('Open Fitbit app and pull down to refresh');
      improvementTips.push('Ensure your Fitbit device is nearby');
    } else {
      status = 'unknown';
      recommendation = 'Step data is very outdated. Manual sync required.';
      improvementTips.push('Open Fitbit app and force sync');
      improvementTips.push('Check Bluetooth connection to your device');
      improvementTips.push('Restart Fitbit app if needed');
    }

    // Add general tips for better sync reliability
    if (!pattern.isActiveUser) {
      improvementTips.push('Sync daily for best accuracy');
      improvementTips.push('Enable all-day sync in Fitbit app settings');
    }

    return {
      status,
      lastSync: pattern.lastDeviceSync,
      recommendation,
      canImprove: improvementTips.length > 0,
      improvementTips
    };
  }
}

export const enhancedFitbitService = new EnhancedFitbitService();