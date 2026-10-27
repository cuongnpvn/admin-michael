import type { SupabaseClient } from "@supabase/supabase-js";
import { isExamBook } from "@/lib/content/catalog-ids";
import { slugifyCatalogId } from "@/lib/content/slugify-catalog-id";
import { listeningParts, readingParts } from "@/lib/mock";
import { copy } from "@/lib/copy/vi";

export interface EnsuredExamCatalog {
  bookId: string;
  testId: string;
  createdBook: boolean;
  createdTest: boolean;
}

function labelFromCatalogId(id: string): string {
  return id
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * Ensure book + test (+ test_parts) exist for answer-key upload.
 * Creates missing catalog rows so keys can be saved before PDF import.
 */
export async function ensureExamCatalogForAnswerKey(
  supabase: SupabaseClient,
  bookIdInput: string,
  testIdInput: string,
): Promise<EnsuredExamCatalog> {
  const bookId = slugifyCatalogId(bookIdInput);
  const testId = slugifyCatalogId(testIdInput);

  if (!bookId || !testId) {
    throw new Error(copy.admin.answerKey.errors.invalidBookTestId);
  }

  if (!isExamBook(bookId)) {
    throw new Error(copy.admin.answerKey.errors.commonBookNotAllowed);
  }

  let createdBook = false;
  let createdTest = false;

  const { data: existingBook, error: bookLookupError } = await supabase
    .from("books")
    .select("id")
    .eq("id", bookId)
    .maybeSingle();

  if (bookLookupError) throw bookLookupError;

  if (!existingBook) {
    const { data: maxRow } = await supabase
      .from("books")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const sortOrder = ((maxRow?.sort_order as number | undefined) ?? 0) + 1;

    const { error: bookInsertError } = await supabase.from("books").insert({
      id: bookId,
      name: labelFromCatalogId(bookId),
      publisher: "",
      year: new Date().getFullYear(),
      sort_order: sortOrder,
    });

    if (bookInsertError) throw bookInsertError;
    createdBook = true;
  }

  const { data: existingTest, error: testLookupError } = await supabase
    .from("tests")
    .select("id")
    .eq("book_id", bookId)
    .eq("id", testId)
    .maybeSingle();

  if (testLookupError) throw testLookupError;

  if (!existingTest) {
    const { data: maxSortRow } = await supabase
      .from("tests")
      .select("sort_order")
      .eq("book_id", bookId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const sortOrder = ((maxSortRow?.sort_order as number | undefined) ?? 0) + 1;

    const { error: testInsertError } = await supabase.from("tests").insert({
      book_id: bookId,
      id: testId,
      label: labelFromCatalogId(testId),
      sort_order: sortOrder,
      published: false,
      listening_published: false,
      reading_published: false,
      access_tier: "free",
    });

    if (testInsertError) throw testInsertError;
    createdTest = true;

    const partRows = [...listeningParts, ...readingParts].map((part) => ({
      book_id: bookId,
      test_id: testId,
      part: String(part.part),
      title: part.title,
      question_count_target: part.questionCount,
      sort_order: part.part,
    }));

    const { error: partsError } = await supabase
      .from("test_parts")
      .insert(partRows);

    if (partsError) throw partsError;
  }

  return { bookId, testId, createdBook, createdTest };
}
