import { contentVocabularySchema } from "@/lib/content/content-vocabulary";
import {
  normalizeListeningPart1QuestionTags,
  normalizeListeningPart2QuestionTags,
} from "@/lib/content/normalize-listening-part12-tags";
import { importQuestionExplanationSchema } from "@/lib/content/question-explanation";
import { readingImportTranslationSchema } from "@/lib/content/reading-import-schema";
import {
  countListeningPartGroupsAndQuestions,
  countListeningPartItems,
  LISTENING_PART12_OFFICIAL_SPEC,
  LISTENING_PART_OFFICIAL_SPEC,
  listeningPart12ImportCountError,
  listeningPartImportCountError,
} from "@/lib/content/listening-part-specs";
import {
  importQuestionTagsSchema,
  listeningPart1QuestionTagsSchema,
  listeningPart2QuestionTagsSchema,
} from "@/lib/content/question-tags-schema";
import {
  type ImportOption,
  type ImportOptionLabel,
  normalizeImportOptionLabel,
  preprocessImportOption,
  withImportQuestionNormalization,
} from "@/lib/content/resolve-correct-option-label";
import { z } from "zod";

const optionLabelSchema = z.enum(["A", "B", "C", "D"]);

const importOptionLabelSchema = z.preprocess(
  (value) => normalizeImportOptionLabel(value),
  optionLabelSchema.optional(),
);

const listeningImportOptionInnerSchema = z.object({
  label: optionLabelSchema,
  text: z.string(),
});

export const listeningImportOptionSchema = z.preprocess(
  preprocessImportOption,
  listeningImportOptionInnerSchema,
);

const listeningImportQuestionInnerSchema = z.object({
  /** Official TOEIC test question number (1–200). Ground truth from PDF. */
  globalItemNumber: z.number().int().min(1).max(200),
  prompt: z.string(),
  /** Optional context graphic for this question (Parts 3–4). Storage path or public URL. */
  imageUrl: z.string().nullable().optional(),
  options: z.array(listeningImportOptionSchema).min(2).max(4),
  hint: z.string().optional(),
  explanation: importQuestionExplanationSchema,
  tags: z.array(z.string()).optional(),
  correctOptionLabel: importOptionLabelSchema,
  /** P1–2: curated vocab on the question. P3–4 usually empty (vocab lives on the group). */
  vocabulary: contentVocabularySchema,
});

export const listeningImportQuestionSchema = withImportQuestionNormalization(
  listeningImportQuestionInnerSchema,
);

const listeningImportTaggedQuestionInnerSchema =
  listeningImportQuestionInnerSchema.extend({
    tags: importQuestionTagsSchema,
  });

/** Parts 3–4: topic + skill + focus required (min 3 tags). */
export const listeningImportTaggedQuestionSchema = withImportQuestionNormalization(
  listeningImportTaggedQuestionInnerSchema,
);

/** Part 1 photographs: no question prompt — learners see the image and hear options A–D. */
function preprocessListeningPart1Item(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const item = { ...(value as Record<string, unknown>) };
  const visualCaption =
    typeof item.visualCaption === "string" ? item.visualCaption : undefined;

  const question = item.question;
  if (!question || typeof question !== "object" || Array.isArray(question)) {
    return item;
  }

  const record = { ...(question as Record<string, unknown>) };
  record.tags = normalizeListeningPart1QuestionTags(record.tags, visualCaption);
  item.question = record;
  return item;
}

export const listeningImportPart1QuestionSchema = withImportQuestionNormalization(
  listeningImportQuestionInnerSchema
    .omit({ prompt: true })
    .extend({
      tags: listeningPart1QuestionTagsSchema,
    }),
);

const listeningImportPart2QuestionSchema = withImportQuestionNormalization(
  listeningImportQuestionInnerSchema.extend({
    tags: listeningPart2QuestionTagsSchema,
  }),
);

/** Part 2 stem lives on the item as questionTranscript; prompt is derived at import if omitted. */
function preprocessListeningPart2Item(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const item = { ...(value as Record<string, unknown>) };
  const transcript =
    typeof item.questionTranscript === "string"
      ? item.questionTranscript.trim()
      : "";

  const question = item.question;
  if (!question || typeof question !== "object" || Array.isArray(question)) {
    return item;
  }

  const record = { ...(question as Record<string, unknown>) };
  const prompt = typeof record.prompt === "string" ? record.prompt.trim() : "";
  if (!prompt && transcript) {
    record.prompt = transcript;
  }
  record.tags = normalizeListeningPart2QuestionTags(record.tags, transcript);
  item.question = record;
  return item;
}

