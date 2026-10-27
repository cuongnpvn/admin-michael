function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "";
}

function errorStatus(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;

  const record = error as Record<string, unknown>;
  const candidates = [record.status, record.statusCode, record.code];

  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate;
    }
    if (typeof candidate === "string" && /^\d{3}$/.test(candidate)) {
      return Number(candidate);
    }
  }

  return null;
}

export type GeminiRetryReason =
  | "rate_limit"
  | "server_error"
  | "transient"
  | "content_error"
  | "recitation"
  | "unknown";

/** Copyright / RECITATION finish-reason blocks — not retryable with the same model. */
export function isGeminiRecitationError(error: unknown): boolean {
  return /copyright|recitation/i.test(errorMessage(error));
}

export function describeGeminiRetryFailure(error: unknown): {
  httpStatus: number | null;
  message: string;
  reason: GeminiRetryReason;
  willRetry: boolean;
} {
  const httpStatus = errorStatus(error);
  const message = errorMessage(error);
  const lower = message.toLowerCase();

  if (isGeminiRecitationError(error)) {
    return {
      httpStatus,
      message,
      reason: "recitation",
      willRetry: false,
    };
  }

  if (isGeminiContentError(error)) {
    return {
      httpStatus,
      message,
      reason: "content_error",
      willRetry: false,
    };
  }

  if (
    httpStatus === 429 ||
    /rate.?limit|too many requests|quota|resource.?exhausted/.test(lower)
  ) {
    return {
      httpStatus,
      message,
      reason: "rate_limit",
      willRetry: shouldRetryGeminiCall(error),
    };
  }

  if (httpStatus === 503 || httpStatus === 502 || httpStatus === 500) {
    return {
      httpStatus,
      message,
      reason: "server_error",
      willRetry: shouldRetryGeminiCall(error),
    };
  }

  if (
    /overloaded|capacity|temporarily unavailable|try again later|429|503/.test(
      lower,
    )
  ) {
    return {
      httpStatus,
      message,
      reason: "transient",
      willRetry: shouldRetryGeminiCall(error),
    };
  }

  return {
    httpStatus,
    message,
    reason: "unknown",
    willRetry: shouldRetryGeminiCall(error),
  };
}

export function isRetryableGeminiError(error: unknown): boolean {
  const status = errorStatus(error);
  if (status === 429 || status === 503 || status === 502 || status === 500) {
    return true;
  }

  const message = errorMessage(error).toLowerCase();
  return (
    /rate.?limit|too many requests|quota|resource.?exhausted|overloaded|capacity|temporarily unavailable|try again later|429|503/.test(
      message,
    )
  );
}

/** Content / parsing failures should never re-send the same payload to Gemini. */
function isGeminiContentError(error: unknown): boolean {
  if (error instanceof SyntaxError) return true;

  const message = errorMessage(error).toLowerCase();
  return (
    /returned empty output|json parse|invalid json|unexpected token|could not parse|malformed json|chưa đạt chuẩn/.test(
      message,
    )
  );
}

/**
 * Whether a failed Gemini API call should be retried.
 * Only transport / rate-limit errors — never empty output or JSON parse failures.
 */
export function shouldRetryGeminiCall(error: unknown): boolean {
  if (isGeminiContentError(error)) return false;
  return isRetryableGeminiError(error);
}
