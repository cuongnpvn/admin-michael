import { z } from "zod";
import {
  VOCABULARY_CEFR_LEVELS,
  type VocabularyCefrLevel,
} from "@/lib/vocabulary/cefr-level";

export const CONTENT_VOCABULARY_LEVELS = VOCABULARY_CEFR_LEVELS;

export type ContentVocabularyLevel = VocabularyCefrLevel;

export interface ContentVocabularyWord {
  term: string;
  definitionEn: string;
  meaningVi: string;
  level: ContentVocabularyLevel;
  wordType: string;
  /** US IPA first, then UK. */
  ipa: [string, string];
  /** Short example sentence rephrasing the source reference, same word form. */
  example: string;
}

const contentVocabularyLevelSchema = z.enum(CONTENT_VOCABULARY_LEVELS);

const ipaNestedSchema = z.object({
  us: z.string().optional(),
  uk: z.string().optional(),
});

const contentVocabularyWordObjectSchema = z.object({
  term: z.string().min(1),
  definitionEn: z.string().optional(),
  meaningVi: z.string().optional(),
  level: contentVocabularyLevelSchema.optional(),
  wordType: z.string().optional(),
  wordTypes: z.array(z.string()).optional(),
  ipa: z.union([z.array(z.string()), ipaNestedSchema]).optional(),
  ipaUs: z.string().optional(),
  ipaUk: z.string().optional(),
  example: z.string().optional(),
});

function trimOrEmpty(value: string | undefined): string {
  return value?.trim() ?? "";
}

function resolveIpa(
  entry: z.infer<typeof contentVocabularyWordObjectSchema>,
): [string, string] {
  if (Array.isArray(entry.ipa)) {
    const us = trimOrEmpty(entry.ipa[0]);
    const uk = trimOrEmpty(entry.ipa[1] ?? entry.ipa[0]);
    return [us, uk];
  }

  if (entry.ipa && typeof entry.ipa === "object") {
    return [
      trimOrEmpty(entry.ipa.us) || trimOrEmpty(entry.ipaUs),
      trimOrEmpty(entry.ipa.uk) || trimOrEmpty(entry.ipaUk),
    ];
  }

  return [trimOrEmpty(entry.ipaUs), trimOrEmpty(entry.ipaUk)];
}

function resolveWordType(
  entry: z.infer<typeof contentVocabularyWordObjectSchema>,
): string {
  const direct = trimOrEmpty(entry.wordType);
  if (direct) return direct;
  const fromArray = entry.wordTypes?.map((value) => value.trim()).find(Boolean);
  return fromArray ?? "";
}

export function normalizeContentVocabularyWord(
  entry: z.infer<typeof contentVocabularyWordObjectSchema>,
): ContentVocabularyWord | null {
  const term = entry.term.trim();
  if (!term) return null;

  const level = entry.level ?? "B1";
  const ipa = resolveIpa(entry);

  return {
    term,
    definitionEn: trimOrEmpty(entry.definitionEn),
    meaningVi: trimOrEmpty(entry.meaningVi),
    level,
    wordType: resolveWordType(entry),
    ipa,
    example: trimOrEmpty(entry.example),
  };
}

export function normalizeContentVocabulary(
  entries: unknown,
): ContentVocabularyWord[] {
  if (!Array.isArray(entries)) return [];

  const seen = new Set<string>();
  const result: ContentVocabularyWord[] = [];

  for (const raw of entries) {
    const parsed = contentVocabularyWordObjectSchema.safeParse(raw);
    if (!parsed.success) continue;
    const word = normalizeContentVocabularyWord(parsed.data);
    if (!word) continue;
    const key = word.term.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(word);
  }

  return result;
}

/** Import Zod: optional array, defaults to [] when missing. */
export const contentVocabularySchema = z.preprocess(
  (value) => (value == null ? [] : value),
  z.array(z.unknown()).transform((entries) => normalizeContentVocabulary(entries)),
);

/** Published / CMS payloads — omit when empty at compile time. */
export const contentVocabularyPayloadSchema = z
  .array(
    z.object({
      term: z.string().min(1),
      definitionEn: z.string(),
      meaningVi: z.string(),
      level: contentVocabularyLevelSchema,
      wordType: z.string(),
      ipa: z.tuple([z.string(), z.string()]),
      /** Optional for legacy published payloads; new extracts always include it. */
      example: z.string().optional().default(""),
    }),
  )
  .optional();

export type ContentVocabulary = ContentVocabularyWord[];
