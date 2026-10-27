import { z } from "zod";
import { contentVocabularySchema } from "@/lib/content/content-vocabulary";
import { importQuestionExplanationSchema } from "@/lib/content/question-explanation";
import { readingImportTranslationSchema } from "@/lib/content/reading-import-schema";

export const passageTranslationClozeAnswerSchema = z.object({
  globalItemNumber: z.number().int().positive(),
  answer: z.string().min(1),
});

const translationRowSchema = readingImportTranslationSchema;

export const passageTranslationPassageExportSchema = z.object({
  passageSlug: z.string().min(1).optional(),
  title: z.string(),
  content: z.string(),
});

export const passageTranslationPassageSchema = z.object({
  title: z.string(),
  content: z.string(),
});

/** Part 7 export: each passage includes slug for translation binding. */
export const part7PassageTranslationExportPassageSchema = z.object({
  passageSlug: z.string().min(1),
  title: z.string(),
  content: z.string(),
});

export const part7PassageTranslationImportPassageSchema = z.object({
  passageSlug: z.string().min(1),
  passageTranslation: z.string().min(1).optional(),
  translations: z.array(translationRowSchema).min(1),
});

/** Part 7 process export — questions for solve/enrich step. */
export const part7ProcessExportQuestionSchema = z.object({
  questionId: z.string().min(1),
  globalItemNumber: z.number().int().positive(),
  prompt: z.string(),
  options: z
    .array(
      z.object({
        label: z.enum(["A", "B", "C", "D"]),
        text: z.string(),
      }),
    )
    .length(4),
});

/** Part 7 process import — solved answer + study fields per question. */
export const part7ProcessImportQuestionSchema = z.object({
  questionId: z.string().min(1),
  correctOptionLabel: z.enum(["A", "B", "C", "D"]),
  hint: z.string().min(1),
  explanation: importQuestionExplanationSchema,
  skills: z.array(z.string()).min(1).max(3).optional(),
  focus: z.string().min(1).optional(),
  topic: z.string().optional(),
});

export const part7PassageTranslationImportSetSchema = z.object({
  questionId: z.string().min(1),
  topic: z.string().min(1).optional(),
  vocabulary: contentVocabularySchema,
  passages: z.array(part7PassageTranslationImportPassageSchema).min(1),
  questions: z.array(part7ProcessImportQuestionSchema).optional(),
});

/** Strict Part 7 process import — all enrichment fields required. */
export const part7ProcessImportPassageSchema = z.object({
  passageSlug: z.string().min(1),
  passageTranslation: z.string().min(1),
  translations: z.array(translationRowSchema).min(1),
});

export const part7ProcessImportSetSchema = z.object({
  questionId: z.string().min(1),
  topic: z.string().min(1),
  vocabulary: contentVocabularySchema,
  passages: z.array(part7ProcessImportPassageSchema).min(1),
  questions: z.array(part7ProcessImportQuestionSchema).min(1),
});

const passageTranslationQuestionInnerSchema = z.object({
  questionId: z.string().min(1),
  passageTranslation: z.string().min(1).optional(),
  translations: z.array(translationRowSchema).min(1),
});

function flattenPassageTranslations(
  passageTranslations: unknown,
): z.infer<typeof translationRowSchema>[] {
  if (!Array.isArray(passageTranslations)) {
    return [];
  }

  return passageTranslations.flatMap((block) => {
    if (!block || typeof block !== "object") {
      return [];
    }

    const translations = (block as { translations?: unknown }).translations;
    if (!Array.isArray(translations)) {
      return [];
    }

    return translations.filter(
      (row): row is z.infer<typeof translationRowSchema> =>
        !!row &&
        typeof row === "object" &&
        typeof (row as { english?: unknown }).english === "string" &&
        typeof (row as { vietnamese?: unknown }).vietnamese === "string",
    );
  });
}

