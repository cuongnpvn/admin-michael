import { parseQuestionExplanation } from "@/lib/content/question-explanation";
import type { QuestionExplanation } from "@/lib/content/question-explanation";
import { getClozeGuessStatus } from "@/lib/listening/cloze-guess";
import { checkDictationAnswer } from "@/lib/listening/dictation-check";
import type { DictationAnswerSegment } from "@/lib/listening/dictation-check";
import {
  normalizeDictationAnswer,
  tokenizeDictationDisplay,
} from "@/lib/listening/dictation-normalize";
import type { Enums } from "@/types/database";

export type LectureExerciseKind = Enums<"lecture_exercise_kind">;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const BANK_SLUG_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,80}$/;

export function lectureBankSlug(value: unknown): string | undefined {
  if (typeof value !== "string" || !BANK_SLUG_RE.test(value)) return undefined;
  return value;
}

export const HIGHLIGHT_COLORS = [
  "red",
  "blue",
  "green",
  "amber",
  "violet",
] as const;

export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number];

export interface HighlightLabel {
  id: string;
  name: string;
  color: HighlightColor;
}

export interface HighlightSpan {
  start: number;
  end: number;
  labelId: string;
}

export type FillPart =
  | { type: "text"; text: string }
  | { type: "blank"; id: string };

export interface LectureQuestionPayload {
  sentence: string;
  labels: HighlightLabel[];
  prompt: string;
  parts: FillPart[];
  groupTitle?: string;
  /** 1-based exercise section. Missing values are section 1. */
  section?: number;
  /** Exam-bank question this row was copied from. */
  bankQuestionId?: string;
  /** Mini/final test section: Part 5 practice or Part 1 photograph. */
  part?: "1" | "5";
  /** Exam-bank ids used to rebuild a Part 1 photograph and audio. */
  bankBookId?: string;
  bankTestId?: string;
  bankItemNumber?: number;
}

export interface LectureKeyAnswer {
  spans: HighlightSpan[];
  accepted: string[];
  blanks: { id: string; accepted: string[] }[];
}

export type LectureAnswer =
  | string
  | { spans: HighlightSpan[] }
  | { blanks: Record<string, string> };

export type LectureAnswers = Record<string, LectureAnswer>;

export const emptyExplanation: QuestionExplanation = {
  reasoning: "",
  reference: [],
};

export const emptyPayload = (): LectureQuestionPayload => ({
  sentence: "",
  labels: [],
  prompt: "",
  parts: [],
});

export const emptyKeyAnswer = (): LectureKeyAnswer => ({
  spans: [],
  accepted: [],
  blanks: [],
});

export function explanationFromUnknown(value: unknown): QuestionExplanation {
  return parseQuestionExplanation(value) ?? emptyExplanation;
}

export function parseLecturePayload(value: unknown): LectureQuestionPayload {
  const payload = emptyPayload();
  if (!value || typeof value !== "object" || Array.isArray(value)) return payload;
  const row = value as Record<string, unknown>;
  if (typeof row.sentence === "string") payload.sentence = row.sentence;
  if (typeof row.prompt === "string") payload.prompt = row.prompt;
  if (Array.isArray(row.labels)) {
    payload.labels = row.labels.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const label = item as Record<string, unknown>;
      if (
        typeof label.id !== "string" ||
        typeof label.name !== "string" ||
        !HIGHLIGHT_COLORS.includes(label.color as HighlightColor)
      ) {
        return [];
      }
      return [
        {
          id: label.id,
          name: label.name,
          color: label.color as HighlightColor,
        },
      ];
    });
  }
  if (Array.isArray(row.parts)) {
    payload.parts = row.parts.flatMap((item) => parseFillPart(item));
  }
  if (typeof row.groupTitle === "string") payload.groupTitle = row.groupTitle;
  if (
    typeof row.section === "number" &&
    Number.isInteger(row.section) &&
    row.section > 0
  ) {
    payload.section = row.section;
  }
  if (typeof row.bankQuestionId === "string" && UUID_RE.test(row.bankQuestionId)) {
    payload.bankQuestionId = row.bankQuestionId;
  }
  if (row.part === "1" || row.part === "5") payload.part = row.part;
  const bankBookId = lectureBankSlug(row.bankBookId);
  const bankTestId = lectureBankSlug(row.bankTestId);
  if (bankBookId) payload.bankBookId = bankBookId;
  if (bankTestId) payload.bankTestId = bankTestId;
  if (
    typeof row.bankItemNumber === "number" &&
    Number.isInteger(row.bankItemNumber) &&
    row.bankItemNumber >= 1 &&
    row.bankItemNumber <= 6
  ) {
    payload.bankItemNumber = row.bankItemNumber;
  }
  return payload;
}

export function parseKeyAnswer(value: unknown): LectureKeyAnswer {
  const answer = emptyKeyAnswer();
  if (!value || typeof value !== "object" || Array.isArray(value)) return answer;
  const row = value as Record<string, unknown>;
  answer.spans = parseSpans(row.spans);
  if (Array.isArray(row.accepted)) {
    answer.accepted = row.accepted.filter(
      (item): item is string => typeof item === "string",
    );
  }
  if (Array.isArray(row.blanks)) {
    answer.blanks = row.blanks.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const blank = item as Record<string, unknown>;
      if (typeof blank.id !== "string" || !Array.isArray(blank.accepted)) return [];
      return [
        {
          id: blank.id,
          accepted: blank.accepted.filter(
            (entry): entry is string => typeof entry === "string",
          ),
        },
      ];
    });
  }
  return answer;
}

