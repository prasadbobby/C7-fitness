import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { enhancedFitbitService } from '@/services/enhancedFitbitService';

export const dynamic = 'force-dynamic';

/**
 * Enhanced Fitbit Sync API
 *
 * Provides improved step data accuracy using multiple strategies:
 * 1. Intraday API for minute-level data
 * 2. Smart data validation from multiple sources
 * 3. User sync pattern analysis
 * 4. Proactive sync recommendations
 */

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const action = searchParams.get('action') || 'smart-sync';

    console.log(`🔄 Enhanced sync request: ${action} for user ${userId} on ${date}`);

    switch (action) {
      case 'smart-sync':
        return await handleSmartSync(userId, date);

      case 'validate':
        return await handleDataValidation(userId, date);

      case 'status':
        return await handleSyncStatus(userId);

      case 'pattern':
        return await handleSyncPattern(userId);

      case 'proactive':
        return await handleProactiveSync(userId);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Enhanced sync error:', error);
    return NextResponse.json(
      { error: 'Failed to process sync request' },
      { status: 500 }
    );
  }
}

async function handleSmartSync(userId: string, date: string) {
  try {
    console.log(`🧠 Performing smart sync for ${userId} on ${date}`);

    const result = await enhancedFitbitService.fetchSmartStepData(userId, date);

    if (!result) {
      return NextResponse.json({
        success: false,
        message: 'No step data available from any source'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        steps: result.steps,
        confidence: result.confidence,
        source: result.source,
        lastSync: result.lastSync,
        message: getConfidenceMessage(result.confidence, result.source)
      }
    });

  } catch (error) {
    console.error('❌ Smart sync failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Smart sync failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function handleDataValidation(userId: string, date: string) {
  try {
    console.log(`🔍 Validating data freshness for ${userId} on ${date}`);

    const validation = await enhancedFitbitService.validateStepDataFreshness(userId, date);

    return NextResponse.json({
      success: true,
      validation: {
        isFresh: validation.isFresh,
        recommendation: validation.recommendation,
        sources: validation.sources.map(source => ({
          source: source.source,
          steps: source.steps,
          timestamp: source.timestamp,
          confidence: source.confidence,
          ageMinutes: Math.round((Date.now() - source.timestamp.getTime()) / (1000 * 60))
        }))
      }
    });

  } catch (error) {
    console.error('❌ Data validation failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Data validation failed'
    }, { status: 500 });
  }
}

async function handleSyncStatus(userId: string) {
  try {
    console.log(`📊 Getting sync status for ${userId}`);

    const status = await enhancedFitbitService.getSyncStatusWithRecommendations(userId);

    return NextResponse.json({
      success: true,
      status: {
        status: status.status,
        lastSync: status.lastSync,
        recommendation: status.recommendation,
        canImprove: status.canImprove,
        improvementTips: status.improvementTips,
        statusIcon: getStatusIcon(status.status),
        statusColor: getStatusColor(status.status)
      }
    });

  } catch (error) {
    console.error('❌ Failed to get sync status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get sync status'
    }, { status: 500 });
  }
}

async function handleSyncPattern(userId: string) {
  try {
    console.log(`📈 Analyzing sync pattern for ${userId}`);

    const pattern = await enhancedFitbitService.analyzeUserSyncPattern(userId);

    return NextResponse.json({
      success: true,
      pattern: {
        avgSyncTime: pattern.avgSyncTime,
        syncFrequency: pattern.syncFrequency,
        isActiveUser: pattern.isActiveUser,
        lastDeviceSync: pattern.lastDeviceSync,
        recommendations: getSyncPatternRecommendations(pattern)
      }
    });

  } catch (error) {
    console.error('❌ Failed to analyze sync pattern:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze sync pattern'
    }, { status: 500 });
  }
}

async function handleProactiveSync(userId: string) {
  try {
    console.log(`🎯 Running proactive sync for ${userId}`);

    await enhancedFitbitService.scheduleProactiveSync(userId);

    return NextResponse.json({
      success: true,
      message: 'Proactive sync completed'
    });

  } catch (error) {
    console.error('❌ Proactive sync failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Proactive sync failed'
    }, { status: 500 });
  }
}

// Helper functions for user-friendly messages

function getConfidenceMessage(confidence: string, source: string): string {
  switch (confidence) {
    case 'high':
      return 'Real-time data from Fitbit intraday API ✨';
    case 'medium':
      return 'Recent data from Fitbit daily summary 📊';
    case 'low':
      return 'Showing cached data - consider syncing your Fitbit app 📱';
    default:
      return 'Step data retrieved successfully';
  }
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'fresh': return '🟢';
    case 'stale': return '🟡';
    case 'very_stale': return '🟠';
    case 'unknown': return '🔴';
    default: return '❓';
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'fresh': return 'success';
    case 'stale': return 'warning';
    case 'very_stale': return 'danger';
    case 'unknown': return 'danger';
    default: return 'default';
  }
}

function getSyncPatternRecommendations(pattern: any): string[] {
  const recommendations = [];

  if (!pattern.isActiveUser) {
    recommendations.push('Try to sync your Fitbit daily for best accuracy');
  }

  if (pattern.syncFrequency > 24) {
    recommendations.push('Consider syncing more frequently (every 12-24 hours)');
  }

  if (pattern.avgSyncTime < 7 || pattern.avgSyncTime > 22) {
    recommendations.push('Syncing during daytime hours (7 AM - 10 PM) ensures better data capture');
  }

  recommendations.push('Enable "All-Day Sync" in your Fitbit app settings');
  recommendations.push('Keep Bluetooth enabled and Fitbit app running in background');

  return recommendations;
}