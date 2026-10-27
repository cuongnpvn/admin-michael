import { copy } from "@/lib/copy/vi";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatAttemptRelativeTime(
  isoDate: string | null,
  nowMs: number = Date.now(),
): string {
  if (!isoDate) return copy.user.noData;

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return copy.user.noData;

  const diffMs = nowMs - date.getTime();
  if (diffMs < 60_000) {
    return copy.common.relativeTime.justNow;
  }

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) {
    return copy.common.relativeTime.minutesAgo(minutes);
  }

  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 24) {
    return copy.common.relativeTime.hoursAgo(hours);
  }

  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}`;
}
