import {
  isFullTestImportFileShape,
  isListeningPartsArrayShape,
  isListeningPartsOnlyShape,
  isListeningSinglePartShape,
} from "@/lib/content/import-shape";
import {
  listeningImportFileSchema,
  type ListeningImportFile,
} from "@/lib/content/listening-import-schema";

export interface ListeningImportMeta {
  bookId: string;
  testId: string;
  title?: string;
}

/**
 * Normalize any AI prompt output or legacy shape into the canonical
 * `{ bookId, testId, title, parts[] }` object that `listeningImportFileSchema`
 * expects.
 *
 * Accepted input shapes:
 *  1. Full wrapped object `{ bookId, testId, title, parts }` — meta fields are
 *     overwritten only if explicitly provided (non-undefined) in `meta`.
 *  2. Parts-only object `{ parts: [...] }` without bookId/testId — `meta` values
 *     are injected; original `title` (if present in the object) is used as
 *     fallback when `meta.title` is undefined.
 *  3. Raw parts array `[Part1, Part2]` — `meta` values are injected.
 *  4. Single part object `{ part: 3, title, groups }` — wrapped as one-element `parts`.
 *  5. Full-test shape `{ meta, listening, reading }` — returned unchanged.
 *
 * When `meta.title` is `undefined`, an existing `title` field in the JSON is
 * preserved.  Pass an explicit `""` only when you intentionally want to clear it.
 */
export function normalizeListeningImportJson(
  json: unknown,
  meta?: Partial<ListeningImportMeta>,
): unknown {
  // Full-test shape — not a section import; return as-is
  if (isFullTestImportFileShape(json)) {
    return json;
  }

  // Single part object from listening-part-3.md / listening-part-4.md
  if (isListeningSinglePartShape(json)) {
    return {
      bookId: meta?.bookId ?? "",
      testId: meta?.testId ?? "",
      title: meta?.title ?? "",
      parts: [json],
    };
  }

  // Raw array [Part1, Part2] from listening_1_2_prompt.md
  if (isListeningPartsArrayShape(json)) {
    return {
      bookId: meta?.bookId ?? "",
      testId: meta?.testId ?? "",
      title: meta?.title ?? "",
      parts: json,
    };
  }

  // { parts: [...] } without bookId/testId from listening_prompt.md
  if (isListeningPartsOnlyShape(json)) {
    const record = json as { parts: unknown[]; title?: string };
    return {
      bookId: meta?.bookId ?? "",
      testId: meta?.testId ?? "",
      // Prefer meta.title; fall back to any title in the original object
      title: meta?.title ?? record.title ?? "",
      parts: record.parts,
    };
  }

  // Already-wrapped object — overwrite only explicitly provided meta fields
  if (json && typeof json === "object" && !Array.isArray(json) && meta) {
    const record = json as Record<string, unknown>;
    return {
      ...record,
      ...(meta.bookId !== undefined ? { bookId: meta.bookId } : {}),
      ...(meta.testId !== undefined ? { testId: meta.testId } : {}),
      ...(meta.title !== undefined ? { title: meta.title } : {}),
    };
  }

  return json;
}

export function parseListeningImportFile(raw: string): ListeningImportFile {
  const json: unknown = JSON.parse(raw);
  return listeningImportFileSchema.parse(normalizeListeningImportJson(json));
}

export function parseListeningImportFileWithMeta(
  raw: string,
  meta: ListeningImportMeta,
): ListeningImportFile {
  const json: unknown = JSON.parse(raw);
  return listeningImportFileSchema.parse(normalizeListeningImportJson(json, meta));
}
