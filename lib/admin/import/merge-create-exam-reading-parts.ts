import {
  readingImportPart5Schema,
  readingImportPart6Schema,
  readingImportPart7Schema,
  readingImportPassageSetSchema,
  type ReadingImportPart,
} from "@/lib/content/reading-import-schema";
import {
  readingPart5DataSchema,
  readingPart6DataSchema,
  readingPart7DataSchema,
} from "@/lib/content/schemas";
import { assertQualifiedReadingPart5Extract } from "@/lib/admin/gemini/validate-reading-part-5-extract";
import { isEntranceTestBook } from "@/lib/content/catalog-ids";
import {
  assertCreateExamReadingPartQuestionCount,
} from "@/lib/content/reading-part-specs";
import { copy } from "@/lib/copy/vi";
import {
  formatZodIssues,
  importError,
  importLog,
} from "@/lib/admin/import/exam-import-log";
import type { ZodError } from "zod";

type ReadingPartNumber = 5 | 6 | 7;

function partNumberFromJson(json: unknown): number | null {
  if (!json || typeof json !== "object") return null;

  const record = json as Record<string, unknown>;
  if (typeof record.part === "number") {
    return record.part;
  }

  if (Array.isArray(record.parts) && record.parts.length > 0) {
    const first = record.parts[0];
    if (first && typeof first === "object" && "part" in first) {
      const part = (first as { part?: unknown }).part;
      return typeof part === "number" ? part : null;
    }
  }

  return null;
}

function extractWrappedPart(json: unknown, expectedPart: ReadingPartNumber): unknown | null {
  if (!json || typeof json !== "object" || Array.isArray(json)) return null;

  const record = json as Record<string, unknown>;
  if (!Array.isArray(record.parts)) return null;

  const match = record.parts.find(
    (entry) =>
      entry &&
      typeof entry === "object" &&
      (entry as { part?: unknown }).part === expectedPart,
  );

  return match ?? null;
}

function part5FromTestDataShape(json: unknown): ReadingImportPart | null {
  const parsed = readingPart5DataSchema.safeParse(json);
  if (!parsed.success) return null;

  const converted = readingImportPart5Schema.safeParse({
    part: 5,
    title: parsed.data.title,
    questions: parsed.data.items.map((item) => ({
      globalItemNumber: item.question.globalItemNumber,
      prompt: item.question.prompt,
      options: item.question.options.map((option) => ({
        label: option.label,
        text: option.text,
      })),
      hint: item.question.hint ?? undefined,
      explanation: item.question.explanation ?? undefined,
      tags: item.question.tags ?? [],
      correctOptionLabel: item.question.options.find(
        (option) => option.id === item.question.correctOptionId,
      )?.label,
      translations: item.question.translations ?? [],
      vocabulary: item.question.vocabulary ?? [],
    })),
  });

  return converted.success ? converted.data : null;
}

function part67FromTestDataShape(
  json: unknown,
  expectedPart: 6 | 7,
): ReadingImportPart | null {
  const schema = expectedPart === 6 ? readingPart6DataSchema : readingPart7DataSchema;
  const parsed = schema.safeParse(json);
  if (!parsed.success) return null;

  const importSchema =
    expectedPart === 6 ? readingImportPart6Schema : readingImportPart7Schema;

  const converted = importSchema.safeParse({
    part: expectedPart,
    title: parsed.data.title,
    passageSets: parsed.data.passageSets.map((set) => ({
      id: set.id,
      topic: set.topic,
      vocabulary: set.vocabulary ?? [],
      passages: set.passages.map((passage) => ({
        title: passage.title,
        content: passage.content,
      })),
      questions: set.questions.map((question) => ({
        globalItemNumber: question.globalItemNumber,
        prompt: question.prompt,
        options: question.options.map((option) => ({
          label: option.label,
          text: option.text,
        })),
        hint: question.hint ?? undefined,
        explanation: question.explanation ?? undefined,
        tags: question.tags ?? [],
        correctOptionLabel: question.options.find(
          (option) => option.id === question.correctOptionId,
        )?.label,
        translations: question.translations ?? [],
        vocabulary: question.vocabulary ?? [],
      })),
    })),
  });

  return converted.success ? converted.data : null;
}

function formatReadingPartParseError(part: number, zodError: ZodError | null): string {
  const base = copy.admin.exams.create.readingPartInvalid(part);
  const issue = zodError?.issues[0];
  if (!issue?.message) return base;

  const pathSuffix =
    issue.path.length > 0 ? ` (${issue.path.map(String).join(".")})` : "";
  return `${base} ${issue.message}${pathSuffix}`;
}

