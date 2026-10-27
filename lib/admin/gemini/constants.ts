export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";

/** Fallback model when the primary model rejects the request (e.g. copyright block). */
export function getBackupGeminiModel(): string | null {
  const backup = process.env.BACKUP_GEMINI_MODEL?.trim();
  if (!backup || backup === GEMINI_MODEL) return null;
  return backup;
}

export const PDF_INLINE_MAX_BYTES = 50 * 1024 * 1024;

export const MAX_PDF_BYTES = 100 * 1024 * 1024;

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
}

/** Max parallel Gemini extractions per server process (default 2). */
export const GEMINI_MAX_CONCURRENT = parsePositiveInt(
  process.env.GEMINI_MAX_CONCURRENT,
  2,
);

/** Max client-side parallel extract server actions (default matches server cap). */
export const GEMINI_EXTRACT_CONCURRENCY = GEMINI_MAX_CONCURRENT;

/** Retry attempts for rate-limited / transient Gemini errors (default 4). */
export const GEMINI_MAX_RETRIES = parsePositiveInt(
  process.env.GEMINI_MAX_RETRIES,
  4,
);

/** Initial backoff before first retry in ms (default 2s). Doubles each attempt. */
export const GEMINI_RETRY_BASE_MS = parsePositiveInt(
  process.env.GEMINI_RETRY_BASE_MS,
  2000,
);

/** Upper bound for a single retry wait in ms (default 30s). */
export const GEMINI_RETRY_MAX_MS = parsePositiveInt(
  process.env.GEMINI_RETRY_MAX_MS,
  30_000,
);
