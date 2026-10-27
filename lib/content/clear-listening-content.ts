import type { SupabaseClient } from "@supabase/supabase-js";

export type ListeningPartNumber = 1 | 2 | 3 | 4;

const LISTENING_PARTS: readonly ListeningPartNumber[] = [1, 2, 3, 4];

export async function clearListeningParts(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  parts: readonly ListeningPartNumber[],
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

  const groupParts = parts.filter((part) => part === 3 || part === 4);
  if (groupParts.length === 0) return;

  const { error: groupError } = await supabase
    .from("listening_groups")
    .delete()
    .eq("book_id", bookId)
    .eq("test_id", testId)
    .in(
      "part",
      groupParts.map((part) => String(part)),
    );

  if (groupError) throw groupError;
}

export async function clearListeningContent(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
) {
  await clearListeningParts(supabase, bookId, testId, [...LISTENING_PARTS]);
}
