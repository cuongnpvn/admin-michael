export const DAILY_GOAL_TIMEZONE = "Asia/Ho_Chi_Minh";

export function toDateKey(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DAILY_GOAL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getTodayDateKey(): string {
  return toDateKey(new Date());
}

export function getYesterdayDateKey(): string {
  const today = getTodayDateKey();
  const [year, month, day] = today.split("-").map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  date.setUTCDate(date.getUTCDate() - 1);
  return toDateKey(date);
}

export function getWeekdayIndex(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  const weekday = new Date(Date.UTC(year!, month! - 1, day!)).getUTCDay();
  return weekday === 0 ? 6 : weekday - 1;
}

export function getMonthDateKeys(year: number, month: number): string[] {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  });
}

export function parseDateKey(dateKey: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateKey.split("-").map(Number);
  return { year: year!, month: month!, day: day! };
}

export function daysBetween(laterDateKey: string, earlierDateKey: string): number {
  const [laterYear, laterMonth, laterDay] = laterDateKey.split("-").map(Number);
  const [earlierYear, earlierMonth, earlierDay] = earlierDateKey
    .split("-")
    .map(Number);
  const later = Date.UTC(laterYear!, laterMonth! - 1, laterDay!);
  const earlier = Date.UTC(earlierYear!, earlierMonth! - 1, earlierDay!);
  return Math.round((later - earlier) / (24 * 60 * 60 * 1000));
}
