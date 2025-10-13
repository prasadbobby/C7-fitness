import { google } from 'googleapis';
import prisma from '@/prisma/prisma';
import { decrypt } from '@/utils/encryption';

export interface FitnessDataPoint {
  dataType: string;
  startTimeNanos: string;
  endTimeNanos: string;
  value: number[];
  originDataSourceId?: string;
}

export interface GoogleFitnessDataResponse {
  bucket?: {
    startTimeMillis: string;
    endTimeMillis: string;
    dataset: {
      dataSourceId: string;
      point: FitnessDataPoint[];
    }[];
  }[];
  point?: FitnessDataPoint[];
}

export class GoogleFitnessService {
  private async getAuthenticatedClient(userId: string) {
    const connection = await prisma.googleFitnessConnection.findUnique({
      where: { userId, isConnected: true }
    });

    if (!connection) {
      throw new Error('No Google Fitness connection found for user');
    }

    // Check if token is expired
    if (connection.tokenExpiry < new Date()) {
      // Try to refresh the token
      if (!connection.refreshToken) {
        throw new Error('Token expired and no refresh token available');
      }

      await this.refreshAccessToken(userId, connection.refreshToken);
      // Get updated connection
      const updatedConnection = await prisma.googleFitnessConnection.findUnique({
        where: { userId }
      });
      if (!updatedConnection) {
        throw new Error('Failed to refresh token');
      }
      connection.accessToken = updatedConnection.accessToken;
      connection.tokenExpiry = updatedConnection.tokenExpiry;
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: decrypt(connection.accessToken),
      refresh_token: connection.refreshToken ? decrypt(connection.refreshToken) : undefined,
    });