export function parseLectureAnswer(value: unknown): LectureAnswer | null {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (Array.isArray(row.spans)) return { spans: parseSpans(row.spans) };
  if (row.blanks && typeof row.blanks === "object" && !Array.isArray(row.blanks)) {
    const blanks: Record<string, string> = {};
    for (const [id, text] of Object.entries(row.blanks)) {
      if (typeof text === "string") blanks[id] = text;
    }
    return { blanks };
  }
  return null;
}

export function parseLectureAnswers(value: unknown): LectureAnswers {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const answers: LectureAnswers = {};
  for (const [id, item] of Object.entries(value)) {
    const parsed = parseLectureAnswer(item);
    if (parsed != null) answers[id] = parsed;
  }
  return answers;
}

export function publicPayload(
  kind: LectureExerciseKind,
  payload: LectureQuestionPayload,
): Record<string, unknown> {
  const title = payload.groupTitle?.trim();
  const group = {
    ...(title ? { groupTitle: title } : {}),
    ...(payload.section != null && payload.section > 0
      ? { section: payload.section }
      : {}),
    ...(payload.bankQuestionId ? { bankQuestionId: payload.bankQuestionId } : {}),
    ...(payload.part === "1" || payload.part === "5" ? { part: payload.part } : {}),
    ...(payload.bankBookId ? { bankBookId: payload.bankBookId } : {}),
    ...(payload.bankTestId ? { bankTestId: payload.bankTestId } : {}),
    ...(payload.bankItemNumber ? { bankItemNumber: payload.bankItemNumber } : {}),
  };
  if (kind === "highlight") {
    return { sentence: payload.sentence, labels: payload.labels, ...group };
  }
  if (kind === "rewrite") return { prompt: payload.prompt, ...group };
  if (kind === "fill_blank") return { parts: payload.parts, ...group };
  return group;
}

export function secretAnswer(
  kind: LectureExerciseKind,
  answer: LectureKeyAnswer,
): Record<string, unknown> {
  if (kind === "highlight") return { spans: answer.spans };
  if (kind === "rewrite") return { accepted: answer.accepted };
  if (kind === "fill_blank") return { blanks: answer.blanks };
  return {};
}

export function isLectureAnswerComplete(
  kind: LectureExerciseKind,
  payload: LectureQuestionPayload,
  answer: LectureAnswer | undefined,
): boolean {
  if (kind === "multiple_choice" || kind === "rewrite") {
    return typeof answer === "string" && answer.trim().length > 0;
  }
  if (kind === "highlight") {
    return Boolean(answer && typeof answer === "object" && "spans" in answer);
  }
  if (!answer || typeof answer !== "object" || !("blanks" in answer)) return false;
  return payload.parts
    .filter((part) => part.type === "blank")
    .every((part) => (answer.blanks[part.id] ?? "").trim().length > 0);
}

export function labelsForWords(
  spans: HighlightSpan[],
  wordCount: number,
): Array<string | null> {
  const labels = Array.from({ length: wordCount }, () => null as string | null);
  for (const span of spans) {
    const start = Math.max(0, span.start);
    const end = Math.min(wordCount - 1, span.end);
    for (let index = start; index <= end; index += 1) {
      labels[index] = span.labelId;
    }
  }
  return labels;
}

export function highlightMatches(
  sentence: string,
  expected: HighlightSpan[],
  given: HighlightSpan[],
): boolean {
  const words = tokenizeDictationDisplay(sentence);
  const expectedLabels = labelsForWords(expected, words.length);
  const givenLabels = labelsForWords(given, words.length);
  return expectedLabels.every((label, index) => label === givenLabels[index]);
}

export function rewriteMatches(input: string, accepted: string[]): boolean {
  const normalized = normalizeDictationAnswer(input);
  return accepted.some((item) => normalizeDictationAnswer(item) === normalized);
}

export function rewriteDiff(
  input: string,
  accepted: string[],
): DictationAnswerSegment[] {
  const match = accepted.find(
    (item) => normalizeDictationAnswer(item) === normalizeDictationAnswer(input),
  );
  const expected = match ?? accepted[0] ?? "";
  return checkDictationAnswer(input, expected).expectedSegments;
}

export function blankIsCorrect(input: string, accepted: string[]): boolean {
  return accepted.some((item) => getClozeGuessStatus(input, item) === "correct");
}

export function fillTemplate(parts: FillPart[]): string {
  return parts
    .map((part) => (part.type === "blank" ? "______" : part.text))
    .join("");
}

export function partsFromTemplate(
  template: string,
  previous: { id: string; accepted: string[] }[],
): { parts: FillPart[]; blanks: { id: string; accepted: string[] }[] } {
  const chunks = template.split("______");
  const parts: FillPart[] = [];
  const blanks: { id: string; accepted: string[] }[] = [];
  chunks.forEach((text, index) => {
    if (text.length > 0) parts.push({ type: "text", text });
    if (index >= chunks.length - 1) return;
    const existing = previous[index];
    const id = existing?.id ?? `blank-${index + 1}`;
    parts.push({ type: "blank", id });
    blanks.push({ id, accepted: existing?.accepted ?? [""] });
  });
  return { parts, blanks };
}

function parseFillPart(value: unknown): FillPart[] {
  if (!value || typeof value !== "object") return [];
  const part = value as Record<string, unknown>;
  if (part.type === "text" && typeof part.text === "string") {
    return [{ type: "text", text: part.text }];
  }
  if (part.type === "blank" && typeof part.id === "string") {
    return [{ type: "blank", id: part.id }];
  }
  return [];
}

function parseSpans(value: unknown): HighlightSpan[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const span = item as Record<string, unknown>;
    if (
      typeof span.start !== "number" ||
      typeof span.end !== "number" ||
      typeof span.labelId !== "string"
    ) {
      return [];
    }
    return [{ start: span.start, end: span.end, labelId: span.labelId }];
  });
}