function isPart7SlugKeyedImportEntry(value: unknown): value is {
  questionId: string;
  passages: Array<{ passageSlug: string; translations: unknown[] }>;
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const passages = (value as { passages?: unknown }).passages;
  if (!Array.isArray(passages) || passages.length === 0) {
    return false;
  }

  return passages.every(
    (passage) =>
      !!passage &&
      typeof passage === "object" &&
      typeof (passage as { passageSlug?: unknown }).passageSlug === "string" &&
      Array.isArray((passage as { translations?: unknown }).translations),
  );
}

/** Legacy Part 6 / listening: flatten `passageTranslations[]` → flat `translations[]`. */
export function preprocessPassageTranslationQuestion(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  if (isPart7SlugKeyedImportEntry(value)) {
    return value;
  }

  const entry = { ...(value as Record<string, unknown>) };
  const flatTranslations = flattenPassageTranslations(entry.passageTranslations);
  const existingTranslations = Array.isArray(entry.translations)
    ? entry.translations
    : [];

  if (flatTranslations.length > 0 && existingTranslations.length === 0) {
    entry.translations = flatTranslations;
  }

  delete entry.passageTranslations;
  return entry;
}

export function preprocessPassageTranslationImportData(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data.map(preprocessPassageTranslationQuestion);
  }

  return preprocessPassageTranslationQuestion(data);
}

export const passageTranslationQuestionSchema = z.preprocess(
  preprocessPassageTranslationQuestion,
  passageTranslationQuestionInnerSchema,
);

export const passageTranslationExportEntrySchema = z.object({
  questionId: z.string().min(1),
  globalItemNumber: z.number().int().positive().optional(),
  passages: z.array(passageTranslationPassageExportSchema).min(1),
  clozeAnswers: z.array(passageTranslationClozeAnswerSchema).optional(),
  filledPassages: z.array(passageTranslationPassageSchema).optional(),
  /** Part 7 process export — all questions in the set for solve/enrich. */
  questions: z.array(part7ProcessExportQuestionSchema).optional(),
});

export const passageTranslationImportFileSchema = z.preprocess(
  preprocessPassageTranslationImportData,
  z.union([
    passageTranslationQuestionInnerSchema,
    z.array(passageTranslationQuestionInnerSchema).min(1),
  ]),
);

export const part7PassageTranslationImportFileSchema = z.union([
  part7PassageTranslationImportSetSchema,
  z.array(part7PassageTranslationImportSetSchema).min(1),
]);

export type PassageTranslationQuestionImport = z.infer<
  typeof passageTranslationQuestionInnerSchema
>;

export type Part7PassageTranslationImportSet = z.infer<
  typeof part7PassageTranslationImportSetSchema
>;

export type Part7ProcessImportQuestion = z.infer<
  typeof part7ProcessImportQuestionSchema
>;

export type PassageTranslationExportEntry = z.infer<
  typeof passageTranslationExportEntrySchema
>;

export function normalizePassageTranslationImportFile(
  data: z.infer<typeof passageTranslationImportFileSchema>,
): PassageTranslationQuestionImport[] {
  return Array.isArray(data) ? data : [data];
}

export function normalizePart7PassageTranslationImportFile(
  data: z.infer<typeof part7PassageTranslationImportFileSchema>,
): Part7PassageTranslationImportSet[] {
  return Array.isArray(data) ? data : [data];
}

export function isPart7PassageTranslationImportPayload(
  data: unknown,
): data is z.infer<typeof part7PassageTranslationImportFileSchema> {
  const entries = Array.isArray(data) ? data : [data];
  return entries.every((entry) => isPart7SlugKeyedImportEntry(entry));
}

export function isPart7ProcessImportSet(
  entry: Part7PassageTranslationImportSet,
): boolean {
  return Array.isArray(entry.questions) && entry.questions.length > 0;
}

/** Reject Part 7 process payloads missing required enrichment before import. */
export function assertPart7ProcessImportSets(
  entries: Part7PassageTranslationImportSet[],
): void {
  for (const entry of entries) {
    if (!isPart7ProcessImportSet(entry)) {
      continue;
    }
    part7ProcessImportSetSchema.parse(entry);
  }
}

/** Legacy flat import row for Part 7 (anchor question + merged translations). */
export type LegacyPart7PassageTranslationImport = PassageTranslationQuestionImport;
