/**
 * Weekly Leaderboard Utilities
 * Handles week-based calculations for challenge participants
 * Uses Indian Standard Time (IST) for week calculations
 */

export interface WeekInfo {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  isCurrentWeek: boolean;
  isCompleted: boolean;
}

/**
 * Convert a date to Indian Standard Time (IST)
 */
function toIST(date: Date): Date {
  // IST is UTC+5:30
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  return new Date(date.getTime() + istOffset);
}

/**
 * Get current time in IST
 */
function getCurrentIST(): Date {
  return toIST(new Date());
}

/**
 * Get the start of week (Monday) for a given date in IST
 */
export function getWeekStart(date: Date): Date {
  // Convert to IST first
  const istDate = toIST(date);
  const day = istDate.getUTCDay(); // Use UTC methods since we've already adjusted for IST
  const diff = istDate.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(istDate);
  monday.setUTCDate(diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

/**
 * Get the end of week (Sunday 11:59 PM IST) for a given date
 */
export function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date);
  const sunday = new Date(weekStart);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);
  return sunday;
}

/**
 * Get all weeks for a challenge period
 */
export function getChallengeWeeks(challengeStartDate: string, challengeEndDate?: string): WeekInfo[] {
  const startDate = new Date(challengeStartDate);
  const endDate = challengeEndDate ? new Date(challengeEndDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  const nowIST = getCurrentIST(); // Use IST for current time

  const weeks: WeekInfo[] = [];
  let currentWeekStart = getWeekStart(startDate);
  let weekNumber = 1;

  while (currentWeekStart <= endDate) {
    const currentWeekEnd = getWeekEnd(currentWeekStart);
    const isCurrentWeek = nowIST >= currentWeekStart && nowIST <= currentWeekEnd;
    const isCompleted = nowIST > currentWeekEnd;

    weeks.push({
      weekNumber,
      startDate: new Date(currentWeekStart),
      endDate: new Date(currentWeekEnd),
      isCurrentWeek,
      isCompleted
    });

    // Move to next week
    currentWeekStart = new Date(currentWeekStart);
    currentWeekStart.setUTCDate(currentWeekStart.getUTCDate() + 7);
    weekNumber++;
  }

  return weeks;
}

/**
 * Get the current week info for a challenge
 */
export function getCurrentWeek(challengeStartDate: string): WeekInfo | null {
  const weeks = getChallengeWeeks(challengeStartDate);
  return weeks.find(week => week.isCurrentWeek) || null;
}

/**
 * Get the most recently completed week
 */
export function getLastCompletedWeek(challengeStartDate: string): WeekInfo | null {
  const weeks = getChallengeWeeks(challengeStartDate);
  const completedWeeks = weeks.filter(week => week.isCompleted);
  return completedWeeks.length > 0 ? completedWeeks[completedWeeks.length - 1] : null;
}

/**
 * Filter posts by week
 */
export function getPostsForWeek(posts: any[], week: WeekInfo): any[] {
  return posts.filter(post => {
    const postDate = new Date(post.date);
    return postDate >= week.startDate && postDate <= week.endDate;
  });
}

/**
 * Calculate weekly metrics for a participant
 */
export function calculateWeeklyMetrics(posts: any[], week: WeekInfo, participantJoinedAt: string) {
  const weekPosts = getPostsForWeek(posts, week);
  const joinedDate = new Date(participantJoinedAt);

  // Only count days after the participant joined
  const effectiveStartDate = joinedDate > week.startDate ? joinedDate : week.startDate;
  const effectiveEndDate = week.endDate;

  // Calculate days the participant was eligible to post this week
  const totalEligibleDays = Math.max(1, Math.ceil((effectiveEndDate.getTime() - effectiveStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  const totalPosts = weekPosts.length;
  const consistency = totalEligibleDays > 0 ? (totalPosts / totalEligibleDays) * 100 : 0;

  // Calculate averages
  const sleepHours = weekPosts.filter(p => p.sleepHours !== null).map(p => p.sleepHours);
  const sleepQuality = weekPosts.filter(p => p.sleepQuality !== null).map(p => {
    const qualityMap = { 'POOR': 1, 'FAIR': 2, 'GOOD': 3, 'VERY_GOOD': 4, 'EXCELLENT': 5 };
    return qualityMap[p.sleepQuality as keyof typeof qualityMap] || 3;
  });
  const mood = weekPosts.filter(p => p.mood !== null).map(p => {
    const moodMap = { 'VERY_LOW': 1, 'LOW': 2, 'NEUTRAL': 3, 'GOOD': 4, 'VERY_GOOD': 5, 'EXCELLENT': 5 };
    return moodMap[p.mood as keyof typeof moodMap] || 3;
  });
  const energy = weekPosts.filter(p => p.energy !== null).map(p => {
    const energyMap = { 'VERY_LOW': 1, 'LOW': 2, 'MODERATE': 3, 'HIGH': 4, 'VERY_HIGH': 5 };
    return energyMap[p.energy as keyof typeof energyMap] || 3;
  });

  return {
    totalPosts,
    totalEligibleDays,
    consistency: Math.min(100, consistency),
    avgSleepHours: sleepHours.length > 0 ? sleepHours.reduce((a, b) => a + b, 0) / sleepHours.length : 0,
    avgSleepQuality: sleepQuality.length > 0 ? sleepQuality.reduce((a, b) => a + b, 0) / sleepQuality.length : 0,
    avgMood: mood.length > 0 ? mood.reduce((a, b) => a + b, 0) / mood.length : 0,
    avgEnergy: energy.length > 0 ? energy.reduce((a, b) => a + b, 0) / energy.length : 0,
  };
}

/**
 * Calculate weekly score using the same weights as overall scoring
 */
export function calculateWeeklyScore(metrics: ReturnType<typeof calculateWeeklyMetrics>) {
  const weights = {
    consistency: 0.4,        // Higher weight for weekly consistency
    avgSleepHours: 0.15,     // Sleep quantity
    avgSleepQuality: 0.15,   // Sleep quality
    avgMood: 0.15,           // Mental wellness
    avgEnergy: 0.15,         // Physical wellness
  };

  // Normalize sleep hours (assuming 8 hours is optimal)
  const normalizedSleepHours = Math.min(100, (metrics.avgSleepHours / 8) * 100);

  // Normalize other metrics (1-5 scale to 0-100)
  const normalizedSleepQuality = (metrics.avgSleepQuality / 5) * 100;
  const normalizedMood = (metrics.avgMood / 5) * 100;
  const normalizedEnergy = (metrics.avgEnergy / 5) * 100;

  const score =
    (metrics.consistency * weights.consistency) +
    (normalizedSleepHours * weights.avgSleepHours) +
    (normalizedSleepQuality * weights.avgSleepQuality) +
    (normalizedMood * weights.avgMood) +
    (normalizedEnergy * weights.avgEnergy);

  return Math.round(score);
}

/**
 * Format week display text
 */
export function formatWeekDisplay(week: WeekInfo): string {
  const startMonth = week.startDate.toLocaleDateString('en-US', { month: 'short' });
  const startDay = week.startDate.getDate();
  const endMonth = week.endDate.toLocaleDateString('en-US', { month: 'short' });
  const endDay = week.endDate.getDate();

  if (startMonth === endMonth) {
    return `Week ${week.weekNumber}: ${startMonth} ${startDay}-${endDay}`;
  } else {
    return `Week ${week.weekNumber}: ${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  }
}