export const listeningImportPart1ItemSchema = z.preprocess(
  preprocessListeningPart1Item,
  z.object({
    question: listeningImportPart1QuestionSchema,
    imageUrl: z.string().nullable().optional(),
  }),
);

export const listeningImportPart2ItemSchema = z.preprocess(
  preprocessListeningPart2Item,
  z.object({
    questionTranscript: z.string(),
    question: listeningImportPart2QuestionSchema,
  }),
);

const listeningStimulusKindEnum = z.enum([
  "conversation",
  "announcement",
  "voicemail",
  "radio_ad",
  "report",
  "instructions",
  "tour_talk",
  "other",
]);

export const listeningStimulusKindSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const aliases: Record<string, z.infer<typeof listeningStimulusKindEnum>> = {
      talks: "report",
      talk: "report",
      presentation: "report",
    };
    return aliases[value] ?? value;
  },
  listeningStimulusKindEnum,
);

export const listeningImportGroupSchema = z.object({
  id: z.string().optional(),
  topic: z.string().optional(),
  transcript: z.string(),
  audioUrl: z.string().nullable().optional(),
  stimulusKind: listeningStimulusKindSchema.optional(),
  vocabulary: contentVocabularySchema,
  translations: z.array(readingImportTranslationSchema).optional(),
  questions: z.array(listeningImportTaggedQuestionSchema).min(1),
});

/** Part 3 extract: tags/answers optional (filled at process step). */
export const listeningImportPart3GroupSchema = z.object({
  id: z.string().optional(),
  topic: z.string().optional(),
  transcript: z.string(),
  audioUrl: z.string().nullable().optional(),
  stimulusKind: listeningStimulusKindSchema.optional(),
  vocabulary: contentVocabularySchema,
  translations: z.array(readingImportTranslationSchema).optional(),
  questions: z.array(listeningImportQuestionSchema).min(1),
});

export const listeningImportPart1Schema = z.object({
  part: z.literal(1),
  title: z.string(),
  items: z.array(listeningImportPart1ItemSchema).min(1),
});

export const listeningImportPart2Schema = z.object({
  part: z.literal(2),
  title: z.string(),
  items: z.array(listeningImportPart2ItemSchema).min(1),
});

export const listeningImportPart3Schema = z.object({
  part: z.literal(3),
  title: z.string(),
  groups: z.array(listeningImportPart3GroupSchema).min(1),
});

export const listeningImportPart4Schema = z.object({
  part: z.literal(4),
  title: z.string(),
  groups: z.array(listeningImportGroupSchema).min(1),
});

export const listeningImportPartSchema = z.discriminatedUnion("part", [
  listeningImportPart1Schema,
  listeningImportPart2Schema,
  listeningImportPart3Schema,
  listeningImportPart4Schema,
]);

const listeningImportFileBaseSchema = z.object({
  bookId: z.string().min(1),
  testId: z.string().min(1),
  title: z.string().min(1),
  parts: z.array(listeningImportPartSchema).min(1),
});

export const listeningImportFileSchema = listeningImportFileBaseSchema.refine(
  (file) => file.parts.every((part) => part.part >= 1 && part.part <= 4),
  { message: "Listening import only allows parts 1–4" },
);

/** Create-exam dialog: legacy combined Parts 3 & 4 (deprecated — use single-part schemas). */
export const createExamListeningImportFileSchema =
  listeningImportFileBaseSchema
    .refine(
      (file) => file.parts.every((part) => part.part === 3 || part.part === 4),
      { message: "Create exam listening JSON must contain only parts 3 and 4" },
    )
    .refine((file) => file.parts.some((part) => part.part === 3), {
      message: "Create exam listening JSON must include part 3",
    })
    .refine((file) => file.parts.some((part) => part.part === 4), {
      message: "Create exam listening JSON must include part 4",
    });

function createExamListeningGroupsPartFileSchema(
  part: 3 | 4,
  options?: { skipOfficialQuestionCount?: boolean },
) {
  const spec = LISTENING_PART_OFFICIAL_SPEC[part];

  const schema = listeningImportFileBaseSchema
    .refine((file) => file.parts.length === 1, {
      message: `Create exam Part ${part} JSON must contain exactly one part entry`,
    })
    .refine((file) => file.parts[0]?.part === part, {
      message: `Create exam JSON must be Listening Part ${part} only`,
    });

  if (options?.skipOfficialQuestionCount) return schema;

  return schema.superRefine((file, ctx) => {
    const entry = file.parts[0];
    if (!entry || entry.part !== part || !("groups" in entry)) return;

    const { groups: actualGroups, questions: actualQuestions } =
      countListeningPartGroupsAndQuestions(entry);

    if (actualGroups === spec.groups && actualQuestions === spec.questions) {
      return;
    }

    ctx.addIssue({
      code: "custom",
      message: listeningPartImportCountError(
        part,
        actualGroups,
        actualQuestions,
      ),
    });
  });
}

