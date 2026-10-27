import type { SupabaseClient } from "@supabase/supabase-js";
import { isCommonBook } from "@/lib/content/catalog-ids";

export type PublishSection = "listening" | "reading";

const LISTENING_PARTS = ["1", "2", "3", "4"] as const;
const READING_PARTS = ["5", "6", "7"] as const;
const EXAM_SECTION_TOTAL = 100;

function partsForSection(section: PublishSection): readonly string[] {
  return section === "listening" ? LISTENING_PARTS : READING_PARTS;
}

export async function isSectionCountsValid(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  section: PublishSection,
): Promise<boolean> {
  const partIds = partsForSection(section);

  const { data: testParts, error: partsError } = await supabase
    .from("test_parts")
    .select("part, question_count_target")
    .eq("book_id", bookId)
    .eq("test_id", testId)
    .in("part", [...partIds]);

  if (partsError) throw partsError;
  if (!testParts?.length) return false;

  let targetSum = 0;
  for (const part of partIds) {
    const row = testParts.find((entry) => String(entry.part) === part);
    if (!row) return false;
    targetSum += row.question_count_target;
  }

  for (const part of partIds) {
    const row = testParts.find((entry) => String(entry.part) === part)!;
    const target = row.question_count_target;

    const { count, error: countError } = await supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("book_id", bookId)
      .eq("test_id", testId)
      .eq("part", part);

    if (countError) throw countError;
    if ((count ?? 0) !== target) return false;
  }

  if (!isCommonBook(bookId) && targetSum !== EXAM_SECTION_TOTAL) {
    return false;
  }

  return true;
}
