import { z } from "zod";
import { normalizeImportOptionLabel } from "@/lib/content/resolve-correct-option-label";
import {
  toeicPartFromGlobalItemNumber,
  toeicPartGlobalItemRange,
  TOEIC_READING_GLOBAL_MIN,
} from "@/lib/content/toeic-global-item-number";

const optionLabelSchema = z.enum(["A", "B", "C", "D"]);

const answerLabelSchema = z.preprocess(
  (value) => normalizeImportOptionLabel(value),
  optionLabelSchema,
);

const answerKeyAnswersRecordSchema = z.record(
  z.union([z.string(), z.number()]),
  answerLabelSchema,
);

const answerKeyPartSchema = z.object({
  part: z.number().int().min(1).max(7),
  answers: answerKeyAnswersRecordSchema,
});

const answerKeyFileInputSchema = z
  .object({
    bookId: z.string().min(1),
    testId: z.string().min(1),
    parts: z.array(answerKeyPartSchema).optional(),
    answers: answerKeyAnswersRecordSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const hasParts = (data.parts?.length ?? 0) > 0;
    const hasAnswers =
      data.answers != null && Object.keys(data.answers).length > 0;

    if (!hasParts && !hasAnswers) {
      ctx.addIssue({
        code: "custom",
        message: "Answer key must include parts[] or answers",
        path: ["parts"],
      });
    }

    if (hasParts && hasAnswers) {
      ctx.addIssue({
        code: "custom",
        message: "Use parts[] or answers, not both",
        path: ["answers"],
      });
    }
  });

export const answerKeyFileSchema = z.object({
  bookId: z.string().min(1),
  testId: z.string().min(1),
  parts: z.array(answerKeyPartSchema).min(1),
});

export type AnswerKeyFile = z.infer<typeof answerKeyFileSchema>;
export type AnswerKeyPart = z.infer<typeof answerKeyPartSchema>;

export interface NormalizedAnswerKeyEntry {
  globalItemNumber: number;
  part: number;
  label: "A" | "B" | "C" | "D";
}

export type AnswerKeySection = "listening" | "reading" | "full";

/** Infer section from the lowest global question number in the file. */
export function inferAnswerKeySection(
  globalItemNumbers: number[],
): AnswerKeySection | null {
  if (globalItemNumbers.length === 0) return null;

  const min = Math.min(...globalItemNumbers);
  const max = Math.max(...globalItemNumbers);

  if (min >= TOEIC_READING_GLOBAL_MIN) return "reading";
  if (max < TOEIC_READING_GLOBAL_MIN) return "listening";
  return "full";
}

export function groupFlatAnswersIntoParts(
  answers: Record<string | number, "A" | "B" | "C" | "D">,
): AnswerKeyPart[] {
  const byPart = new Map<number, Record<string, "A" | "B" | "C" | "D">>();

  for (const [rawNumber, label] of Object.entries(answers)) {
    const globalItemNumber = Number.parseInt(String(rawNumber).trim(), 10);
    if (!Number.isFinite(globalItemNumber)) {
      throw new Error(`Invalid global item number: ${rawNumber}`);
    }

    const { part } = toeicPartFromGlobalItemNumber(globalItemNumber);
    const block = byPart.get(part) ?? {};
    block[String(globalItemNumber)] = label;
    byPart.set(part, block);
  }

  return [...byPart.entries()]
    .sort(([left], [right]) => left - right)
    .map(([part, partAnswers]) => ({ part, answers: partAnswers }));
}

export function parseAnswerKeyFile(raw: unknown): AnswerKeyFile {
  const parsed = answerKeyFileInputSchema.parse(raw);

  if (parsed.parts && parsed.parts.length > 0) {
    return {
      bookId: parsed.bookId,
      testId: parsed.testId,
      parts: parsed.parts,
    };
  }

  if (!parsed.answers || Object.keys(parsed.answers).length === 0) {
    throw new Error("Answer key must include parts[] or answers");
  }

  return {
    bookId: parsed.bookId,
    testId: parsed.testId,
    parts: groupFlatAnswersIntoParts(parsed.answers),
  };
}

export function normalizeAnswerKeyEntries(
  file: AnswerKeyFile,
): NormalizedAnswerKeyEntry[] {
  const entries: NormalizedAnswerKeyEntry[] = [];
  const seen = new Set<number>();

  for (const partBlock of file.parts) {
    for (const [rawNumber, label] of Object.entries(partBlock.answers)) {
      const globalItemNumber = Number.parseInt(String(rawNumber).trim(), 10);
      if (!Number.isFinite(globalItemNumber)) {
        throw new Error(`Invalid global item number: ${rawNumber}`);
      }

      const resolvedPart = toeicPartFromGlobalItemNumber(globalItemNumber).part;
      if (resolvedPart !== partBlock.part) {
        throw new Error(
          `Question ${globalItemNumber} belongs to part ${resolvedPart}, not part ${partBlock.part}`,
        );
      }

      if (partBlock.part === 2 && label === "D") {
        throw new Error(
          `Question ${globalItemNumber} (Part 2) cannot use answer D`,
        );
      }

      const { first, last } = toeicPartGlobalItemRange(partBlock.part);
      if (globalItemNumber < first || globalItemNumber > last) {
        throw new Error(
          `Question ${globalItemNumber} is outside part ${partBlock.part} range (${first}–${last})`,
        );
      }

      if (seen.has(globalItemNumber)) {
        throw new Error(`Duplicate answer for question ${globalItemNumber}`);
      }
      seen.add(globalItemNumber);

      entries.push({ globalItemNumber, part: partBlock.part, label });
    }
  }

  return entries.sort((a, b) => a.globalItemNumber - b.globalItemNumber);
}
