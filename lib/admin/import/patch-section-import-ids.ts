import { normalizeListeningImportJson } from "@/lib/content/parse-listening-import-file";

/**
 * Inject or overwrite `bookId`, `testId`, and optionally `title` into any
 * listening or reading import JSON.  Handles all AI output shapes:
 *   - raw parts array  `[Part1, Part2]`           (listening_1_2_prompt.md)
 *   - parts-only object `{ parts: [...] }`         (listening_prompt.md)
 *   - already-wrapped object `{ bookId, ... }`     (overwrite with form values)
 *
 * When `title` is omitted (undefined), an existing title in the JSON is
 * preserved — this is the correct behaviour for reading JSON which already
 * carries its own title.
 */
export function patchSectionImportIds(
  raw: string,
  bookId: string,
  testId: string,
  title?: string,
): string {
  const json: unknown = JSON.parse(raw);
  return JSON.stringify(
    normalizeListeningImportJson(json, { bookId, testId, title }),
  );
}

/** Alias — same behaviour as `patchSectionImportIds`, kept for call-site clarity. */
export const wrapListeningSectionImport = patchSectionImportIds;
