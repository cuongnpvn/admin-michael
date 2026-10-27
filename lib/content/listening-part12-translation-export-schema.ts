import { z } from "zod";

export const listeningPart12TranslationTextSchema = z.object({
  english: z.string().min(1),
});

export const listeningPart12TranslationExportEntrySchema = z.object({
  questionId: z.string().min(1),
  part: z.union([z.literal(1), z.literal(2)]),
  texts: z.array(listeningPart12TranslationTextSchema).min(1),
});

export type ListeningPart12TranslationExportEntry = z.infer<
  typeof listeningPart12TranslationExportEntrySchema
>;

export const listeningPart12TranslationExportFileSchema = z.array(
  listeningPart12TranslationExportEntrySchema,
);
