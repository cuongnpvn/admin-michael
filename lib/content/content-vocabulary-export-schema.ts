import { z } from "zod";
import { contentVocabularySchema } from "@/lib/content/content-vocabulary";

export type ContentVocabularyPart = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const optionSchema = z.object({
  label: z.string(),
  text: z.string(),
});

const questionExportSchema = z.object({
  questionId: z.string().min(1),
  globalItemNumber: z.number().int().optional(),
  prompt: z.string().optional(),
  options: z.array(optionSchema).optional(),
  correctOptionLabel: z.string().optional(),
});

/** Export unit sent to Gemini for content-vocabulary extract. */
export const contentVocabularyExportUnitSchema = z.object({
  part: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
    z.literal(7),
  ]),
  questionId: z.string().min(1),
  groupId: z.string().optional(),
  globalItemNumber: z.number().int().optional(),
  prompt: z.string().optional(),
  transcript: z.string().optional(),
  options: z.array(optionSchema).optional(),
  correctOptionLabel: z.string().optional(),
  passages: z
    .array(
      z.object({
        title: z.string(),
        content: z.string(),
      }),
    )
    .optional(),
  questions: z.array(questionExportSchema).optional(),
});

export type ContentVocabularyExportUnit = z.infer<
  typeof contentVocabularyExportUnitSchema
>;

/** Gemini / import unit — join keys + vocabulary[]. */
export const contentVocabularyImportUnitSchema = z.object({
  questionId: z.string().min(1),
  groupId: z.string().optional(),
  vocabulary: contentVocabularySchema,
});

export type ContentVocabularyImportUnit = z.infer<
  typeof contentVocabularyImportUnitSchema
>;

export const contentVocabularyImportFileSchema = z.union([
  z.array(contentVocabularyImportUnitSchema),
  z.object({
    units: z.array(contentVocabularyImportUnitSchema),
  }),
]);

export function normalizeContentVocabularyImportFile(
  parsed: z.infer<typeof contentVocabularyImportFileSchema>,
): ContentVocabularyImportUnit[] {
  return Array.isArray(parsed) ? parsed : parsed.units;
}
