import { revalidatePath, updateTag } from "next/cache";

export const PUBLISHED_CATALOG_CACHE_TAG = "catalog";
export const PUBLISHED_CONTENT_ALL_CACHE_TAG = "published-content-all";

export function publishedTestCacheTag(bookId: string, testId: string): string {
  return `test:${bookId}:${testId}`;
}

const CUSTOMER_PATHS = [
  "/practice",
  "/listening",
  "/reading",
  "/vocab",
  "/exam",
] as const;

function revalidateCustomerLayouts(): void {
  for (const route of CUSTOMER_PATHS) {
    revalidatePath(route, "layout");
  }
}

/** Invalidate cached learner content after admin draft/publish changes. */
export function revalidatePublishedContent(
  bookId: string,
  testId: string,
): void {
  updateTag(publishedTestCacheTag(bookId, testId));
  updateTag(PUBLISHED_CATALOG_CACHE_TAG);
  updateTag(PUBLISHED_CONTENT_ALL_CACHE_TAG);
  revalidateCustomerLayouts();
}

export function revalidatePublishedCatalog(): void {
  updateTag(PUBLISHED_CATALOG_CACHE_TAG);
  revalidateCustomerLayouts();
}

/** Bust every published-test cache (universal entitlement changes). */
export function revalidateAllPublishedContent(
  tests: Array<{ bookId: string; testId: string }> = [],
): void {
  updateTag(PUBLISHED_CATALOG_CACHE_TAG);
  updateTag(PUBLISHED_CONTENT_ALL_CACHE_TAG);
  for (const test of tests) {
    updateTag(publishedTestCacheTag(test.bookId, test.testId));
  }
  revalidateCustomerLayouts();
}
