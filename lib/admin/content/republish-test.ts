import type { SupabaseClient } from "@supabase/supabase-js";
import { publishTest } from "@/lib/content/publish-test";

export async function republishExamFromDraft(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
): Promise<string> {
  const { publishedAt } = await publishTest(supabase, { bookId, testId });
  return publishedAt;
}
