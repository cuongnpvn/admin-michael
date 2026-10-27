import { z } from "zod";

export const readingPart5TranslationTextSchema = z.object({
  english: z.string().min(1),
});

export const readingPart5TranslationExportEntrySchema = z.object({
  questionId: z.string().min(1),
  texts: z.array(readingPart5TranslationTextSchema).length(5),
});

export const readingPart5TranslationExportFileSchema = z.array(
  readingPart5TranslationExportEntrySchema,
);

export type ReadingPart5TranslationExportEntry = z.infer<
  typeof readingPart5TranslationExportEntrySchema
>;
