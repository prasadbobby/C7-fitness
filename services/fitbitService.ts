import prisma from "@/prisma/prisma";
import crypto from "crypto";

// Encryption key for tokens (in production, use a proper key management system)
const ENCRYPTION_KEY = process.env.FITBIT_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

// Fitbit API configuration
const FITBIT_CLIENT_ID = process.env.FITBIT_CLIENT_ID || "23THTZ";
const FITBIT_CLIENT_SECRET = process.env.FITBIT_CLIENT_SECRET || "80bcdcee7589c0ba71d882af1f08e670";
const FITBIT_REDIRECT_URI = process.env.FITBIT_REDIRECT_URI || "http://localhost:3000/api/fitbit/callback";

interface FitbitTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user_id: string;
}

interface FitbitActivitySummary {
  summary: {
    steps: number;
    distances: Array<{
      activity: string;
      distance: number;
    }>;
    caloriesOut: number;
    activeCalories?: number;
  };
}

interface FitbitSleepData {
  summary: {
    totalMinutesAsleep: number;
    stages?: {
      deep: number;
      light: number;
      rem: number;
    };
  };
}

export class FitbitService {
  // Rate limiting properties (simplified)
  private lastApiCall: Date = new Date(0);
  private readonly rateLimitDelay: number = 1000; // 1 second between API calls
  private readonly maxRetries: number = 3;

