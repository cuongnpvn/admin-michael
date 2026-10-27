export const EXAM_LIVE_HEARTBEAT_MS = 30_000;
export const EXAM_LIVE_STALE_MS = 90_000;
export const EXAM_LIVE_ADMIN_POLL_MS = 15_000;

export type ExamLiveSection = "listening" | "reading";

export function examLiveSectionFromPhase(
  phase:
    | "listening-section-intro"
    | "listening-directions"
    | "listening"
    | "section-transition"
    | "reading"
    | "result",
): ExamLiveSection | null {
  if (phase === "result") return null;
  if (phase === "section-transition" || phase === "reading") return "reading";
  return "listening";
}

export function isExamLiveSection(value: unknown): value is ExamLiveSection {
  return value === "listening" || value === "reading";
}

export function isExamLiveSessionFresh(
  lastSeenAt: string,
  nowMs: number = Date.now(),
): boolean {
  const lastSeenMs = new Date(lastSeenAt).getTime();
  if (Number.isNaN(lastSeenMs)) return false;
  return nowMs - lastSeenMs <= EXAM_LIVE_STALE_MS;
}

export function examLiveElapsedParts(
  startedAt: string,
  nowMs: number = Date.now(),
): { hours: number; minutes: number } {
  const startedMs = new Date(startedAt).getTime();
  const elapsedMs = Number.isNaN(startedMs)
    ? 0
    : Math.max(0, nowMs - startedMs);
  const totalMinutes = Math.floor(elapsedMs / 60_000);
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };
}
