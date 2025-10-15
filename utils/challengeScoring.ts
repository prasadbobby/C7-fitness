/**
 * Unified Challenge Scoring System
 *
 * This utility provides consistent scoring across the leaderboard and participant details.
 * All scoring calculations should use these functions to ensure consistency.
 */

export interface ChallengeMetrics {
  totalPosts: number;
  avgSleepHours: number;
  avgSleepQuality: number;
  avgMood: number;
  avgEnergy: number;
  consistency: number;
}

export interface ScoringWeights {
  consistency: number;
  avgSleepHours: number;
  avgSleepQuality: number;
  avgMood: number;
  avgEnergy: number;
  totalPosts: number;
}

// Standardized scoring weights - single source of truth
export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  consistency: 0.3,      // 30% - Most important (posting regularly)
  avgSleepHours: 0.2,    // 20% - Sleep quantity
  avgSleepQuality: 0.15, // 15% - Sleep quality
  avgMood: 0.15,         // 15% - Mental wellness
  avgEnergy: 0.15,       // 15% - Physical wellness
  totalPosts: 0.05       // 5% - Engagement bonus
};

/**
 * Convert sleep quality enum to numeric score
 */
export function getSleepQualityScore(quality: string): number {
  const scores: Record<string, number> = {
    'EXCELLENT': 5,
    'VERY_GOOD': 4,
    'GOOD': 3,
    'FAIR': 2,
    'POOR': 1
  };
  return scores[quality] || 0;
}

/**
 * Convert mood enum to numeric score
 */
export function getMoodScore(mood: string): number {
  const scores: Record<string, number> = {
    'EXCELLENT': 5,
    'VERY_GOOD': 4,
    'GOOD': 3,
    'NEUTRAL': 2,
    'LOW': 1,
    'VERY_LOW': 0
  };
  return scores[mood] || 0;
}

/**
 * Convert energy enum to numeric score
 */
export function getEnergyScore(energy: string): number {
  const scores: Record<string, number> = {
    'VERY_HIGH': 5,
    'HIGH': 4,
    'MODERATE': 3,
    'LOW': 2,
    'VERY_LOW': 1
  };
  return scores[energy] || 0;
}

/**
 * Calculate normalized metrics for scoring
 */
export function normalizeMetrics(metrics: ChallengeMetrics, daysElapsed: number): Record<keyof ScoringWeights, number> {
  return {
    consistency: Math.min(100, metrics.consistency) / 100,
    avgSleepHours: Math.min(12, Math.max(0, metrics.avgSleepHours)) / 12,
    avgSleepQuality: metrics.avgSleepQuality / 5,
    avgMood: metrics.avgMood / 5,
    avgEnergy: metrics.avgEnergy / 5,
    totalPosts: Math.min(daysElapsed, metrics.totalPosts) / daysElapsed
  };
}

/**
 * Calculate overall challenge score using standardized weights
 */
export function calculateChallengeScore(
  metrics: ChallengeMetrics,
  daysElapsed: number,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS
): number {
  const normalizedMetrics = normalizeMetrics(metrics, daysElapsed);

  return Object.entries(weights).reduce((score, [key, weight]) => {
    const metricValue = normalizedMetrics[key as keyof typeof normalizedMetrics];
    return score + (metricValue * weight * 100);
  }, 0);
}

/**
 * Calculate consistency percentage based on posts and elapsed time
 */
export function calculateConsistency(totalPosts: number, daysElapsed: number): number {
  return Math.min(100, (totalPosts / daysElapsed) * 100);
}

/**
 * Calculate average sleep quality from posts
 */
export function calculateAverageSleepQuality(posts: Array<{ sleepQuality: string | null }>): number {
  const sleepQualityScores = posts
    .filter(p => p.sleepQuality !== null && typeof p.sleepQuality === 'string')
    .map(p => getSleepQualityScore(p.sleepQuality!))
    .filter(score => !isNaN(score) && score >= 0);

  return sleepQualityScores.length > 0
    ? sleepQualityScores.reduce((sum, score) => sum + score, 0) / sleepQualityScores.length
    : 0;
}

/**
 * Calculate average mood from posts
 */
export function calculateAverageMood(posts: Array<{ mood: string | null }>): number {
  const moodScores = posts
    .filter(p => p.mood !== null && typeof p.mood === 'string')
    .map(p => getMoodScore(p.mood!))
    .filter(score => !isNaN(score) && score >= 0);

  return moodScores.length > 0
    ? moodScores.reduce((sum, score) => sum + score, 0) / moodScores.length
    : 0;
}

/**
 * Calculate average energy from posts
 */
export function calculateAverageEnergy(posts: Array<{ energy: string | null }>): number {
  const energyScores = posts
    .filter(p => p.energy !== null && typeof p.energy === 'string')
    .map(p => getEnergyScore(p.energy!))
    .filter(score => !isNaN(score) && score >= 0);

  return energyScores.length > 0
    ? energyScores.reduce((sum, score) => sum + score, 0) / energyScores.length
    : 0;
}

/**
 * Calculate average sleep hours from posts
 */
export function calculateAverageSleepHours(posts: Array<{ sleepHours: number | null }>): number {
  const sleepHours = posts
    .filter(p => p.sleepHours !== null && typeof p.sleepHours === 'number' && !isNaN(p.sleepHours) && p.sleepHours >= 0 && p.sleepHours <= 24)
    .map(p => p.sleepHours!);

  return sleepHours.length > 0
    ? sleepHours.reduce((sum, hours) => sum + hours, 0) / sleepHours.length
    : 0;
}

/**
 * Calculate all metrics for a participant from their posts
 */
export function calculateParticipantMetrics(
  posts: Array<{
    sleepHours: number | null;
    sleepQuality: string | null;
    mood: string | null;
    energy: string | null;
    createdAt: string;
  }>,
  joinedAt: string
): ChallengeMetrics {
  const totalPosts = posts.length;

  // Use UTC dates for consistency
  const now = new Date();
  const nowUTC = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const joinedAtUTC = new Date(new Date(joinedAt).getUTCFullYear(), new Date(joinedAt).getUTCMonth(), new Date(joinedAt).getUTCDate());

  const daysElapsed = Math.max(1, Math.ceil((nowUTC.getTime() - joinedAtUTC.getTime()) / (1000 * 60 * 60 * 24)));

  return {
    totalPosts,
    avgSleepHours: calculateAverageSleepHours(posts),
    avgSleepQuality: calculateAverageSleepQuality(posts),
    avgMood: calculateAverageMood(posts),
    avgEnergy: calculateAverageEnergy(posts),
    consistency: calculateConsistency(totalPosts, daysElapsed)
  };
}