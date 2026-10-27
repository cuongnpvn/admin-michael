import type { SupabaseClient } from "@supabase/supabase-js";
import {
  COMMON_BOOK_ID,
  isManagedExamBook,
} from "@/lib/content/catalog-ids";
import type {
  AccessTier,
  BookCatalogEntry,
  DataCatalog,
  TestCatalogEntry,
} from "@/types/test-data";
import type { PublishSection } from "@/lib/content/publish-test";

export const DEFAULT_BOOK_ID = "ets-2026";
export const DEFAULT_TEST_ID = "test-1";

type TestRow = {
  id: string;
  label: string;
  sort_order?: number | null;
  published: boolean;
  listening_published: boolean;
  reading_published: boolean;
  access_tier?: AccessTier | null;
};

function mapAccessTier(value: unknown): AccessTier {
  return value === "pro" ? "pro" : "free";
}

function mapTestRow(test: TestRow): TestCatalogEntry {
  return {
    id: test.id,
    label: test.label,
    sortOrder: Number(test.sort_order ?? 0),
    published: Boolean(test.published),
    listeningPublished: Boolean(test.listening_published),
    readingPublished: Boolean(test.reading_published),
    accessTier: mapAccessTier(test.access_tier),
  };
}

export async function loadCatalog(
  supabase: SupabaseClient,
): Promise<DataCatalog> {
  const { data: books, error } = await supabase
    .from("books")
    .select(
      `
      id,
      name,
      publisher,
      year,
      sort_order,
      tests (
        id,
        label,
        sort_order,
        published,
        listening_published,
        reading_published,
        access_tier
      )
    `,
    )
    .order("sort_order", { ascending: true })
    .order("sort_order", { referencedTable: "tests", ascending: true })
    .order("id", { referencedTable: "tests", ascending: true });

  if (error) throw error;

  const catalogBooks: BookCatalogEntry[] = (books ?? []).map((book) => {
    const tests = ((book.tests ?? []) as TestRow[])
      .map(mapTestRow)
      .sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return a.id.localeCompare(b.id, undefined, { numeric: true });
      });

    return {
      id: book.id as BookCatalogEntry["id"],
      name: book.name as string,
      publisher: book.publisher as string,
      year: book.year as number,
      tests,
    };
  });

  return { books: catalogBooks };
}

/** Learner exam catalog: excludes common practice and entrance tests. */
export function filterExamCatalog(catalog: DataCatalog): DataCatalog {
  return {
    books: catalog.books
      .filter((book) => isManagedExamBook(book.id))
      .map((book) => ({
        ...book,
        tests: book.tests,
      })),
  };
}

/** Admin Bộ đề catalog: excludes common practice and entrance tests. */
export function filterManagedExamCatalog(catalog: DataCatalog): DataCatalog {
  return {
    books: catalog.books.filter((book) => isManagedExamBook(book.id)),
  };
}

export function getCommonPracticeBook(
  catalog: DataCatalog,
): BookCatalogEntry | undefined {
  return getBookFromCatalog(catalog, COMMON_BOOK_ID);
}

export function getBookFromCatalog(
  catalog: DataCatalog,
  bookId: string,
): BookCatalogEntry | undefined {
  return catalog.books.find((book) => book.id === bookId);
}

export function isTestPublishedInCatalog(
  catalog: DataCatalog,
  bookId: string,
  testId: string,
): boolean {
  const book = getBookFromCatalog(catalog, bookId);
  const test = book?.tests.find((entry) => entry.id === testId);
  return test?.published ?? false;
}

/** Study listening: section flag or full exam publish. */
export function isTestListeningStudyAvailable(test: TestCatalogEntry): boolean {
  return test.listeningPublished || test.published;
}

/** Study reading: section flag or full exam publish. */
export function isTestReadingStudyAvailable(test: TestCatalogEntry): boolean {
  return test.readingPublished || test.published;
}

export function isTestSectionStudyAvailable(
  test: TestCatalogEntry,
  section: PublishSection,
): boolean {
  return section === "listening"
    ? isTestListeningStudyAvailable(test)
    : isTestReadingStudyAvailable(test);
}

export function isTestSectionPublishedInCatalog(
  catalog: DataCatalog,
  bookId: string,
  testId: string,
  section: PublishSection,
): boolean {
  const book = getBookFromCatalog(catalog, bookId);
  const test = book?.tests.find((entry) => entry.id === testId);
  if (!test) return false;
  return isTestSectionStudyAvailable(test, section);
}

export function getDefaultBookFromCatalog(
  catalog: DataCatalog,
): BookCatalogEntry | null {
  const examBooks = filterExamCatalog(catalog).books;
  if (examBooks.length === 0) return null;
  return getBookFromCatalog(catalog, DEFAULT_BOOK_ID) ?? examBooks[0] ?? null;
}

export function bookWithPublishedTests(
  book: BookCatalogEntry,
): BookCatalogEntry | null {
  const tests = book.tests.filter((test) => test.published);
  if (tests.length === 0) return null;
  return { ...book, tests };
}

export function bookWithPublishedListeningTests(
  book: BookCatalogEntry,
): BookCatalogEntry | null {
  const tests = book.tests.filter((test) => isTestListeningStudyAvailable(test));
  if (tests.length === 0) return null;
  return { ...book, tests };
}

export function bookWithPublishedReadingTests(
  book: BookCatalogEntry,
): BookCatalogEntry | null {
  const tests = book.tests.filter((test) => isTestReadingStudyAvailable(test));
  if (tests.length === 0) return null;
  return { ...book, tests };
}

export function bookWithPublishedSectionTests(
  book: BookCatalogEntry,
  section: PublishSection,
): BookCatalogEntry | null {
  return section === "listening"
    ? bookWithPublishedListeningTests(book)
    : bookWithPublishedReadingTests(book);
}
