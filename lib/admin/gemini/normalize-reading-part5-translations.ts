import {
  readingPart5TranslationExportFileSchema,
  type ReadingPart5TranslationExportEntry,
} from "@/lib/content/reading-part5-translation-export-schema";

const BOLD_MARKDOWN_RE = /\*\*[^*]+\*\*/;

export interface ReadingPart5TranslationRow {
  english: string;
  vietnamese: string;
}

export interface ReadingPart5TranslationEntry {
  questionId: string;
  translations: ReadingPart5TranslationRow[];
}

function asTranslationEntries(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (parsed && typeof parsed === "object") {
    const record = parsed as Record<string, unknown>;
    if (Array.isArray(record.questions)) {
      return record.questions;
    }
    if (typeof record.questionId === "string") {
      return [parsed];
    }
  }

  throw new Error(
    "Part 5 translation response must be an array of question entries.",
  );
}

function isAcronymOrProperNoun(english: string): boolean {
  const trimmed = english.trim();
  if (!trimmed) return false;
  // All-caps short tokens / dotted acronyms (CEO, U.S., Wi-Fi-like brands stay rare).
  if (/^[A-Z0-9][A-Z0-9.&/-]{0,11}$/.test(trimmed)) return true;
  return false;
}

function isEnglishEcho(english: string, vietnamese: string): boolean {
  return english.trim().toLowerCase() === vietnamese.trim().toLowerCase();
}

function readVietnamese(row: unknown): string {
  if (!row || typeof row !== "object") {
    return "";
  }
  const vietnamese = (row as { vietnamese?: unknown }).vietnamese;
  return typeof vietnamese === "string" ? vietnamese.trim() : "";
}

/**
 * Stamp `english` from the export and require study-ready Vietnamese on every row.
 * Rows 2–5 must not echo English unless the option is a rare acronym/proper noun.
 */
export function normalizeReadingPart5TranslationsFromExport(
  parsed: unknown,
  exportJson: string,
): ReadingPart5TranslationEntry[] {
  const exportEntries = readingPart5TranslationExportFileSchema.parse(
    JSON.parse(exportJson) as unknown,
  ) as ReadingPart5TranslationExportEntry[];
  const exportById = new Map(
    exportEntries.map((entry) => [entry.questionId, entry] as const),
  );

  const responseEntries = asTranslationEntries(parsed);
  const normalized: ReadingPart5TranslationEntry[] = [];
  const seenIds = new Set<string>();

  for (const responseEntry of responseEntries) {
    if (!responseEntry || typeof responseEntry !== "object") {
      throw new Error("Part 5 translation entry must be an object.");
    }

    const questionId = (responseEntry as { questionId?: unknown }).questionId;
    if (typeof questionId !== "string" || !questionId.trim()) {
      throw new Error("Part 5 translation entry is missing questionId.");
    }
    if (seenIds.has(questionId)) {
      throw new Error(`Duplicate Part 5 translation questionId: ${questionId}`);
    }
    seenIds.add(questionId);

    const exportEntry = exportById.get(questionId);
    if (!exportEntry) {
      throw new Error(
        `Part 5 translation questionId not in export: ${questionId}`,
      );
    }

    const responseTranslations = (responseEntry as { translations?: unknown })
      .translations;
    if (!Array.isArray(responseTranslations)) {
      throw new Error(
        `Part 5 translation for ${questionId} is missing translations[].`,
      );
    }
    if (responseTranslations.length !== exportEntry.texts.length) {
      throw new Error(
        `Part 5 translation for ${questionId} has ${responseTranslations.length} rows; expected ${exportEntry.texts.length}.`,
      );
    }

    const translations: ReadingPart5TranslationRow[] = exportEntry.texts.map(
      (text, index) => {
        const english = text.english;
        const vietnamese = readVietnamese(responseTranslations[index]);
        if (!vietnamese) {
          throw new Error(
            `Part 5 translation for ${questionId} row ${index + 1} has empty vietnamese.`,
          );
        }

        if (index === 0) {
          if (!BOLD_MARKDOWN_RE.test(english) || !BOLD_MARKDOWN_RE.test(vietnamese)) {
            throw new Error(
              `Part 5 translation for ${questionId} row 1 must bold the answer in english and vietnamese.`,
            );
          }
        } else if (
          isEnglishEcho(english, vietnamese) &&
          !isAcronymOrProperNoun(english)
        ) {
          throw new Error(
            `Part 5 option translation for ${questionId} row ${index + 1} echoes English ("${english}"). Provide a Vietnamese gloss.`,
          );
        }

        return { english, vietnamese };
      },
    );

    normalized.push({ questionId, translations });
  }

  for (const exportEntry of exportEntries) {
    if (!seenIds.has(exportEntry.questionId)) {
      throw new Error(
        `Part 5 translation missing export questionId: ${exportEntry.questionId}`,
      );
    }
  }

  return normalized;
}
