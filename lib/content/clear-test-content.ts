import type { SupabaseClient } from "@supabase/supabase-js";

export async function clearTestContent(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
) {
  await supabase
    .from("questions")
    .delete()
    .eq("book_id", bookId)
    .eq("test_id", testId);

  await supabase
    .from("listening_groups")
    .delete()
    .eq("book_id", bookId)
    .eq("test_id", testId);

  await supabase
    .from("reading_passage_sets")
    .delete()
    .eq("book_id", bookId)
    .eq("test_id", testId);
}
