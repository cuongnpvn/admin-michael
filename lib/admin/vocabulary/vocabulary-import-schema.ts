import { z } from "zod";
import {
  parseVocabularyCefrLevel,
  type VocabularyCefrLevel,
} from "@/lib/vocabulary/cefr-level";

export interface VocabularyImportWord {
  term: string;
  lemma: string | null;
  meaningVi: string | null;
  definitionEn: string | null;
  ipaUs: string | null;
  ipaUk: string | null;
  wordTypes: string[];
  synonyms: string[];
  collocations: string[];
  example: string | null;
  level: VocabularyCefrLevel | null;
}

const ipaNestedSchema = z.object({
  us: z.string().optional(),
  uk: z.string().optional(),
});

const vocabularyWordObjectSchema = z.object({
  term: z.string().min(1),
  lemma: z.string().optional(),
  meaningVi: z.string().optional(),
  definitionEn: z.string().optional(),
  ipaUs: z.string().optional(),
  ipaUk: z.string().optional(),
  ipa: ipaNestedSchema.optional(),
  wordTypes: z.array(z.string()).optional(),
  synonyms: z.array(z.string()).optional(),
  collocations: z.array(z.string()).optional(),
  example: z.string().optional(),
  level: z.string().optional(),
});

const vocabularyWordEntrySchema = z.union([
  z.string(),
  vocabularyWordObjectSchema,
]);

function normalizeIpa(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed;
}

function resolveIpaFields(entry: z.infer<typeof vocabularyWordObjectSchema>): {
  ipaUs: string | null;
  ipaUk: string | null;
} {
  const ipaUs =
    normalizeIpa(entry.ipaUs) ?? normalizeIpa(entry.ipa?.us) ?? null;
  const ipaUk =
    normalizeIpa(entry.ipaUk) ?? normalizeIpa(entry.ipa?.uk) ?? null;

  return { ipaUs, ipaUk };
}

function normalizeWordEntry(
  entry: z.infer<typeof vocabularyWordEntrySchema>,
): VocabularyImportWord {
  if (typeof entry === "string") {
    const term = entry.trim();
    return {
      term,
      lemma: null,
      meaningVi: null,
      definitionEn: null,
      ipaUs: null,
      ipaUk: null,
      wordTypes: [],
      synonyms: [],
      collocations: [],
      example: null,
      level: null,
    };
  }

  const term = entry.term.trim();
  const { ipaUs, ipaUk } = resolveIpaFields(entry);

  return {
    term,
    lemma: entry.lemma?.trim() || null,
    meaningVi: entry.meaningVi?.trim() || null,
    definitionEn: entry.definitionEn?.trim() || null,
    ipaUs,
    ipaUk,
    wordTypes: (entry.wordTypes ?? [])
      .map((value) => value.trim())
      .filter(Boolean),
    synonyms: (entry.synonyms ?? [])
      .map((value) => value.trim())
      .filter(Boolean),
    collocations: (entry.collocations ?? [])
      .map((value) => value.trim())
      .filter(Boolean),
    example: entry.example?.trim() || null,
    level: parseVocabularyCefrLevel(entry.level),
  };
}

export function normalizeWordEntries(
  entries: z.infer<typeof vocabularyWordEntrySchema>[],
): VocabularyImportWord[] {
  const seen = new Set<string>();
  const result: VocabularyImportWord[] = [];

  for (const entry of entries) {
    const normalized = normalizeWordEntry(entry);
    if (!normalized.term) continue;
    const key = normalized.term.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }

  return result;
}

const deckImportSchema = z.object({
  name: z.string().min(1).optional(),
  words: z.array(vocabularyWordEntrySchema).min(1),
});

export type VocabularyImportFile = {
  name: string;
  words: VocabularyImportWord[];
};

export function validateVocabularyImportFile(file: VocabularyImportFile): void {
  if (file.words.length === 0) {
    throw new Error("At least one vocabulary term is required");
  }
}

export function parseVocabularyImportFile(
  raw: string,
  fallbackName?: string,
): VocabularyImportFile {
  const json: unknown = JSON.parse(raw);

  const result = deckImportSchema.safeParse(json);
  if (!result.success) {
    throw result.error;
  }

  const name = result.data.name?.trim() || fallbackName?.trim() || "";
  if (!name) {
    throw new Error("Deck name is required in JSON or admin form");
  }

  const words = normalizeWordEntries(result.data.words);
  if (words.length === 0) {
    throw new Error("At least one vocabulary term is required");
  }

  return { name, words };
}
