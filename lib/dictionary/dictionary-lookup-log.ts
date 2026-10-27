const LOG_PREFIX = "[dictionary-lookup]";

function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack?.split("\n").slice(0, 4).join("\n"),
    };
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    return {
      message:
        typeof record.message === "string" ? record.message : String(error),
      status: record.status ?? record.statusCode ?? record.code,
    };
  }

  return { message: String(error) };
}

export function dictionaryLookupLog(
  event: string,
  details: Record<string, unknown> = {},
): void {
  console.log(LOG_PREFIX, event, details);
}

export function dictionaryLookupError(
  event: string,
  details: Record<string, unknown> = {},
  error?: unknown,
): void {
  if (error !== undefined) {
    console.error(LOG_PREFIX, event, {
      ...details,
      error: serializeError(error),
    });
    return;
  }

  console.error(LOG_PREFIX, event, details);
}

export function elapsedMs(startMs: number): number {
  return Math.round(performance.now() - startMs);
}

export function previewText(text: string, max = 240): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max)}…`;
}
