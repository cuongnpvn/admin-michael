import type { SupabaseClient } from "@supabase/supabase-js";
import {
  collectListeningImportMediaSpecs,
  upsertImportMediaAssets,
} from "@/lib/content/collect-listening-import-media";
import { insertDraftBundle } from "@/lib/content/insert-draft-bundle";
import {
  draftBundleFromListeningImport,
  listeningImportMetaParts,
} from "@/lib/content/listening-import-to-draft";
import {
  listeningImportPartNumbers,
  type ListeningImportFile,
} from "@/lib/content/listening-import-schema";
import { parseListeningImportFile } from "@/lib/content/parse-listening-import-file";
import {
  clearListeningContent,
  clearListeningParts,
  type ListeningPartNumber,
} from "@/lib/content/clear-listening-content";
import { assertUniqueGlobalItemNumbers } from "@/lib/content/validate-import-question-numbers";
import { upsertTestPartsFromMeta } from "@/lib/content/upsert-test-parts";

export interface ImportListeningJsonSummary {
  bookId: string;
  testId: string;
  questionCount: number;
  partsUpdated: number[];
  mediaAssetCount: number;
  missingAnswerKeys: boolean;
  published: false;
}

export interface ImportListeningJsonOptions {
  /**
   * `all` — replace every listening part (1–4). Default for standalone import.
   * `file-parts` — clear and replace only parts present in the JSON file.
   */
  clearMode?: "all" | "file-parts";
  /** Skip Zod parse when the caller already validated (e.g. create-exam P3–P4 schema). */
  file?: ListeningImportFile;
}

export async function importListeningJsonFromRaw(
  supabase: SupabaseClient,
  raw: string,
  options: ImportListeningJsonOptions = {},
): Promise<ImportListeningJsonSummary> {
  const file = options.file ?? parseListeningImportFile(raw);
  const clearMode = options.clearMode ?? "all";

  const { data: testRow, error: testError } = await supabase
    .from("tests")
    .select("id")
    .eq("book_id", file.bookId)
    .eq("id", file.testId)
    .maybeSingle();

  if (testError || !testRow) {
    throw new Error(`Test not found: ${file.bookId}/${file.testId}`);
  }

  const mediaSpecs = collectListeningImportMediaSpecs(file);
  const mediaLookup = await upsertImportMediaAssets(
    supabase,
    file.bookId,
    file.testId,
    mediaSpecs,
  );

  const draftBundle = draftBundleFromListeningImport(file, mediaLookup);
  assertUniqueGlobalItemNumbers(draftBundle.questions);
  const missingAnswerKeys = draftBundle.questions.some(
    (question) => !question.correctOptionSlug,
  );

  if (clearMode === "file-parts") {
    const parts = listeningImportPartNumbers(file) as ListeningPartNumber[];
    await clearListeningParts(supabase, file.bookId, file.testId, parts);
  } else {
    await clearListeningContent(supabase, file.bookId, file.testId);
  }

  await upsertTestPartsFromMeta(supabase, {
    bookId: file.bookId,
    testId: file.testId,
    title: file.title,
    parts: listeningImportMetaParts(file).map((part) => ({
      part: part.part,
      title: part.title,
      questionCount: part.questionCount,
    })),
  });

  await insertDraftBundle(supabase, draftBundle);

  return {
    bookId: file.bookId,
    testId: file.testId,
    questionCount: draftBundle.questions.length,
    partsUpdated: file.parts.map((part) => part.part),
    mediaAssetCount: mediaSpecs.length,
    missingAnswerKeys,
    published: false,
  };
}
