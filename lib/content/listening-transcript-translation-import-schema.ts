import { z } from "zod";
import { readingImportTranslationSchema } from "@/lib/content/reading-import-schema";

export const listeningTranscriptTranslationExportEntrySchema = z.object({
  questionId: z.string().min(1),
  globalItemNumber: z.number().int().positive().optional(),
  transcript: z.string().min(1),
});

export const listeningTranscriptTranslationQuestionSchema = z.object({
  questionId: z.string().min(1),
  translations: z.array(readingImportTranslationSchema).min(1),
});

export const listeningTranscriptTranslationImportFileSchema = z.union([
  listeningTranscriptTranslationQuestionSchema,
  z.array(listeningTranscriptTranslationQuestionSchema).min(1),
]);

export type ListeningTranscriptTranslationExportEntry = z.infer<
  typeof listeningTranscriptTranslationExportEntrySchema
>;

export type ListeningTranscriptTranslationQuestionImport = z.infer<
  typeof listeningTranscriptTranslationQuestionSchema
>;

export function normalizeListeningTranscriptTranslationImportFile(
  data: z.infer<typeof listeningTranscriptTranslationImportFileSchema>,
): ListeningTranscriptTranslationQuestionImport[] {
  return Array.isArray(data) ? data : [data];
}
