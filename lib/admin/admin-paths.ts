import { isEntranceTestBook } from "@/lib/content/catalog-ids";
import type { PublishSection } from "@/lib/content/publish-test";
import type { BookCatalogEntry } from "@/types/test-data";

export const ADMIN_ENTRANCE_TEST_PATH = "/admin/entrance-test";

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
  return `/admin/exams?${params.toString()}`;
}

export function adminExamsPath(bookId: string, testId: string): string {
  return adminExamsQueryPath(bookId, testId);
}

export function adminVocabPath(): string {
  return "/admin/vocab";
}

export function adminVocabDeckPath(deckId: string): string {
  return `/admin/vocab/${deckId}`;
}

export function adminAnswerKeysPath(): string {
  return "/admin/answer-keys";
}

export function adminBlogPath(): string {
  return "/admin/blog";
}

export function adminUsersPath(): string {
  return "/admin/users";
}

export function adminSubscriptionsPath(bookId?: string): string {
  if (!bookId) return "/admin/subscriptions";
  const params = new URLSearchParams({ bookId });
  return `/admin/subscriptions?${params.toString()}`;
}

export function adminNotificationsPath(): string {
  return "/admin/notifications";
}

export function adminBlogNewPath(): string {
  return "/admin/blog/new";
}

export function adminBlogEditPath(postId: string): string {
  return `/admin/blog/${postId}/edit`;
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
