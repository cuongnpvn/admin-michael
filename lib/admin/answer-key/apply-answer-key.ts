import type { SupabaseClient } from "@supabase/supabase-js";
import {
  normalizeAnswerKeyEntries,
  parseAnswerKeyFile,
  type AnswerKeyFile,
  type AnswerKeySection,
} from "@/lib/admin/answer-key/schema";
import { ensureExamCatalogForAnswerKey } from "@/lib/admin/answer-key/ensure-exam-catalog";
import { persistAnswerKeyUpload } from "@/lib/admin/answer-key/save-answer-key";

export interface ApplyAnswerKeySummary {
  bookId: string;
  testId: string;
  partsSaved: number[];
  globalItemNumberMin: number | null;
  globalItemNumberMax: number | null;
  uploadId: string;
  section: AnswerKeySection;
  entriesSaved: number;
  createdBook: boolean;
  createdTest: boolean;
}

export async function applyAnswerKeyFromRaw(
  supabase: SupabaseClient,
  raw: string,
  uploadedBy?: string | null,
): Promise<ApplyAnswerKeySummary> {
  const parsed = JSON.parse(raw) as unknown;
  const file = parseAnswerKeyFile(parsed);
  return applyAnswerKeyFile(supabase, file, raw, uploadedBy);
}

export async function applyAnswerKeyFile(
  supabase: SupabaseClient,
  file: AnswerKeyFile,
  raw: string,
  uploadedBy?: string | null,
): Promise<ApplyAnswerKeySummary> {
  const entries = normalizeAnswerKeyEntries(file);
  const catalog = await ensureExamCatalogForAnswerKey(
    supabase,
    file.bookId,
    file.testId,
  );

  const normalizedFile: AnswerKeyFile = {
    ...file,
    bookId: catalog.bookId,
    testId: catalog.testId,
  };

  const persistResult = await persistAnswerKeyUpload(
    supabase,
    normalizedFile,
    entries,
    raw,
    uploadedBy,
  );

  const globalNumbers = entries.map((entry) => entry.globalItemNumber);
  const partsSaved = [
    ...new Set(entries.map((entry) => entry.part)),
  ].sort((a, b) => a - b);

  return {
    bookId: catalog.bookId,
    testId: catalog.testId,
    partsSaved,
    globalItemNumberMin:
      globalNumbers.length > 0 ? Math.min(...globalNumbers) : null,
    globalItemNumberMax:
      globalNumbers.length > 0 ? Math.max(...globalNumbers) : null,
    uploadId: persistResult.uploadId,
    section: persistResult.section,
    entriesSaved: persistResult.entriesSaved,
    createdBook: catalog.createdBook,
    createdTest: catalog.createdTest,
  };
}
