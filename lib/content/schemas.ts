import { contentVocabularyPayloadSchema } from "@/lib/content/content-vocabulary";
import { importQuestionExplanationSchema } from "@/lib/content/question-explanation";
import { z } from "zod";

const optionLabelSchema = z.enum(["A", "B", "C", "D"]);

export const answerOptionDataSchema = z.object({
  id: z.string(),
  label: optionLabelSchema,
  text: z.string(),
  audioUrl: z.string().nullable(),
});

export const questionTranslationEntrySchema = z.object({
  english: z.string(),
  vietnamese: z.string(),
});

export const questionDataSchema = z.object({
  id: z.string(),
  /** Official TOEIC test question number (1–200). */
  globalItemNumber: z.number().int().min(1).max(200),
  prompt: z.string(),
  audioUrl: z.string().nullable().optional(),
  questionStemAudioUrl: z.string().nullable().optional(),
  /** Optional context graphic shown with the question (Parts 3–4). */
  imageUrl: z.string().nullable().optional(),
  options: z.array(answerOptionDataSchema).min(2).max(4),
  correctOptionId: z.string(),
  hint: z.string().nullable().optional(),
  explanation: importQuestionExplanationSchema,
  freeExplanation: z.boolean().optional(),
  explanationLocked: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  translations: z.array(questionTranslationEntrySchema).optional(),
  vocabulary: contentVocabularyPayloadSchema,
  /** Part 6 HTML passage translation (review stacked view). */
  translationHtml: z.string().optional(),
});

export const listeningPart1QuestionDataSchema = questionDataSchema.omit({
  prompt: true,
});

export const listeningPart2QuestionDataSchema = questionDataSchema.omit({
  audioUrl: true,
  questionStemAudioUrl: true,
  imageUrl: true,
});

export const listeningPart1DataSchema = z.object({
  part: z.literal(1),
  title: z.string(),
  items: z.array(
    z.object({
      question: listeningPart1QuestionDataSchema,
      imageUrl: z.string().nullable(),
    }),
  ),
});

export const listeningPart2DataSchema = z.object({
  part: z.literal(2),
  title: z.string(),
  items: z.array(
    z.object({
      question: listeningPart2QuestionDataSchema,
      questionTranscript: z.string(),
      questionTranscriptAudioUrl: z.string().nullable().optional(),
    }),
  ),
});

export const transcriptSegmentSchema = z.object({
  index: z.number().int().nonnegative(),
  english: z.string(),
  startSec: z.number().finite(),
  endSec: z.number().finite(),
});

export const listeningStimulusGroupSchema = z.object({
  id: z.string(),
  topic: z.string().optional(),
  transcript: z.string(),
  vocabulary: contentVocabularyPayloadSchema,
  format: z.enum(["dialogue", "monologue"]).optional(),
  audioUrl: z.string().nullable(),
  stimulusKind: z
    .enum([
      "conversation",
      "announcement",
      "voicemail",
      "radio_ad",
      "report",
      "instructions",
      "tour_talk",
      "other",
    ])
    .optional(),
  freeExplanation: z.boolean().optional(),
  transcriptSegments: z.array(transcriptSegmentSchema).optional(),
  questions: z.array(questionDataSchema),
});

export const listeningPart3DataSchema = z.object({
  part: z.literal(3),
  title: z.string(),
  groups: z.array(listeningStimulusGroupSchema),
});

export const listeningPart4DataSchema = z.object({
  part: z.literal(4),
  title: z.string(),
  groups: z.array(listeningStimulusGroupSchema),
});

export const readingPassageDataSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  translations: z.array(questionTranslationEntrySchema).optional(),
  /** Part 7 HTML passage translation (review stacked view). */
  translationHtml: z.string().optional(),
});

export const readingPassageSetSchema = z.object({
  id: z.string(),
  topic: z.string().optional(),
  vocabulary: contentVocabularyPayloadSchema,
  layout: z.enum(["single", "double", "triple"]),
  contentModel: z.enum(["comprehension", "text_completion_cloze"]).optional(),
  freeExplanation: z.boolean().optional(),
  passages: z.array(readingPassageDataSchema),
  questions: z.array(questionDataSchema),
});

export const readingPart5DataSchema = z.object({
  part: z.literal(5),
  title: z.string(),
  items: z.array(z.object({ question: questionDataSchema })),
});

export const readingPart6DataSchema = z.object({
  part: z.literal(6),
  title: z.string(),
  passageSets: z.array(readingPassageSetSchema),
});

export const readingPart7DataSchema = z.object({
  part: z.literal(7),
  title: z.string(),
  passageSets: z.array(readingPassageSetSchema),
});

export const testMetaSchema = z.object({
  bookId: z.string(),
  testId: z.string(),
  title: z.string(),
  parts: z.array(
    z.object({
      part: z.number().int().min(1).max(7),
      title: z.string(),
      questionCount: z.number().int().nonnegative(),
    }),
  ),
});

export const testImportFileSchema = z.object({
  meta: testMetaSchema,
  listening: z.object({
    part1: listeningPart1DataSchema,
    part2: listeningPart2DataSchema,
    part3: listeningPart3DataSchema,
    part4: listeningPart4DataSchema,
  }),
  reading: z.object({
    part5: readingPart5DataSchema,
    part6: readingPart6DataSchema,
    part7: readingPart7DataSchema,
  }),
});

export type TestImportFile = z.infer<typeof testImportFileSchema>;

export function parseTestImportFile(raw: string): TestImportFile {
  const json: unknown = JSON.parse(raw);
  return testImportFileSchema.parse(json);
}

export function testImportFileToPartArrays(file: TestImportFile) {
  return {
    meta: file.meta,
    listeningParts: [
      file.listening.part1,
      file.listening.part2,
      file.listening.part3,
      file.listening.part4,
    ],
    readingParts: [file.reading.part5, file.reading.part6, file.reading.part7],
  };
}

export const partPayloadSchema = z.union([
  listeningPart1DataSchema,
  listeningPart2DataSchema,
  listeningPart3DataSchema,
  listeningPart4DataSchema,
  readingPart5DataSchema,
  readingPart6DataSchema,
  readingPart7DataSchema,
]);

export function validatePartPayload(part: number, payload: unknown) {
  switch (part) {
    case 1:
      return listeningPart1DataSchema.parse(payload);
    case 2:
      return listeningPart2DataSchema.parse(payload);
    case 3:
      return listeningPart3DataSchema.parse(payload);
    case 4:
      return listeningPart4DataSchema.parse(payload);
    case 5:
      return readingPart5DataSchema.parse(payload);
    case 6:
      return readingPart6DataSchema.parse(payload);
    case 7:
      return readingPart7DataSchema.parse(payload);
    default:
      throw new Error(`Unsupported part: ${part}`);
  }
}
