import type { SupabaseClient } from "@supabase/supabase-js";
import {
  inferAnswerKeySection,
  type AnswerKeyFile,
  type AnswerKeySection,
  type NormalizedAnswerKeyEntry,
} from "@/lib/admin/answer-key/schema";
import type { ToeicPartDb } from "@/types/content-db";

export interface PersistAnswerKeyResult {
  uploadId: string;
  section: AnswerKeySection;
  entriesSaved: number;
}

function partToDb(part: number): ToeicPartDb {
  return String(part) as ToeicPartDb;
}

export async function persistAnswerKeyUpload(
  supabase: SupabaseClient,
  file: AnswerKeyFile,
  entries: NormalizedAnswerKeyEntry[],
  raw: string,
  uploadedBy?: string | null,
): Promise<PersistAnswerKeyResult> {
  const { bookId, testId } = file;
  const globalNumbers = entries.map((entry) => entry.globalItemNumber);
  const section =
    inferAnswerKeySection(globalNumbers) ??
    ("full" satisfies AnswerKeySection);

  let sourceJson: unknown;
  try {
    sourceJson = JSON.parse(raw);
  } catch {
    sourceJson = { raw };
  }

  const { data: uploadRow, error: uploadError } = await supabase
    .from("answer_key_uploads")
    .insert({
      book_id: bookId,
      test_id: testId,
      section,
      source_json: sourceJson,
      entry_count: entries.length,
      global_item_number_min:
        globalNumbers.length > 0 ? Math.min(...globalNumbers) : null,
      global_item_number_max:
        globalNumbers.length > 0 ? Math.max(...globalNumbers) : null,
      uploaded_by: uploadedBy ?? null,
    })
    .select("id")
    .single();

  if (uploadError) throw uploadError;
  if (!uploadRow?.id) {
    throw new Error("Failed to create answer key upload record");
  }

  if (entries.length === 0) {
    return {
      uploadId: uploadRow.id,
      section,
      entriesSaved: 0,
    };
  }

  const rows = entries.map((entry) => ({
    book_id: bookId,
    test_id: testId,
    part: partToDb(entry.part),
    global_item_number: entry.globalItemNumber,
    answer_label: entry.label,
    upload_id: uploadRow.id,
  }));

  const { error: upsertError } = await supabase
    .from("answer_keys")
    .upsert(rows, { onConflict: "book_id,test_id,global_item_number" });

  if (upsertError) throw upsertError;

  return {
    uploadId: uploadRow.id,
    section,
    entriesSaved: entries.length,
  };
}
