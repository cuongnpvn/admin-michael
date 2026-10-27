import { contentVocabularySchema } from "@/lib/content/content-vocabulary";
import { importQuestionExplanationSchema } from "@/lib/content/question-explanation";
import { z } from "zod";

export const listeningPart3ProcessExportQuestionSchema = z.object({
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

export const listeningPart3ProcessExportGroupSchema = z.object({
  questionId: z.string().min(1),
  globalItemNumber: z.number().int().positive().optional(),
  transcript: z.string().min(1),
  questions: z.array(listeningPart3ProcessExportQuestionSchema).min(1),
});

export type ListeningPart3ProcessExportGroup = z.infer<
  typeof listeningPart3ProcessExportGroupSchema
>;

export const listeningPart3ProcessImportQuestionSchema = z.object({
  questionId: z.string().min(1),
  correctOptionLabel: z.enum(["A", "B", "C", "D"]),
  hint: z.string().min(1),
  explanation: importQuestionExplanationSchema,
  skills: z.array(z.string()).min(1).max(3),
  focus: z.string().min(1),
  topic: z.string().optional(),
});

export const listeningPart3ProcessImportGroupSchema = z.object({
  questionId: z.string().min(1),
  topic: z.string().min(1),
  vocabulary: contentVocabularySchema,
  questions: z.array(listeningPart3ProcessImportQuestionSchema).min(1),
});

export type ListeningPart3ProcessImportGroup = z.infer<
  typeof listeningPart3ProcessImportGroupSchema
>;
export type ListeningPart3ProcessImportQuestion = z.infer<
  typeof listeningPart3ProcessImportQuestionSchema
>;

export const listeningPart3ProcessImportFileSchema = z.union([
  listeningPart3ProcessImportGroupSchema,
  z.array(listeningPart3ProcessImportGroupSchema).min(1),
]);

export function normalizeListeningPart3ProcessImportFile(
  data: z.infer<typeof listeningPart3ProcessImportFileSchema>,
): ListeningPart3ProcessImportGroup[] {
  return Array.isArray(data) ? data : [data];
}
