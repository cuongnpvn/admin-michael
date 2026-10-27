import type { SupabaseClient } from "@supabase/supabase-js";

const READING_PARTS = ["5", "6", "7"] as const;

export type ReadingPartNumber = 5 | 6 | 7;

export async function clearReadingParts(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  parts: readonly ReadingPartNumber[],
) {
  if (parts.length === 0) return;

  const partStrings = parts.map((part) => String(part));

  const { error: questionError } = await supabase
    .from("questions")
    .delete()
    .eq("book_id", bookId)
    .eq("test_id", testId)
    .in("part", partStrings);

  if (questionError) throw questionError;

  const passageParts = parts.filter((part) => part === 6 || part === 7);
  if (passageParts.length === 0) return;

  const { error: setError } = await supabase
    .from("reading_passage_sets")
    .delete()
    .eq("book_id", bookId)
    .eq("test_id", testId)
    .in(
      "part",
      passageParts.map((part) => String(part)),
    );

  if (setError) throw setError;
}

export async function clearReadingContent(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
) {
  await clearReadingParts(supabase, bookId, testId, [5, 6, 7]);
}
