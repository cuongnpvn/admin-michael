import { copy } from "@/lib/copy/vi";

export function formatNotebookNoteTime(
  isoDate: string,
  nowMs: number = Date.now(),
): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  const diffMs = date.getTime() - nowMs;
  if (Math.abs(diffMs) < 60_000) {
    return copy.notebook.justNow;
  }

  const diffMinutes = Math.round(diffMs / (60 * 1000));
  const diffHours = Math.round(diffMs / (60 * 60 * 1000));
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));

  const formatter = new Intl.RelativeTimeFormat("vi", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, "minute");
  }
  if (Math.abs(diffHours) < 48) {
    return formatter.format(diffHours, "hour");
  }
  if (Math.abs(diffDays) < 14) {
    return formatter.format(diffDays, "day");
  }

  return new Intl.DateTimeFormat("vi", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