/** Create-exam dialog: Part 1 PDF prompt output. */
export const createExamListeningPart3FileSchema =
  createExamListeningGroupsPartFileSchema(3);

/** Create-exam dialog: Part 4 PDF prompt output. */
export const createExamListeningPart4FileSchema =
  createExamListeningGroupsPartFileSchema(4);

function createExamListeningPart12FileSchemaWithOptions(options?: {
  skipOfficialQuestionCount?: boolean;
}) {
  const schema = listeningImportFileBaseSchema
    .refine(
      (file) => file.parts.every((part) => part.part === 1 || part.part === 2),
      { message: "Create exam Part 1–2 JSON must contain only parts 1 and 2" },
    )
    .refine((file) => file.parts.some((part) => part.part === 1), {
      message: "Create exam Part 1–2 JSON must include part 1",
    })
    .refine((file) => file.parts.some((part) => part.part === 2), {
      message: "Create exam Part 1–2 JSON must include part 2",
    });

  if (options?.skipOfficialQuestionCount) return schema;

  return schema.superRefine((file, ctx) => {
    for (const part of [1, 2] as const) {
      const entry = file.parts.find((p) => p.part === part);
      if (!entry || !("items" in entry)) continue;

      const actualItems = countListeningPartItems(entry);
      const spec = LISTENING_PART12_OFFICIAL_SPEC[part];
      if (actualItems === spec.items) continue;

      ctx.addIssue({
        code: "custom",
        message: listeningPart12ImportCountError(part, actualItems),
      });
    }
  });
}

/** Create-exam dialog: wrapped listening import — Parts 1 & 2 only. */
export const createExamListeningPart12FileSchema =
  createExamListeningPart12FileSchemaWithOptions();

export type ListeningImportFile = z.infer<typeof listeningImportFileSchema>;
export type CreateExamListeningImportFile = z.infer<
  typeof createExamListeningImportFileSchema
>;
export type CreateExamListeningPart12File = z.infer<
  typeof createExamListeningPart12FileSchema
>;
export type CreateExamListeningPart3File = z.infer<
  typeof createExamListeningPart3FileSchema
>;
export type CreateExamListeningPart4File = z.infer<
  typeof createExamListeningPart4FileSchema
>;

/** Inner schema output; preprocessed option fields typed explicitly. */
type ListeningImportQuestionBase = Omit<
  z.infer<typeof listeningImportQuestionInnerSchema>,
  "options" | "correctOptionLabel"
> & {
  options: ImportOption[];
  correctOptionLabel?: ImportOptionLabel;
};

export type ListeningImportQuestion = ListeningImportQuestionBase;
export type ListeningImportTaggedQuestion = Omit<
  z.infer<typeof listeningImportTaggedQuestionInnerSchema>,
  "options" | "correctOptionLabel"
> & {
  options: ImportOption[];
  correctOptionLabel?: ImportOptionLabel;
};
export type ListeningImportPart = z.infer<typeof listeningImportPartSchema>;

export function listeningImportPartNumbers(
  file: Pick<ListeningImportFile, "parts">,
): ListeningImportPart["part"][] {
  return file.parts.map((part) => part.part);
}

export function parseCreateExamListeningImportFile(
  raw: string,
): CreateExamListeningImportFile {
  const json: unknown = JSON.parse(raw);
  return createExamListeningImportFileSchema.parse(json);
}

export function parseCreateExamListeningPart12File(
  raw: string,
  options?: { skipOfficialQuestionCount?: boolean },
): CreateExamListeningPart12File {
  const json: unknown = JSON.parse(raw);
  return createExamListeningPart12FileSchemaWithOptions(options).parse(json);
}

export function parseCreateExamListeningPart3File(
  raw: string,
  options?: { skipOfficialQuestionCount?: boolean },
): CreateExamListeningPart3File {
  const json: unknown = JSON.parse(raw);
  return createExamListeningGroupsPartFileSchema(3, options).parse(json);
}

export function parseCreateExamListeningPart4File(
  raw: string,
  options?: { skipOfficialQuestionCount?: boolean },
): CreateExamListeningPart4File {
  const json: unknown = JSON.parse(raw);
  return createExamListeningGroupsPartFileSchema(4, options).parse(json);
}
