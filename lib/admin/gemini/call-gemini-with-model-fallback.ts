import { GEMINI_MODEL, getBackupGeminiModel } from "@/lib/admin/gemini/constants";
import { geminiWarn } from "@/lib/admin/gemini/gemini-log";
import { describeGeminiRetryFailure } from "@/lib/admin/gemini/is-retryable-gemini-error";

function resolveGeminiFallbackModel(
  label: string,
  primaryError: unknown,
): string | null {
  const backup = getBackupGeminiModel();
  const failure = describeGeminiRetryFailure(primaryError);

  if (!backup) {
    const configured = process.env.BACKUP_GEMINI_MODEL?.trim() || null;
    geminiWarn("model_fallback_skipped", {
      label,
      primaryModel: GEMINI_MODEL,
      backupConfigured: configured,
      skipReason: !configured
        ? "BACKUP_GEMINI_MODEL unset"
        : "BACKUP_GEMINI_MODEL same as GEMINI_MODEL",
      reason: failure.reason,
      message: failure.message,
    });
    return null;
  }

  geminiWarn("model_fallback", {
    label,
    primaryModel: GEMINI_MODEL,
    backupModel: backup,
    reason: failure.reason,
    httpStatus: failure.httpStatus,
    message: failure.message,
  });
  return backup;
}

/**
 * Calls Gemini with the primary model; on any failure (including RECITATION /
 * copyright blocks), retries once with BACKUP_GEMINI_MODEL when configured and
 * different from GEMINI_MODEL.
 */
export async function callGeminiWithModelFallback<T>(
  label: string,
  fn: (model: string) => Promise<T>,
): Promise<T> {
  try {
    return await fn(GEMINI_MODEL);
  } catch (primaryError) {
    const backup = resolveGeminiFallbackModel(label, primaryError);
    if (!backup) throw primaryError;
    return fn(backup);
  }
}

/** Retries the backup model only if `hasStarted` never matched a yielded item. */
export async function* streamGeminiWithModelFallback<T>(
  label: string,
  fn: (model: string) => AsyncIterable<T>,
  hasStarted: (item: T) => boolean,
): AsyncGenerator<T> {
  let started = false;
  try {
    for await (const item of fn(GEMINI_MODEL)) {
      if (hasStarted(item)) started = true;
      yield item;
    }
  } catch (primaryError) {
    if (started) throw primaryError;
    const backup = resolveGeminiFallbackModel(label, primaryError);
    if (!backup) throw primaryError;
    yield* fn(backup);
  }
}
