export interface TranscriptSegment {
  index: number;
  english: string;
  startSec: number;
  endSec: number;
}

export function normalizeTranscriptSegments(
  value: unknown,
): TranscriptSegment[] {
  if (!Array.isArray(value)) return [];

  const segments: TranscriptSegment[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    if (typeof row.english !== "string") continue;
    if (typeof row.index !== "number" || !Number.isInteger(row.index)) {
      continue;
    }
    if (typeof row.startSec !== "number" || !Number.isFinite(row.startSec)) {
      continue;
    }
    if (typeof row.endSec !== "number" || !Number.isFinite(row.endSec)) {
      continue;
    }
    segments.push({
      index: row.index,
      english: row.english,
      startSec: row.startSec,
      endSec: row.endSec,
    });
  }

  return segments.sort((left, right) => left.index - right.index);
}

function formatMmSs(seconds: number): string {
  const clamped = Math.max(0, seconds);
  const minutes = Math.floor(clamped / 60);
  const remainder = Math.floor(clamped % 60);
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export function formatTurnTimeRange(
  startSec: number,
  endSec: number,
): string {
  return `${formatMmSs(startSec)}–${formatMmSs(endSec)}`;
}
