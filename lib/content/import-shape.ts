/** Detects which admin JSON import format a parsed object uses. */

export type SectionImportKind = "listening" | "reading" | "mixed" | "unknown";

export function isListeningPartEntry(entry: unknown): entry is { part: number } {
  if (!entry || typeof entry !== "object") return false;
  const part = (entry as { part?: unknown }).part;
  return typeof part === "number" && part >= 1 && part <= 4;
}

/** Single part object `{ part: 3, title, groups }` from per-part PDF prompts. */
export function isListeningSinglePartShape(json: unknown): boolean {
  if (!json || typeof json !== "object" || Array.isArray(json)) return false;
  const record = json as Record<string, unknown>;
  if (isFullTestImportFileShape(json)) return false;
  if ("parts" in record) return false;
  if (typeof record.bookId === "string" && typeof record.testId === "string") {
    return false;
  }
  return isListeningPartEntry(json);
}

/** Raw parts array from AI prompts, e.g. `[{ part: 1, ... }, { part: 2, ... }]`. */
export function isListeningPartsArrayShape(json: unknown): boolean {
  if (!Array.isArray(json) || json.length === 0) return false;
  return json.every(isListeningPartEntry);
}

/** `{ parts: [...] }` without top-level bookId/testId (common AI output). */
export function isListeningPartsOnlyShape(json: unknown): boolean {
  if (!json || typeof json !== "object" || Array.isArray(json)) return false;
  const record = json as Record<string, unknown>;
  if (isFullTestImportFileShape(json)) return false;
  if (!Array.isArray(record.parts) || record.parts.length === 0) return false;
  if (typeof record.bookId === "string" && typeof record.testId === "string") {
    return false;
  }
  return record.parts.every(isListeningPartEntry);
}

export function isFullTestImportFileShape(json: unknown): boolean {
  if (!json || typeof json !== "object") return false;
  const record = json as Record<string, unknown>;
  return (
    "meta" in record &&
    typeof record.meta === "object" &&
    record.meta !== null &&
    "listening" in record &&
    "reading" in record
  );
}

export function sectionImportPartNumbers(json: unknown): number[] | null {
  if (!json || typeof json !== "object") return null;
  const record = json as Record<string, unknown>;
  if (
    typeof record.bookId !== "string" ||
    typeof record.testId !== "string" ||
    !Array.isArray(record.parts)
  ) {
    return null;
  }
  if (isFullTestImportFileShape(json)) return null;

  const numbers: number[] = [];
  for (const entry of record.parts) {
    if (!entry || typeof entry !== "object") return null;
    const part = (entry as { part?: unknown }).part;
    if (typeof part !== "number") return null;
    numbers.push(part);
  }
  return numbers;
}

export function listeningPartNumbersFromJson(json: unknown): number[] | null {
  if (isListeningSinglePartShape(json)) {
    return [(json as { part: number }).part];
  }
  if (isListeningPartsArrayShape(json)) {
    return (json as { part: number }[]).map((entry) => entry.part);
  }
  if (isListeningPartsOnlyShape(json)) {
    const record = json as { parts: { part: number }[] };
    return record.parts.map((part) => part.part);
  }
  return sectionImportPartNumbers(json);
}

export function classifySectionImport(json: unknown): SectionImportKind {
  const parts = listeningPartNumbersFromJson(json);
  if (!parts || parts.length === 0) return "unknown";

  const hasListening = parts.some((part) => part >= 1 && part <= 4);
  const hasReading = parts.some((part) => part >= 5 && part <= 7);

  if (hasListening && hasReading) return "mixed";
  if (hasListening) return "listening";
  if (hasReading) return "reading";
  return "unknown";
}

export function isListeningSectionImportShape(json: unknown): boolean {
  if (classifySectionImport(json) === "listening") return true;
  return (
    isListeningSinglePartShape(json) ||
    isListeningPartsArrayShape(json) ||
    isListeningPartsOnlyShape(json)
  );
}

export function isReadingSectionImportShape(json: unknown): boolean {
  return classifySectionImport(json) === "reading";
}
