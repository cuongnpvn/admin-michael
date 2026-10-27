import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";
import type { testMetaSchema } from "@/lib/content/schemas";

type TestMetaInput = z.infer<typeof testMetaSchema>;

export async function upsertTestPartsFromMeta(
  supabase: SupabaseClient,
  meta: TestMetaInput,
) {
  const rows = meta.parts.map((part) => ({
    book_id: meta.bookId,
    test_id: meta.testId,
    part: String(part.part),
    title: part.title,
    question_count_target: part.questionCount,
    sort_order: part.part,
  }));

  const { error } = await supabase.from("test_parts").upsert(rows, {
    onConflict: "book_id,test_id,part",
  });

  if (error) throw error;
}
