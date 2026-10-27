import { geminiError, geminiLog, geminiWarn } from "@/lib/admin/gemini/gemini-log";
import {
  describeGeminiRetryFailure,
  shouldRetryGeminiCall,
  type GeminiRetryReason,
} from "@/lib/admin/gemini/is-retryable-gemini-error";

/** Hard ceiling so misconfigured env cannot cause unbounded retries. */
const ABSOLUTE_MAX_ATTEMPTS = 10;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryReasonLabel(reason: GeminiRetryReason): string {
  switch (reason) {
    case "rate_limit":
      return "rate limit";
    case "server_error":
      return "server error";
    case "transient":
      return "transient error";
    case "content_error":
      return "content error";
    case "recitation":
      return "copyright recitation";
    default:
      return "error";
  }
}

function formatDelay(seconds: number): string {
  if (seconds < 1) return `${Math.round(seconds * 1000)}ms`;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
}

export interface RetryWithBackoffOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  label?: string;
  isRetryable?: (error: unknown) => boolean;
}

function backoffDelayMs(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
): number {
  const exponential = baseDelayMs * 2 ** attempt;
  const jitter = Math.floor(Math.random() * baseDelayMs * 0.25);
  return Math.min(maxDelayMs, exponential + jitter);
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryWithBackoffOptions,
): Promise<T> {
  const isRetryable = options.isRetryable ?? shouldRetryGeminiCall;
  const label = options.label ?? "gemini-call";
  const maxAttempts = Math.min(
    Math.max(1, options.maxAttempts),
    ABSOLUTE_MAX_ATTEMPTS,
  );
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      if (attempt > 0) {
        geminiLog("retry_resuming_after_backoff", {
          label,
          attempt: attempt + 1,
          maxAttempts,
          note: "Retrying Gemini request after backoff sleep",
        });
      }
      return await fn();
    } catch (error) {
      lastError = error;
      const isLastAttempt = attempt >= maxAttempts - 1;
      const retryable = isRetryable(error);
      const failure = describeGeminiRetryFailure(error);
      const reasonLabel = retryReasonLabel(failure.reason);

      if (isLastAttempt || !retryable) {
        geminiError(
          retryable ? "retry_exhausted" : "retry_not_applicable",
          {
            label,
            attempt: attempt + 1,
            maxAttempts,
            retryable,
            reason: failure.reason,
            reasonLabel,
            httpStatus: failure.httpStatus,
            message: failure.message,
            summary: retryable
              ? `${reasonLabel} persisted after ${attempt + 1}/${maxAttempts} attempts — giving up`
              : `${reasonLabel} is not retryable — not sending again`,
          },
          error,
        );
        throw error;
      }

      const delayMs = backoffDelayMs(
        attempt,
        options.baseDelayMs,
        options.maxDelayMs,
      );
      const delaySec = delayMs / 1000;
      const nextAttempt = attempt + 2;

      geminiWarn("rate_limit_retry_backoff", {
        label,
        attempt: attempt + 1,
        nextAttempt,
        maxAttempts,
        reason: failure.reason,
        reasonLabel,
        httpStatus: failure.httpStatus,
        delayMs,
        delayHuman: formatDelay(delaySec),
        message: failure.message,
        summary:
          failure.reason === "rate_limit"
            ? `Rate limit hit${failure.httpStatus ? ` (${failure.httpStatus})` : ""} — waiting ${formatDelay(delaySec)} before attempt ${nextAttempt}/${maxAttempts}`
            : `${reasonLabel}${failure.httpStatus ? ` (${failure.httpStatus})` : ""} — waiting ${formatDelay(delaySec)} before attempt ${nextAttempt}/${maxAttempts}`,
      });

      await sleep(delayMs);
    }
  }

  throw lastError;
}
