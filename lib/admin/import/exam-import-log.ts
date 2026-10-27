const IMPORT_PREFIX = "[exam-import]";

export function serializeImportError(error: unknown): Record<string, unknown> {
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
      code: record.code,
      details: record.details,
      hint: record.hint,
      status: record.status ?? record.statusCode,
    };
  }

  return { message: String(error) };
}

export function importLog(
  event: string,
  details: Record<string, unknown> = {},
): void {
  console.log(IMPORT_PREFIX, event, details);
}

export function importError(
  event: string,
  details: Record<string, unknown> = {},
  error?: unknown,
): void {
  if (error !== undefined) {
    console.error(IMPORT_PREFIX, event, {
      ...details,
      error: serializeImportError(error),
    });
    return;
  }

  console.error(IMPORT_PREFIX, event, details);
}

export function formatZodIssues(
  issues: Array<{ path: PropertyKey[]; message: string }>,
  limit = 5,
): Array<{ path: string; message: string }> {
  return issues.slice(0, limit).map((issue) => ({
    path: issue.path.map(String).join("."),
    message: issue.message,
  }));
}