    return oauth2Client;
  }

  private async refreshAccessToken(userId: string, encryptedRefreshToken: string) {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      oauth2Client.setCredentials({
        refresh_token: decrypt(encryptedRefreshToken)
      });

      const { credentials } = await oauth2Client.refreshAccessToken();

      if (credentials.access_token) {
        const { encrypt } = await import('@/utils/encryption');
        const tokenExpiry = new Date();
        if (credentials.expiry_date) {
          tokenExpiry.setTime(credentials.expiry_date);
        } else {
          tokenExpiry.setHours(tokenExpiry.getHours() + 1);
        }

        await prisma.googleFitnessConnection.update({
          where: { userId },
          data: {
            accessToken: encrypt(credentials.access_token),
            tokenExpiry,
            updatedAt: new Date()
          }
        });
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      // Mark connection as disconnected if refresh fails
      await prisma.googleFitnessConnection.update({
        where: { userId },
        data: { isConnected: false }
      });
      throw new Error('Failed to refresh access token');
    }
  }

  async fetchStepsData(userId: string, startDate: Date, endDate: Date): Promise<any[]> {
    try {
      // Use the working direct fetch approach (same as successful HTML test)
      const directData = await this.fetchStepsDataDirect(userId, startDate, endDate);
      if (directData.length > 0) {
        console.log(`Direct fetch SUCCESS: Found ${directData.length} records`);
        return directData;
      }

      // Fallback to original approach if direct fetch fails
      return this.fetchStepsDataOriginal(userId, startDate, endDate);

    } catch (error) {
      console.error('Error in fetchStepsData:', error);
      throw error;
    }
  }

  // New working direct fetch method (same approach as successful HTML test)
  // Fetches steps from 12AM of the given day to the current time (or end of day)
  async fetchStepsDataDirect(userId: string, startDate: Date, endDate: Date): Promise<any[]> {
    try {
      let connection = await prisma.googleFitnessConnection.findUnique({
        where: { userId, isConnected: true }
      });

      if (!connection) {
        throw new Error('No Google Fitness connection found for user');
      }

      // Check if token is expired and refresh if needed
      if (connection.tokenExpiry < new Date()) {
        console.log("Access token expired, refreshing...");

        if (!connection.refreshToken) {
          throw new Error('Token expired and no refresh token available');
        }

        await this.refreshAccessToken(userId, connection.refreshToken);

        // Get updated connection after refresh
        connection = await prisma.googleFitnessConnection.findUnique({
          where: { userId }
        });

        if (!connection) {
          throw new Error('Failed to refresh token');
        }
      }

      // Get access token
      const accessToken = decrypt(connection.accessToken);

      // Always get today's data from 12AM to now for real-time tracking
      const today = new Date();
      const requestedDate = new Date(startDate);
      const isRequestingToday = requestedDate.toDateString() === today.toDateString();

      // Always use today's date for real-time step tracking
      let adjustedStartDate = new Date(today);
      adjustedStartDate.setHours(0, 0, 0, 0); // Start from 12AM today

      let adjustedEndDate = new Date(); // End at current time

      console.log(`Requested date: ${requestedDate.toDateString()}`);
      console.log(`Today's date: ${today.toDateString()}`);
      console.log(`Is requesting today: ${isRequestingToday}`);

      const startTimeMillis = adjustedStartDate.getTime();
      const endTimeMillis = adjustedEndDate.getTime();

      console.log(`\n=== DIRECT FETCH STEPS DATA ===`);
      console.log(`Original range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      console.log(`Adjusted range: ${adjustedStartDate.toISOString()} to ${adjustedEndDate.toISOString()}`);
      console.log(`Time range: ${startTimeMillis} to ${endTimeMillis}`);
      // console.log(`Is today: ${isToday}`);

      const requestBody = {
        aggregateBy: [{
          dataTypeName: "com.google.step_count.delta"
        }],
        bucketByTime: {
          durationMillis: (endTimeMillis - startTimeMillis) // Duration from 12AM to now
        },
        startTimeMillis: startTimeMillis.toString(),
        endTimeMillis: endTimeMillis.toString()
      };

      console.log("Request body:", JSON.stringify(requestBody, null, 2));

      // Direct fetch to Google Fitness API (same as working HTML test)
      let response = await fetch(
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

      // If we get 401, try refreshing the token and retry once
      if (response.status === 401) {
        console.log("Got 401, attempting token refresh and retry...");

        if (!connection.refreshToken) {
          throw new Error('Token expired and no refresh token available for retry');
        }

        await this.refreshAccessToken(userId, connection.refreshToken);

        // Get updated connection after refresh
        connection = await prisma.googleFitnessConnection.findUnique({
          where: { userId }
        });

        if (!connection) {
          throw new Error('Failed to refresh token for retry');
        }

        const newAccessToken = decrypt(connection.accessToken);

        // Retry the request with new token
        response = await fetch(
          "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${newAccessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody)
          }
        );

        console.log("Retry response status:", response.status);
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Direct API Error:", errorText);
        throw new Error(`Google Fitness API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Raw response data:", JSON.stringify(data, null, 2));

      // Process data exactly like working HTML test
      const result: any[] = [];
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
      console.log(`Steps from 12AM today to now: ${totalSteps}`);

      // Always return today's data for real-time tracking
      result.push({
        date: today.toISOString().split('T')[0], // Use today's date
        steps: totalSteps,
        dataSource: 'GOOGLE_FIT',
        timeRange: {
          start: adjustedStartDate.toISOString(),
          end: adjustedEndDate.toISOString(),
          isRealTime: true // Always real-time for current day
        }
      });

      console.log("=====================================\n");
      return result;

    } catch (error) {
      console.error('Error in fetchStepsDataDirect:', error);
      throw error;
    }
  }

  // Original approach as fallback
  async fetchStepsDataOriginal(userId: string, startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const auth = await this.getAuthenticatedClient(userId);
      const fitness = google.fitness({ version: 'v1', auth });

      const startTimeMillis = startDate.getTime();
      const endTimeMillis = endDate.getTime();

      console.log(`\n=== FALLBACK: ORIGINAL FETCH STEPS DATA ===`);
      console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      console.log(`Time range: ${startTimeMillis} to ${endTimeMillis}`);

      // Strategy 1: Try aggregated data (most reliable)
      try {
        console.log("Trying Strategy 1: Aggregated data from all sources");
        const response = await fitness.users.dataset.aggregate({
          userId: 'me',
          requestBody: {
            aggregateBy: [{
              dataTypeName: 'com.google.step_count.delta'
            }],
            bucketByTime: {
              durationMillis: 86400000 // 24 hours
            },
            startTimeMillis: startTimeMillis.toString(),
            endTimeMillis: endTimeMillis.toString()
          }
        });

        console.log("Aggregated response:", JSON.stringify(response.data, null, 2));
        const aggregatedData = this.processStepsData(response.data as GoogleFitnessDataResponse);

        if (aggregatedData.length > 0) {
          console.log(`Strategy 1 SUCCESS: Found ${aggregatedData.length} records`);
          return aggregatedData;
        }
      } catch (error) {
        console.error("Strategy 1 failed:", error);
      }

      // Strategy 2: Try direct data source access
      try {
        console.log("Trying Strategy 2: Direct data source access");

        // Get available data sources first
        const dataSourcesResponse = await fitness.users.dataSources.list({
          userId: 'me'
        });

        const stepDataSources = dataSourcesResponse.data.dataSource?.filter(
          source => source.dataType?.name === 'com.google.step_count.delta'
        ) || [];

        console.log(`Found ${stepDataSources.length} step data sources:`, stepDataSources.map(ds => ({
          id: ds.dataStreamId,
          app: ds.application?.name,
          device: ds.device?.model
        })));

        // Try to get data from each data source
        for (const dataSource of stepDataSources) {
          try {
            console.log(`Trying data source: ${dataSource.dataStreamId}`);

            const datasetResponse = await fitness.users.dataset.get({
              userId: 'me',
              datasetId: `${startTimeMillis * 1000000}-${endTimeMillis * 1000000}`,
              dataSourceId: dataSource.dataStreamId!
            });

            console.log(`Data from ${dataSource.dataStreamId}:`, JSON.stringify(datasetResponse.data, null, 2));

            if (datasetResponse.data.point && datasetResponse.data.point.length > 0) {
              const directData = this.processDirectStepsData(datasetResponse.data);
              if (directData.length > 0) {
                console.log(`Strategy 2 SUCCESS: Found ${directData.length} records from ${dataSource.dataStreamId}`);
                return directData;
              }
            }
          } catch (sourceError) {
            console.error(`Failed to get data from ${dataSource.dataStreamId}:`, sourceError);
          }
        }
      } catch (error) {
        console.error("Strategy 2 failed:", error);
      }

      // Strategy 3: Try with different time ranges (sometimes current day data isn't available)
      try {
        console.log("Trying Strategy 3: Extended time range");
        const extendedStartDate = new Date(startDate);
        extendedStartDate.setDate(extendedStartDate.getDate() - 2); // Go back 2 more days

        const response = await fitness.users.dataset.aggregate({
          userId: 'me',
          requestBody: {
            aggregateBy: [{
              dataTypeName: 'com.google.step_count.delta'
            }],
            bucketByTime: {
              durationMillis: 86400000 // 24 hours
            },
            startTimeMillis: extendedStartDate.getTime().toString(),
            endTimeMillis: endTimeMillis.toString()
          }
        });

        console.log("Extended range response:", JSON.stringify(response.data, null, 2));
        const extendedData = this.processStepsData(response.data as GoogleFitnessDataResponse);

        if (extendedData.length > 0) {
          console.log(`Strategy 3 SUCCESS: Found ${extendedData.length} records with extended range`);
          return extendedData;
        }
      } catch (error) {
        console.error("Strategy 3 failed:", error);
      }

      console.log("All fallback strategies failed, returning empty array");
      return [];

    } catch (error) {
      console.error('Error in fetchStepsDataOriginal:', error);
      throw error;
    }
  }

  // Process direct dataset response (different structure than aggregated)
  private processDirectStepsData(data: any): any[] {
    const result: any[] = [];

    if (data.point && Array.isArray(data.point)) {
      // Group points by day
      const dayGroups: { [key: string]: number } = {};

      for (const point of data.point) {
        if (point.value && point.value.length > 0) {
          const startTime = parseInt(point.startTimeNanos) / 1000000; // Convert to milliseconds
          const date = new Date(startTime);
          date.setHours(0, 0, 0, 0); // Normalize to day
          const dateKey = date.toISOString().split('T')[0];

          dayGroups[dateKey] = (dayGroups[dateKey] || 0) + point.value[0].intVal || point.value[0];
        }
      }

      // Convert to expected format
      for (const [dateKey, steps] of Object.entries(dayGroups)) {
        if (steps > 0) {
          result.push({
            date: dateKey,
            steps: steps,
            dataSource: 'GOOGLE_FIT'
          });
        }
      }
    }

    return result;
  }

  async fetchHeartRateData(userId: string, startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const auth = await this.getAuthenticatedClient(userId);
      const fitness = google.fitness({ version: 'v1', auth });

      const startTimeMillis = startDate.getTime();
      const endTimeMillis = endDate.getTime();

      const response = await fitness.users.dataset.aggregate({
        userId: 'me',
        requestBody: {
          aggregateBy: [{
            dataTypeName: 'com.google.heart_rate.bpm'
          }],
          bucketByTime: {
            durationMillis: 86400000 // 24 hours
          },
          startTimeMillis: startTimeMillis.toString(),
          endTimeMillis: endTimeMillis.toString()
        }
      });

      return this.processHeartRateData(response.data as GoogleFitnessDataResponse);
    } catch (error) {
      console.error('Error fetching heart rate data:', error);
      // Don't throw error for heart rate data - it's optional
      console.warn('Heart rate data may not be available for this user, continuing with other data types');
      return [];
    }
  }

  async fetchCaloriesData(userId: string, startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const auth = await this.getAuthenticatedClient(userId);
      const fitness = google.fitness({ version: 'v1', auth });

      const startTimeMillis = startDate.getTime();
      const endTimeMillis = endDate.getTime();

      const response = await fitness.users.dataset.aggregate({
        userId: 'me',
        requestBody: {
          aggregateBy: [{
            dataTypeName: 'com.google.calories.expended'
          }],
          bucketByTime: {
            durationMillis: 86400000 // 24 hours
          },
          startTimeMillis: startTimeMillis.toString(),
          endTimeMillis: endTimeMillis.toString()
        }
      });

      return this.processCaloriesData(response.data as GoogleFitnessDataResponse);
    } catch (error) {
      console.error('Error fetching calories data:', error);
      // Don't throw error for calories data - it's optional
      console.warn('Calories data may not be available for this user, continuing with other data types');
      return [];
    }
  }

  async fetchDistanceData(userId: string, startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const auth = await this.getAuthenticatedClient(userId);
      const fitness = google.fitness({ version: 'v1', auth });

      const startTimeMillis = startDate.getTime();
      const endTimeMillis = endDate.getTime();

      const response = await fitness.users.dataset.aggregate({
        userId: 'me',
        requestBody: {
          aggregateBy: [{
            dataTypeName: 'com.google.distance.delta'
            // Remove specific dataSourceId to aggregate from all sources
          }],
          bucketByTime: {
            durationMillis: 86400000 // 24 hours
          },
          startTimeMillis: startTimeMillis.toString(),
          endTimeMillis: endTimeMillis.toString()
        }
      });

      return this.processDistanceData(response.data as GoogleFitnessDataResponse);
    } catch (error) {
      console.error('Error fetching distance data:', error);
      // Don't throw error for distance data - it's optional
      console.warn('Distance data may not be available for this user, continuing with other data types');
      return [];
    }
  }

  private processStepsData(data: GoogleFitnessDataResponse): any[] {
    const result: any[] = [];

    if (data.bucket) {
      for (const bucket of data.bucket) {
        const date = new Date(parseInt(bucket.startTimeMillis));
        let totalSteps = 0;

        for (const dataset of bucket.dataset) {
          for (const point of dataset.point) {
            if (point.value && point.value.length > 0) {
              totalSteps += point.value[0];
            }
          }
        }

        if (totalSteps > 0) {
          result.push({
            date: date.toISOString().split('T')[0],
            steps: totalSteps,
            dataSource: 'GOOGLE_FIT'
          });
        }
      }
    }

    return result;
  }

  private processHeartRateData(data: GoogleFitnessDataResponse): any[] {
    const result: any[] = [];

    if (data.bucket) {
      for (const bucket of data.bucket) {
        const date = new Date(parseInt(bucket.startTimeMillis));
        const heartRates: number[] = [];

        for (const dataset of bucket.dataset) {
          for (const point of dataset.point) {
            if (point.value && point.value.length > 0) {
              heartRates.push(point.value[0]);
            }
          }
        }

        if (heartRates.length > 0) {
          const avgHeartRate = heartRates.reduce((sum, hr) => sum + hr, 0) / heartRates.length;
          const maxHeartRate = Math.max(...heartRates);
          const minHeartRate = Math.min(...heartRates);

          result.push({
            date: date.toISOString().split('T')[0],
            averageHeartRate: Math.round(avgHeartRate),
            maxHeartRate,
            minHeartRate,
            dataSource: 'GOOGLE_FIT'
          });
        }
      }
    }

    return result;
  }

  private processCaloriesData(data: GoogleFitnessDataResponse): any[] {
    const result: any[] = [];

    if (data.bucket) {
      for (const bucket of data.bucket) {
        const date = new Date(parseInt(bucket.startTimeMillis));
        let totalCalories = 0;

        for (const dataset of bucket.dataset) {
          for (const point of dataset.point) {
            if (point.value && point.value.length > 0) {
              totalCalories += point.value[0];
            }
          }
        }

        if (totalCalories > 0) {
          result.push({
            date: date.toISOString().split('T')[0],
            calories: Math.round(totalCalories),
            dataSource: 'GOOGLE_FIT'
          });
        }
      }
    }

    return result;
  }

  private processDistanceData(data: GoogleFitnessDataResponse): any[] {
    const result: any[] = [];

    if (data.bucket) {
      for (const bucket of data.bucket) {
        const date = new Date(parseInt(bucket.startTimeMillis));
        let totalDistance = 0;

        for (const dataset of bucket.dataset) {
          for (const point of dataset.point) {
            if (point.value && point.value.length > 0) {
              totalDistance += point.value[0];
            }
          }
        }

        if (totalDistance > 0) {
          result.push({
            date: date.toISOString().split('T')[0],
            distance: Math.round(totalDistance), // in meters
            dataSource: 'GOOGLE_FIT'
          });
        }
      }
    }

    return result;
  }

  async syncUserData(userId: string, days: number = 7): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Create sync record
      const syncRecord = await prisma.fitnessDataSync.create({
        data: {
          userId,
          syncType: 'MANUAL',
          syncPeriodStart: startDate,
          syncPeriodEnd: endDate,
          status: 'IN_PROGRESS'
        }
      });

      let recordsProcessed = 0;

      try {
        // Fetch and sync steps data
        const stepsData = await this.fetchStepsData(userId, startDate, endDate);
        for (const stepData of stepsData) {
          await this.syncStepData(userId, stepData);
          recordsProcessed++;
        }

        // Fetch and sync heart rate data
        const heartRateData = await this.fetchHeartRateData(userId, startDate, endDate);
        for (const hrData of heartRateData) {
          await this.syncHeartRateData(userId, hrData);
          recordsProcessed++;
        }

        // Fetch and sync calories data
        const caloriesData = await this.fetchCaloriesData(userId, startDate, endDate);
        for (const calorieData of caloriesData) {
          await this.syncCalorieData(userId, calorieData);
          recordsProcessed++;
        }

        // Fetch and sync distance data (optional)
        try {
          const distanceData = await this.fetchDistanceData(userId, startDate, endDate);
          for (const distData of distanceData) {
            await this.syncDistanceData(userId, distData);
            recordsProcessed++;
          }
        } catch (error) {
          console.warn('Distance data sync failed, continuing without distance data:', error);
          // Continue without distance data - it's optional
        }

        // Update sync record as completed
        await prisma.fitnessDataSync.update({
          where: { id: syncRecord.id },
          data: {
            status: 'COMPLETED',
            endTime: new Date(),
            recordsProcessed
          }
        });

        // Update last sync time
        await prisma.googleFitnessConnection.update({
          where: { userId },
          data: { lastSyncAt: new Date() }
        });

        return {
          success: true,
          message: `Successfully synced ${recordsProcessed} records`,
          data: { recordsProcessed, syncId: syncRecord.id }
        };

      } catch (error) {
        // Update sync record as failed
        await prisma.fitnessDataSync.update({
          where: { id: syncRecord.id },
          data: {
            status: 'FAILED',
            endTime: new Date(),
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            recordsProcessed
          }
        });
        throw error;
      }

    } catch (error) {
      console.error('Error syncing user data:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to sync data'
      };
    }
  }

  private async syncStepData(userId: string, stepData: any) {
    // Parse date string and create proper UTC date to match database storage
    const dateStr = stepData.date; // Expected format: "2025-10-13"
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

    console.log(`Syncing step data for ${userId}: ${stepData.steps} steps on ${stepData.date}`);
    console.log(`Processing date (UTC): ${date.toISOString()}`);

    // Check if we have a step goal for this user
    // Use date comparison that checks if the target date falls within the goal's active period
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const activeGoal = await prisma.stepGoal.findFirst({
      where: {
        userId,
        isActive: true,
        startDate: { lte: endOfDay }, // Goal must start before or during target day
        OR: [
          { endDate: null },
          { endDate: { gte: startOfDay } } // Goal must end after or during target day
        ]
      }
    });

    console.log(`Active goals found: ${activeGoal ? 1 : 0}`);
    if (activeGoal) {
      console.log(`Goal details: ${activeGoal.dailyTarget} steps, start: ${activeGoal.startDate}, end: ${activeGoal.endDate}`);
    }

    if (activeGoal) {
      console.log(`Found active goal for user: ${activeGoal.dailyTarget} steps`);

      // Update existing step log or create new one
      const result = await prisma.stepLog.upsert({
        where: {
          userId_date: { userId, date }
        },
        update: {
          actualSteps: stepData.steps,
          dataSource: 'GOOGLE_FIT',
          lastUpdated: new Date(),
          updatedAt: new Date(),
          isCompleted: stepData.steps >= activeGoal.dailyTarget
        },
        create: {
          userId,
          stepGoalId: activeGoal.id,
          date,
          actualSteps: stepData.steps,
          targetSteps: activeGoal.dailyTarget,
          isCompleted: stepData.steps >= activeGoal.dailyTarget,
          dataSource: 'GOOGLE_FIT',
          updatedAt: new Date(),
          lastUpdated: new Date()
        }
      });

      console.log(`Step data synced successfully: ${result.actualSteps} steps`);
    } else {
      console.log(`No active goal found for user ${userId} on ${stepData.date}`);
    }
  }

  private async syncHeartRateData(userId: string, hrData: any) {
    const date = new Date(hrData.date);
    date.setHours(0, 0, 0, 0);

    await prisma.heartRateData.upsert({
      where: {
        userId_date: { userId, date }
      },
      update: {
        averageHeartRate: hrData.averageHeartRate,
        maxHeartRate: hrData.maxHeartRate,
        minHeartRate: hrData.minHeartRate,
        dataSource: 'GOOGLE_FIT',
        updatedAt: new Date()
      },
      create: {
        userId,
        date,
        averageHeartRate: hrData.averageHeartRate,
        maxHeartRate: hrData.maxHeartRate,
        minHeartRate: hrData.minHeartRate,
        dataSource: 'GOOGLE_FIT'
      }
    });
  }

  private async syncCalorieData(userId: string, calorieData: any) {
    const date = new Date(calorieData.date);
    date.setHours(0, 0, 0, 0);

    await prisma.caloriesData.upsert({
      where: {
        userId_date: { userId, date }
      },
      update: {
        caloriesBurned: calorieData.calories,
        dataSource: 'GOOGLE_FIT',
        updatedAt: new Date()
      },
      create: {
        userId,
        date,
        caloriesBurned: calorieData.calories,
        dataSource: 'GOOGLE_FIT'
      }
    });
  }

  private async syncDistanceData(userId: string, distanceData: any) {
    const date = new Date(distanceData.date);
    date.setHours(0, 0, 0, 0);

    await prisma.distanceData.upsert({
      where: {
        userId_date: { userId, date }
      },
      update: {
        totalDistance: distanceData.distance,
        dataSource: 'GOOGLE_FIT',
        updatedAt: new Date()
      },
      create: {
        userId,
        date,
        totalDistance: distanceData.distance,
        dataSource: 'GOOGLE_FIT'
      }
    });
  }
}

export const googleFitnessService = new GoogleFitnessService();