function logPassagePartBreakdown(
  part: 6 | 7,
  payload: unknown,
): void {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    importLog("reading_part_passage_payload_invalid", { part });
    return;
  }

  const record = payload as Record<string, unknown>;
  const passageSets = record.passageSets;
  if (!Array.isArray(passageSets)) {
    importError("reading_part_passage_sets_missing", { part });
    return;
  }

  importLog("reading_part_passage_sets_found", {
    part,
    setCount: passageSets.length,
  });

  for (const [index, set] of passageSets.entries()) {
    const setRecord =
      set && typeof set === "object" && !Array.isArray(set)
        ? (set as Record<string, unknown>)
        : null;
    const passages = setRecord?.passages;
    const questions = setRecord?.questions;

    importLog("reading_part_passage_set_preview", {
      part,
      setIndex: index + 1,
      setCount: passageSets.length,
      topic: typeof setRecord?.topic === "string" ? setRecord.topic : null,
      id: typeof setRecord?.id === "string" ? setRecord.id : null,
      passageCount: Array.isArray(passages) ? passages.length : 0,
      questionCount: Array.isArray(questions) ? questions.length : 0,
    });

    const setResult = readingImportPassageSetSchema.safeParse(set);
    if (!setResult.success) {
      importError("reading_part_passage_set_schema_failed", {
        part,
        setIndex: index + 1,
        issues: formatZodIssues(setResult.error.issues),
      });
    } else {
      importLog("reading_part_passage_set_schema_ok", {
        part,
        setIndex: index + 1,
        topic: setResult.data.topic ?? null,
        questionCount: setResult.data.questions.length,
      });
    }
  }
}

function parseReadingPartJson(
  raw: string,
  expectedPart: ReadingPartNumber,
  options?: { skipOfficialQuestionCount?: boolean },
): ReadingImportPart {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error(copy.admin.listeningImport.errors.invalidJson);
  }

  const partNumber = partNumberFromJson(json);
  if (partNumber !== null && partNumber !== expectedPart) {
    throw new Error(copy.admin.exams.create.readingPartWrongPart(expectedPart, partNumber));
  }

  const wrapped = extractWrappedPart(json, expectedPart);
  const payload = wrapped ?? json;

  let schemaError: ZodError | null = null;

  if (expectedPart === 5) {
    const fromImport = readingImportPart5Schema.safeParse(payload);
    if (fromImport.success) {
      assertQualifiedReadingPart5Extract(fromImport.data, undefined, options);
      return fromImport.data;
    }
    schemaError = fromImport.error;

    const fromTestData = part5FromTestDataShape(payload);
    if (fromTestData) {
      assertQualifiedReadingPart5Extract(fromTestData, undefined, options);
      return fromTestData;
    }
  }

  if (expectedPart === 6) {
    logPassagePartBreakdown(6, payload);

    const fromImport = readingImportPart6Schema.safeParse(payload);
    if (fromImport.success) {
      assertCreateExamReadingPartQuestionCount(6, fromImport.data, options);
      importLog("reading_part6_schema_ok", {
        title: fromImport.data.title,
        setCount: fromImport.data.passageSets.length,
        questionCount: fromImport.data.passageSets.reduce(
          (sum, set) => sum + set.questions.length,
          0,
        ),
      });
      return fromImport.data;
    }
    importError("reading_part6_schema_failed", {
      issues: formatZodIssues(fromImport.error.issues),
    });
    schemaError = fromImport.error;

    const fromTestData = part67FromTestDataShape(payload, 6);
    if (fromTestData && fromTestData.part === 6) {
      importLog("reading_part6_test_data_shape_ok", {
        setCount: fromTestData.passageSets.length,
      });
      return fromTestData;
    }
  }

  if (expectedPart === 7) {
    logPassagePartBreakdown(7, payload);

    const fromImport = readingImportPart7Schema.safeParse(payload);
    if (fromImport.success) {
      assertCreateExamReadingPartQuestionCount(7, fromImport.data, options);
      importLog("reading_part7_schema_ok", {
        title: fromImport.data.title,
        setCount: fromImport.data.passageSets.length,
      });
      return fromImport.data;
    }
    importError("reading_part7_schema_failed", {
      issues: formatZodIssues(fromImport.error.issues),
    });
    schemaError = fromImport.error;

    const fromTestData = part67FromTestDataShape(payload, 7);
    if (fromTestData && fromTestData.part === 7) {
      assertCreateExamReadingPartQuestionCount(7, fromTestData, options);
      return fromTestData;
    }
  }

  throw new Error(formatReadingPartParseError(expectedPart, schemaError));
}

export function mergeCreateExamReadingImport(
  partRaws: Partial<Record<ReadingPartNumber, string>>,
  bookId: string,
  testId: string,
  title: string,
): string | null {
  const parts: ReadingImportPart[] = [];

  for (const part of [5, 6, 7] as const) {
    const raw = partRaws[part];
    if (!raw) continue;
    parts.push(
      parseReadingPartJson(raw, part, {
        skipOfficialQuestionCount: isEntranceTestBook(bookId),
      }),
    );
  }

  if (parts.length === 0) return null;

  return JSON.stringify({
    bookId,
    testId,
    title,
    parts,
  });
}
