/**
 * Format seconds to human-readable duration string
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "5m 30s", "1h 20m", "45s")
 */
export function formatDuration(seconds?: number): string {
  if (!seconds || seconds === 0) return "0s";

  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
}