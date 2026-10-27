import { contentVocabularySchema } from "@/lib/content/content-vocabulary";
import { importQuestionExplanationSchema } from "@/lib/content/question-explanation";
import {
  importQuestionTagsSchema,
  optionalQuestionTagsSchema,
} from "@/lib/content/question-tags-schema";
import {
  type ImportOption,
  type ImportOptionLabel,
  normalizeImportOptionLabel,
  preprocessImportOption,
  withImportQuestionNormalization,
} from "@/lib/content/resolve-correct-option-label";
import { z } from "zod";
import { isReadingSectionImportShape } from "@/lib/content/import-shape";

const optionLabelSchema = z.enum(["A", "B", "C", "D"]);

const importOptionLabelSchema = z.preprocess(
  (value) => normalizeImportOptionLabel(value),
  optionLabelSchema.optional(),
);

const readingImportOptionInnerSchema = z.object({
  label: optionLabelSchema,
  text: z.string(),
});

export const readingImportOptionSchema = z.preprocess(
  preprocessImportOption,
  readingImportOptionInnerSchema,
);

export const readingImportTranslationSchema = z.object({
  english: z.string(),
  vietnamese: z.string(),
});

const readingImportQuestionBaseInnerSchema = z.object({
  /** Official TOEIC test question number (1–200). Ground truth from PDF. */
  globalItemNumber: z.number().int().min(1).max(200),
  prompt: z.string(),
  options: z.array(readingImportOptionSchema).min(2).max(4),
  hint: z.string().optional(),
  explanation: importQuestionExplanationSchema,
  tags: importQuestionTagsSchema,
  correctOptionLabel: importOptionLabelSchema,
  /** Part 5: curated vocab on the question. Parts 6–7 store set-level vocab instead. */
  vocabulary: contentVocabularySchema,
});

const readingImportPassageQuestionInnerSchema =
  readingImportQuestionBaseInnerSchema.extend({
    tags: optionalQuestionTagsSchema,
    translations: z.array(readingImportTranslationSchema).optional().default([]),
  });

export const readingImportPart5QuestionSchema = withImportQuestionNormalization(
  readingImportQuestionBaseInnerSchema,
);

/** Parts 6–7: tags optional at import (can be added later in CMS). */
export const readingImportPassageQuestionSchema = withImportQuestionNormalization(
  readingImportPassageQuestionInnerSchema,
);

/** @deprecated Use readingImportPart5QuestionSchema or readingImportPassageQuestionSchema */
export const readingImportQuestionSchema = readingImportPart5QuestionSchema;

export const readingImportPassageSchema = z.object({
  title: z.string(),
  content: z.string(),
});

export const readingImportPassageSetSchema = z.object({
  id: z.string().optional(),
  /** Short topic label for practice catalog cards (not the formal PDF header). */
  topic: z.string().optional(),
  vocabulary: contentVocabularySchema,
  passages: z.array(readingImportPassageSchema).min(1),
  questions: z.array(readingImportPassageQuestionSchema).min(1),
});

export const readingImportPart5Schema = z.object({
  part: z.literal(5),
  title: z.string(),
  questions: z.array(readingImportPart5QuestionSchema).min(1),
});

export const readingImportPart6Schema = z.object({
  part: z.literal(6),
  title: z.string(),
  passageSets: z.array(readingImportPassageSetSchema).min(1),
});

export const readingImportPart7Schema = z.object({
  part: z.literal(7),
  title: z.string(),
  passageSets: z.array(readingImportPassageSetSchema).min(1),
});

export const readingImportPartSchema = z.discriminatedUnion("part", [
  readingImportPart5Schema,
  readingImportPart6Schema,
  readingImportPart7Schema,
]);

export const readingImportFileSchema = z
  .object({
    bookId: z.string().min(1),
    testId: z.string().min(1),
    title: z.string().min(1),
    parts: z.array(readingImportPartSchema).min(1),
  })
  .refine(
    (file) => file.parts.every((part) => part.part >= 5 && part.part <= 7),
    { message: "Reading import only allows parts 5–7" },
  );

export type ReadingImportFile = z.infer<typeof readingImportFileSchema>;

type ReadingImportQuestionBase = Omit<
  z.infer<typeof readingImportQuestionBaseInnerSchema>,
  "options" | "correctOptionLabel"
> & {
  options: ImportOption[];
  correctOptionLabel?: ImportOptionLabel;
};

export type ReadingImportPart5Question = ReadingImportQuestionBase;
export type ReadingImportPassageQuestion = Omit<
  z.infer<typeof readingImportPassageQuestionInnerSchema>,
  "options" | "correctOptionLabel"
> & {
  options: ImportOption[];
  correctOptionLabel?: ImportOptionLabel;
};
export type ReadingImportQuestion = ReadingImportPart5Question;
export type ReadingImportTranslation = z.infer<
  typeof readingImportTranslationSchema
>;
export type ReadingImportPart = z.infer<typeof readingImportPartSchema>;

export { parseReadingImportFile } from "@/lib/content/parse-reading-import-file";

/** @deprecated Use isReadingSectionImportShape from import-shape.ts */
export function isReadingImportFileShape(json: unknown): boolean {
  return isReadingSectionImportShape(json);
}
