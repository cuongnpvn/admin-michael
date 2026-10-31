import { isEntranceTestBook } from "@/lib/content/catalog-ids";
import type { PublishSection } from "@/lib/content/publish-test";
import type { BookCatalogEntry } from "@/types/test-data";

export const ADMIN_ENTRANCE_TEST_PATH = "/entrance-test";

export function adminEntranceTestPath(
  testId?: string,
  extra?: Record<string, string>,
): string {
  const params = new URLSearchParams();
  if (testId) params.set("testId", testId);
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value) params.set(key, value);
    }
  }
  const query = params.toString();
  return query ? `${ADMIN_ENTRANCE_TEST_PATH}?${query}` : ADMIN_ENTRANCE_TEST_PATH;
}

function adminExamsQueryPath(
  bookId: string,
  testId: string,
  extra?: Record<string, string>,
): string {
  if (isEntranceTestBook(bookId)) {
    return adminEntranceTestPath(testId, extra);
  }
  const params = new URLSearchParams({ bookId, testId, ...extra });
  return `/exams?${params.toString()}`;
}

export function adminExamsPath(bookId: string, testId: string): string {
  return adminExamsQueryPath(bookId, testId);
}

export function adminVocabPath(): string {
  return "/vocab";
}

export function adminVocabDeckPath(deckId: string): string {
  return `/vocab/${deckId}`;
}

export function adminAnswerKeysPath(): string {
  return "/answer-keys";
}

export function adminBlogPath(): string {
  return "/blog";
}

export function adminUsersPath(): string {
  return "/users";
}

export function adminSubscriptionsPath(bookId?: string): string {
  if (!bookId) return "/subscriptions";
  const params = new URLSearchParams({ bookId });
  return `/subscriptions?${params.toString()}`;
}

export function adminNotificationsPath(): string {
  return "/notifications";
}

export function adminBlogNewPath(): string {
  return "/blog/new";
}

export function adminBlogEditPath(postId: string): string {
  return `/blog/${postId}/edit`;
}

/** @deprecated Listening admin routes are temporarily disabled; use exams + section. */
export function adminListeningPath(bookId: string, testId: string): string {
  return adminExamsQueryPath(bookId, testId, { section: "listening" });
}

/** @deprecated Reading admin routes are temporarily disabled; use exams + section. */
export function adminReadingPath(bookId: string, testId: string): string {
  return adminExamsQueryPath(bookId, testId, { section: "reading" });
}

export function adminSectionTestPath(
  section: PublishSection | "exam",
  bookId: string,
  testId: string,
): string {
  if (section === "listening" || section === "reading") {
    return adminExamsQueryPath(bookId, testId, { section });
  }
  return adminExamsPath(bookId, testId);
}

export function adminPartPath(
  bookId: string,
  testId: string,
  part: number,
  questionSlug?: string,
  section?: PublishSection,
): string {
  const extra: Record<string, string> = { part: String(part) };
  if (questionSlug) {
    extra.question = questionSlug;
  }
  if (section) {
    extra.section = section;
  }
  return adminExamsQueryPath(bookId, testId, extra);
}

export function formatAdminTestTitle(
  book: BookCatalogEntry,
  testLabel: string,
): string {
  return `${book.name} — ${testLabel}`;
}
