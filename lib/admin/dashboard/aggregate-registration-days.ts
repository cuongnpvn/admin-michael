import { getTodayDateKey, toDateKey } from "@/lib/learning/daily-goals/date-key";

export type RegistrationDay = {
  date: string;
  count: number;
};

export const REGISTRATION_CHART_DAYS = 30;

export function shiftDateKey(dateKey: string, deltaDays: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  date.setUTCDate(date.getUTCDate() + deltaDays);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export function vietnamDayStartIso(dateKey: string): string {
  return `${dateKey}T00:00:00+07:00`;
}

export function buildRegistrationDayBuckets(
  createdAtList: string[],
  days = REGISTRATION_CHART_DAYS,
  todayKey = getTodayDateKey(),
): RegistrationDay[] {
  const buckets: RegistrationDay[] = Array.from(
    { length: days },
    (_, index) => ({
      date: shiftDateKey(todayKey, -(days - 1 - index)),
      count: 0,
    }),
  );
  const indexByDate = new Map(buckets.map((row, index) => [row.date, index]));

  for (const createdAt of createdAtList) {
    if (!createdAt) continue;
    const index = indexByDate.get(toDateKey(createdAt));
    if (index == null) continue;
    buckets[index]!.count += 1;
  }

  return buckets;
}

export function todayRegistrationCount(buckets: RegistrationDay[]): number {
  return buckets.at(-1)?.count ?? 0;
}
