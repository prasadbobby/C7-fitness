// IST Timezone Utility Functions
// Standardized timezone handling for FitForge application

/**
 * IST (Indian Standard Time) offset in milliseconds
 * IST is UTC+5:30 (5.5 hours ahead of UTC)
 */
export const IST_OFFSET = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds

/**
 * Converts UTC date to IST
 * @param utcDate - Date object in UTC
 * @returns Date object adjusted to IST
 */
export function utcToIST(utcDate: Date): Date {
  return new Date(utcDate.getTime() + IST_OFFSET);
}

/**
 * Converts IST date to UTC
 * @param istDate - Date object in IST
 * @returns Date object adjusted to UTC
 */
export function istToUTC(istDate: Date): Date {
  return new Date(istDate.getTime() - IST_OFFSET);
}

/**
 * Gets current date/time in IST
 * @returns Date object representing current time in IST
 */
export function nowIST(): Date {
  return utcToIST(new Date());
}

/**
 * Creates a date in IST timezone from year, month, day
 * @param year - Full year (e.g., 2025)
 * @param month - Month (0-11, where 0 = January)
 * @param day - Day of month (1-31)
 * @param hour - Hour (0-23), default 0
 * @param minute - Minute (0-59), default 0
 * @param second - Second (0-59), default 0
 * @returns Date object representing the specified time in IST
 */
export function createISTDate(
  year: number,
  month: number,
  day: number,
  hour: number = 0,
  minute: number = 0,
  second: number = 0
): Date {
  // Create date in UTC first, then convert to IST
  const utcDate = new Date(Date.UTC(year, month, day, hour, minute, second));
  return utcToIST(utcDate);
}

/**
 * Formats date to IST string
 * @param date - Date object (can be UTC or IST)
 * @param convertFromUTC - Whether to convert from UTC to IST first, default true
 * @returns Formatted date string in IST
 */
export function formatIST(
  date: Date,
  convertFromUTC: boolean = true,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const istDate = convertFromUTC ? utcToIST(date) : date;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };

  return istDate.toLocaleDateString('en-IN', defaultOptions);
}

/**
 * Formats date and time to IST string
 * @param date - Date object (can be UTC or IST)
 * @param convertFromUTC - Whether to convert from UTC to IST first, default true
 * @returns Formatted date and time string in IST
 */
export function formatISTDateTime(
  date: Date,
  convertFromUTC: boolean = true
): string {
  const istDate = convertFromUTC ? utcToIST(date) : date;

  return istDate.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

/**
 * Gets start of day in IST (00:00:00 IST)
 * @param date - Date object
 * @returns Date object representing start of day in IST
 */
export function startOfDayIST(date: Date): Date {
  const istDate = utcToIST(date);
  const startOfDay = new Date(Date.UTC(
    istDate.getUTCFullYear(),
    istDate.getUTCMonth(),
    istDate.getUTCDate(),
    0, 0, 0, 0
  ));
  return utcToIST(startOfDay);
}

/**
 * Gets end of day in IST (23:59:59.999 IST)
 * @param date - Date object
 * @returns Date object representing end of day in IST
 */
export function endOfDayIST(date: Date): Date {
  const istDate = utcToIST(date);
  const endOfDay = new Date(Date.UTC(
    istDate.getUTCFullYear(),
    istDate.getUTCMonth(),
    istDate.getUTCDate(),
    23, 59, 59, 999
  ));
  return utcToIST(endOfDay);
}

/**
 * Calculates days between two dates in IST
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of days between the dates
 */
export function daysBetweenIST(startDate: Date, endDate: Date): number {
  const istStart = startOfDayIST(startDate);
  const istEnd = startOfDayIST(endDate);
  const diffTime = istEnd.getTime() - istStart.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Checks if date is today in IST
 * @param date - Date to check
 * @returns True if the date is today in IST
 */
export function isTodayIST(date: Date): boolean {
  const now = nowIST();
  const istDate = utcToIST(date);

  return (
    istDate.getUTCFullYear() === now.getUTCFullYear() &&
    istDate.getUTCMonth() === now.getUTCMonth() &&
    istDate.getUTCDate() === now.getUTCDate()
  );
}

/**
 * Parses date string as IST
 * @param dateString - Date string (YYYY-MM-DD format)
 * @returns Date object in IST
 */
export function parseISTDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return createISTDate(year, month - 1, day); // month is 0-indexed
}

/**
 * Converts Date to YYYY-MM-DD format in IST
 * @param date - Date object
 * @returns Date string in YYYY-MM-DD format (IST)
 */
export function toISTDateString(date: Date): string {
  const istDate = utcToIST(date);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Gets days remaining until a future date in IST
 * @param targetDate - Target date
 * @returns Number of days remaining (0 if past or today)
 */
export function daysRemainingIST(targetDate: Date): number {
  const now = nowIST();
  const target = utcToIST(targetDate);

  const nowStart = startOfDayIST(now);
  const targetStart = startOfDayIST(target);

  const diffTime = targetStart.getTime() - nowStart.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, daysRemaining);
}