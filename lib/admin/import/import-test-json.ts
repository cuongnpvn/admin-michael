import type { SupabaseClient } from "@supabase/supabase-js";
import {
  collectImportMediaSpecs,
  upsertImportMediaAssets,
} from "@/lib/content/collect-import-media";
import { clearTestContent } from "@/lib/content/clear-test-content";
import { draftBundleFromPartJson } from "@/lib/content/json-to-draft";
import { insertDraftBundle } from "@/lib/content/insert-draft-bundle";
import { publishTest } from "@/lib/content/publish-test";
import {
  parseTestImportFile,
  testImportFileToPartArrays,
} from "@/lib/content/schemas";
import { upsertTestPartsFromMeta } from "@/lib/content/upsert-test-parts";

export interface ImportTestJsonSummary {
  bookId: string;
  testId: string;
  questionCount: number;
  mediaAssetCount: number;
  published: boolean;
  publishedAt: string;
}

export async function importTestJsonFromRaw(
  supabase: SupabaseClient,
  raw: string,
): Promise<ImportTestJsonSummary> {
  const file = parseTestImportFile(raw);
  const { meta, listeningParts, readingParts } = testImportFileToPartArrays(file);

  const { data: testRow, error: testError } = await supabase
    .from("tests")
    .select("id")
    .eq("book_id", meta.bookId)
    .eq("id", meta.testId)
    .maybeSingle();

  if (testError || !testRow) {
    throw new Error(`Test not found: ${meta.bookId}/${meta.testId}`);
  }

  const mediaSpecs = collectImportMediaSpecs(file);
  const mediaLookup = await upsertImportMediaAssets(
    supabase,
    meta.bookId,
    meta.testId,
    mediaSpecs,
  );

  const draftBundle = draftBundleFromPartJson(
    meta.bookId,
    meta.testId,
    meta.title,
    meta.parts,
    listeningParts,
    readingParts,
    mediaLookup,
  );

  await clearTestContent(supabase, meta.bookId, meta.testId);
  await upsertTestPartsFromMeta(supabase, meta);
  await insertDraftBundle(supabase, draftBundle);

  const { publishedAt } = await publishTest(supabase, {
    bookId: meta.bookId,
    testId: meta.testId,
  });

  return {
    bookId: meta.bookId,
    testId: meta.testId,
    questionCount: draftBundle.questions.length,
    mediaAssetCount: mediaSpecs.length,
    published: true,
    publishedAt,
  };
}
