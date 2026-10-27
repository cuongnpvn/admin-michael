const TIMEZONE = "Asia/Ho_Chi_Minh";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function partsInTimezone(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

export function formatNotificationTime(isoDate: string): string {
  const p = partsInTimezone(new Date(isoDate));
  return `${p.day}/${p.month} ${p.hour}:${p.minute}`;
}

/** Trailing list time: hh:mm if today, else dd/mm. */
export function formatNotificationTimeCompact(isoDate: string): string {
  const date = new Date(isoDate);
  const now = partsInTimezone(new Date());
  const p = partsInTimezone(date);
  const isToday =
    p.year === now.year && p.month === now.month && p.day === now.day;

  if (isToday) {
    return `${pad2(Number(p.hour))}:${pad2(Number(p.minute))}`;
  }

  return `${pad2(Number(p.day))}/${pad2(Number(p.month))}`;
}