  // Rate limiting helper
  private async enforceRateLimit(): Promise<void> {
    const timeSinceLastCall = Date.now() - this.lastApiCall.getTime();
    if (timeSinceLastCall < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastCall;
      console.log(`⏳ Rate limiting: waiting ${waitTime}ms before next API call`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    this.lastApiCall = new Date();
  }


  // Retry helper
  private async retryApiCall<T>(apiCall: () => Promise<T>, retries: number = this.maxRetries): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.enforceRateLimit();
        return await apiCall();
      } catch (error) {
        console.error(`❌ API call attempt ${attempt} failed:`, error instanceof Error ? error.message : error);

        if (attempt === retries) {
          throw error; // Final attempt failed
        }

        // Wait longer between retries for rate limiting issues
        const waitTime = attempt * 2000; // 2s, 4s, 6s...
        console.log(`⏳ Retrying in ${waitTime}ms... (attempt ${attempt + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    throw new Error('Max retries exceeded');
  }
  // Get encryption key as 32-byte buffer
  private getEncryptionKey(): Buffer {
    const keyString = ENCRYPTION_KEY as string;
    if (keyString.length >= 64) {
      // If it's a hex string, convert it
      return Buffer.from(keyString.substring(0, 64), 'hex');
    } else {
      // Pad or truncate to 32 bytes
      const key = Buffer.from(keyString, 'utf8');
      return Buffer.concat([key], 32);
    }
  }

  // Encrypt sensitive data
  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const key = this.getEncryptionKey();
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  // Decrypt sensitive data
  private decrypt(text: string): string {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = textParts.join(':');
    const key = this.getEncryptionKey();
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Get Fitbit authorization URL
  getAuthorizationUrl(): string {
    const scopes = 'activity sleep heartrate nutrition profile';
    return `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${FITBIT_CLIENT_ID}&redirect_uri=${encodeURIComponent(FITBIT_REDIRECT_URI)}&scope=${encodeURIComponent(scopes)}`;
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code: string): Promise<FitbitTokenResponse> {
    const tokenUrl = "https://api.fitbit.com/oauth2/token";
    const authHeader = Buffer.from(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`).toString('base64');

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: FITBIT_CLIENT_ID,
        grant_type: 'authorization_code',
        redirect_uri: FITBIT_REDIRECT_URI,
        code: code
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to exchange code for tokens: ${response.statusText}`);
    }

    return response.json();
  }

  // Refresh access token using refresh token
  async refreshAccessToken(refreshToken: string): Promise<FitbitTokenResponse> {
    const tokenUrl = "https://api.fitbit.com/oauth2/token";
    const authHeader = Buffer.from(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`).toString('base64');

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`);
    }

    return response.json();
  }

  // Store or update Fitbit connection in database
  async storeConnection(userId: string, tokenData: FitbitTokenResponse): Promise<void> {
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + tokenData.expires_in);

    await prisma.fitbitConnection.upsert({
      where: { userId },
      create: {
        userId,
        accessToken: this.encrypt(tokenData.access_token),
        refreshToken: this.encrypt(tokenData.refresh_token),
        tokenExpiry: expiryDate,
        fitbitUserId: tokenData.user_id,
        isConnected: true,
        syncEnabled: true,
      },
      update: {
        accessToken: this.encrypt(tokenData.access_token),
        refreshToken: this.encrypt(tokenData.refresh_token),
        tokenExpiry: expiryDate,
        fitbitUserId: tokenData.user_id,
        isConnected: true,
        lastSyncAt: new Date(),
      }
    });
  }

  // Get valid access token (refresh if needed)
  async getValidAccessToken(userId: string): Promise<string | null> {
    const connection = await prisma.fitbitConnection.findUnique({
      where: { userId }
    });

    if (!connection || !connection.isConnected) {
      return null;
    }

    // Check if token is still valid
    if (connection.tokenExpiry > new Date()) {
      return this.decrypt(connection.accessToken);
    }

    // Token expired, try to refresh
    try {
      const refreshToken = this.decrypt(connection.refreshToken);
      const tokenData = await this.refreshAccessToken(refreshToken);
      await this.storeConnection(userId, tokenData);
      return tokenData.access_token;
    } catch (error) {
      console.error('Failed to refresh Fitbit token:', error);
      // Mark connection as disconnected
      await prisma.fitbitConnection.update({
        where: { userId },
        data: { isConnected: false }
      });
      return null;
    }
  }

  // Fetch activity data - first check database, then Fitbit API if needed
  async fetchActivityData(userId: string, date: string): Promise<{ steps: number; distance: number; calories: number } | null> {
    // First, check if we have this data in the database
    // Use date range query to handle timezone differences in stored dates
    const dayStartDate = new Date(Date.UTC(new Date(date).getFullYear(), new Date(date).getMonth(), new Date(date).getDate(), 0, 0, 0, 0));
    const dayEndDate = new Date(Date.UTC(new Date(date).getFullYear(), new Date(date).getMonth(), new Date(date).getDate(), 23, 59, 59, 999));

    const existingData = await prisma.fitbitDailyData.findFirst({
      where: {
        userId,
        date: {
          gte: dayStartDate,
          lte: dayEndDate
        }
      }
    });

    if (existingData) {
      // Check if this is today's data and if it's stale (older than 30 minutes)
      const today = new Date();
      const isToday = existingData.date.toDateString() === today.toDateString();
      const dataAge = Date.now() - existingData.lastSyncedAt.getTime();
      const ageInMinutes = Math.floor(dataAge / (1000 * 60));

      if (isToday && ageInMinutes > 30) {
        console.log(`🔄 Today's data is ${ageInMinutes} minutes old, fetching fresh data...`);
        // Don't return cached data, fall through to API call for fresh data
      } else {
        console.log(`📋 Using database data for ${date}: ${existingData.steps} steps`);
        return {
          steps: existingData.steps,
          distance: existingData.distance,
          calories: existingData.calories
        };
      }
    }

    // If not in database, fetch from Fitbit API
    const accessToken = await this.getValidAccessToken(userId);
    if (!accessToken) {
      throw new Error('No valid Fitbit access token');
    }

    console.log(`🔍 Fetching new Fitbit data for ${date}...`);

    const result = await this.retryApiCall(async () => {
      const response = await fetch(`https://api.fitbit.com/1/user/-/activities/date/${date}.json`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.error(`❌ Rate limited by Fitbit API (${response.status})`);
          throw new Error(`Rate limited by Fitbit API`);
        }
        console.error(`❌ Fitbit API error: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to fetch activity data: ${response.statusText}`);
      }

      const data: FitbitActivitySummary = await response.json();
      console.log(`📊 Raw Fitbit response for ${date}:`, JSON.stringify(data, null, 2));

      const totalDistance = data.summary.distances?.find(d => d.activity === 'total')?.distance || 0;

      const processedResult = {
        steps: data.summary.steps || 0,
        distance: totalDistance * 1609.34, // Convert miles to meters
        calories: data.summary.caloriesOut || 0
      };

      console.log(`📈 Processed data for ${date}:`, processedResult);
      return processedResult;
    });

    // Store the new data in database using upsert to handle duplicates
    const connection = await prisma.fitbitConnection.findUnique({
      where: { userId }
    });

    if (connection) {
      await prisma.fitbitDailyData.upsert({
        where: {
          userId_date: {
            userId,
            date: dayStartDate
          }
        },
        create: {
          userId,
          fitbitConnectionId: connection.id,
          date: dayStartDate,
          steps: result.steps,
          distance: result.distance,
          calories: result.calories,
          rawActivityData: JSON.stringify(result)
        },
        update: {
          steps: result.steps,
          distance: result.distance,
          calories: result.calories,
          rawActivityData: JSON.stringify(result),
          lastSyncedAt: new Date()
        }
      });
      console.log(`💾 Stored/updated data in database for ${date}`);
    }

    return result;
  }

  // Fetch historical data from database (for calendar and reports)
  async getHistoricalData(userId: string, startDate: Date, endDate: Date): Promise<any[]> {
    const historicalData = await prisma.fitbitDailyData.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        date: 'asc'
      },
      select: {
        date: true,
        steps: true,
        distance: true,
        calories: true,
        lastSyncedAt: true
      }
    });

    // Convert to format expected by calendar component
    return historicalData.map(data => ({
      date: data.date.toISOString(),
      actualSteps: data.steps,
      targetSteps: 10000, // We'll get this from StepGoal if needed
      isCompleted: data.steps >= 10000,
      dataSource: 'FITBIT'
    }));
  }

  // Fetch sleep data from Fitbit (simplified - we can add database storage later if needed)
  async fetchSleepData(userId: string, date: string): Promise<{ totalMinutes: number; deep: number; light: number; rem: number } | null> {
    const accessToken = await this.getValidAccessToken(userId);
    if (!accessToken) {
      throw new Error('No valid Fitbit access token');
    }

    const result = await this.retryApiCall(async () => {
      const response = await fetch(`https://api.fitbit.com/1.2/user/-/sleep/date/${date}.json`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(`Rate limited by Fitbit API`);
        }
        throw new Error(`Failed to fetch sleep data: ${response.statusText}`);
      }

      const data: FitbitSleepData = await response.json();

      return {
        totalMinutes: data.summary?.totalMinutesAsleep || 0,
        deep: data.summary?.stages?.deep || 0,
        light: data.summary?.stages?.light || 0,
        rem: data.summary?.stages?.rem || 0
      };
    });

    return result;
  }

  // Sync steps data and store in database
  async syncStepsData(userId: string, startDate: Date, endDate: Date): Promise<void> {
    const connection = await prisma.fitbitConnection.findUnique({
      where: { userId }
    });

    if (!connection || !connection.isConnected) {
      throw new Error('No active Fitbit connection');
    }

    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      // Use local date string (YYYY-MM-DD) for consistent daily boundaries
      const dateStr = currentDate.toISOString().split('T')[0];

      // Create date object using UTC (same as dashboard expects)
      const dayStartDate = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0, 0));

      try {
        console.log(`\n🔄 Processing date: ${dateStr} (${dayStartDate.toISOString()})`);

        const activityData = await this.fetchActivityData(userId, dateStr);

        if (activityData) {
          console.log(`📊 Activity data received:`, activityData);

          // Get active step goal for this user
          const activeGoal = await prisma.stepGoal.findFirst({
            where: {
              userId,
              isActive: true
            }
          });

          console.log(`🎯 Active goal found:`, activeGoal);

          const targetSteps = activeGoal?.dailyTarget || 10000; // Default 10k if no goal set

          console.log(`💾 Saving to database - Date: ${dayStartDate.toISOString()}, Steps: ${activityData.steps}, Target: ${targetSteps}`);

          // Store or update step data - NO CARRY FORWARD
          const stepLog = await prisma.stepLog.upsert({
            where: {
              userId_date: {
                userId,
                date: dayStartDate
              }
            },
            create: {
              userId,
              date: dayStartDate,
              actualSteps: activityData.steps,
              targetSteps: targetSteps,
              carryOverSteps: 0, // No carry over
              excessSteps: 0, // No excess tracking
              dataSource: 'FITBIT',
              fitbitConnectionId: connection.id,
              isCompleted: activityData.steps >= targetSteps,
              stepGoalId: activeGoal?.id
            },
            update: {
              actualSteps: activityData.steps,
              targetSteps: targetSteps,
              carryOverSteps: 0, // Always reset carry over
              excessSteps: 0, // Always reset excess
              dataSource: 'FITBIT',
              fitbitConnectionId: connection.id,
              isCompleted: activityData.steps >= targetSteps,
              lastUpdated: new Date(),
              stepGoalId: activeGoal?.id
            }
          });

          // Also store distance data in the DistanceData table
          if (activityData.distance > 0) {
            const distanceData = await prisma.distanceData.upsert({
              where: {
                userId_date: {
                  userId,
                  date: dayStartDate
                }
              },
              create: {
                userId,
                date: dayStartDate,
                totalDistance: activityData.distance,
                dataSource: 'FITBIT'
              },
              update: {
                totalDistance: activityData.distance,
                dataSource: 'FITBIT'
              }
            });
            console.log(`📏 Distance data stored: ${(activityData.distance / 1000).toFixed(2)}km`);
          }

          console.log(`✅ Database operation completed:`, stepLog);
          console.log(`✅ Synced ${dateStr}: ${activityData.steps} steps (target: ${targetSteps}) - Completed: ${activityData.steps >= targetSteps}`);
        } else {
          console.log(`⚠️ No activity data received for ${dateStr}`);
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('Rate limited')) {
          console.warn(`⚠️ Rate limited for ${dateStr}, will retry later`);
          // Don't continue processing more dates if rate limited
          break;
        } else {
          console.error(`❌ Failed to sync data for ${dateStr}:`, error);
          if (error instanceof Error) {
            console.error(`❌ Error details:`, error.message);
          }
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Update last sync time
    await prisma.fitbitConnection.update({
      where: { userId },
      data: { lastSyncAt: new Date() }
    });
  }

  // Disconnect Fitbit
  async disconnectFitbit(userId: string): Promise<void> {
    await prisma.fitbitConnection.update({
      where: { userId },
      data: {
        isConnected: false,
        syncEnabled: false
      }
    });
  }

  // Get connection status with automatic token refresh
  async getConnectionStatus(userId: string) {
    const connection = await prisma.fitbitConnection.findUnique({
      where: { userId },
      select: {
        id: true,
        isConnected: true,
        lastSyncAt: true,
        syncEnabled: true,
        tokenExpiry: true,
        createdAt: true,
        updatedAt: true,
        accessToken: true,
        refreshToken: true
      }
    });

    if (!connection) {
      return {
        isConnected: false,
        canConnect: true,
        message: "No Fitbit connection found"
      };
    }

    // If connection is marked as disconnected, return false
    if (!connection.isConnected) {
      return {
        isConnected: false,
        canConnect: true,
        message: "Fitbit connection is disabled",
        lastSyncAt: connection.lastSyncAt,
        syncEnabled: connection.syncEnabled,
        tokenExpiry: connection.tokenExpiry,
        connectionCreated: connection.createdAt,
        lastUpdated: connection.updatedAt
      };
    }

    const isTokenExpired = connection.tokenExpiry <= new Date();

    // If token is expired, try to refresh it
    if (isTokenExpired) {
      try {
        console.log(`🔄 Token expired for user ${userId}, attempting refresh...`);
        const refreshToken = this.decrypt(connection.refreshToken);
        const tokenData = await this.refreshAccessToken(refreshToken);
        await this.storeConnection(userId, tokenData);

        console.log(`✅ Token refreshed successfully for user ${userId}`);

        // Get updated connection data
        const updatedConnection = await prisma.fitbitConnection.findUnique({
          where: { userId },
          select: {
            isConnected: true,
            lastSyncAt: true,
            syncEnabled: true,
            tokenExpiry: true,
            createdAt: true,
            updatedAt: true
          }
        });

        return {
          isConnected: updatedConnection?.isConnected || false,
          lastSyncAt: updatedConnection?.lastSyncAt,
          syncEnabled: updatedConnection?.syncEnabled,
          tokenExpiry: updatedConnection?.tokenExpiry,
          tokenValid: true,
          tokenRefreshed: true,
          connectionCreated: updatedConnection?.createdAt,
          lastUpdated: updatedConnection?.updatedAt
        };
      } catch (error) {
        console.error(`❌ Failed to refresh token for user ${userId}:`, error);

        // Mark connection as disconnected if refresh fails
        await prisma.fitbitConnection.update({
          where: { userId },
          data: { isConnected: false }
        });

        return {
          isConnected: false,
          canConnect: true,
          message: "Token refresh failed - reconnection required",
          lastSyncAt: connection.lastSyncAt,
          syncEnabled: connection.syncEnabled,
          tokenExpiry: connection.tokenExpiry,
          tokenValid: false,
          connectionCreated: connection.createdAt,
          lastUpdated: connection.updatedAt
        };
      }
    }

    // Token is still valid
    return {
      isConnected: true,
      lastSyncAt: connection.lastSyncAt,
      syncEnabled: connection.syncEnabled,
      tokenExpiry: connection.tokenExpiry,
      tokenValid: true,
      connectionCreated: connection.createdAt,
      lastUpdated: connection.updatedAt
    };
  }
}

export const fitbitService = new FitbitService();