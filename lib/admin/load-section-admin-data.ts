import { loadAdminCatalog } from "@/lib/admin/load-admin-catalog";
import { ENTRANCE_TEST_BOOK_ID } from "@/lib/content/catalog-ids";
import {
  filterManagedExamCatalog,
  getBookFromCatalog,
  getCommonPracticeBook,
} from "@/lib/content/load-catalog";
import { fetchAdminTestsStats } from "@/lib/admin/content/stats";
import { createClient } from "@/lib/supabase/server";
import type { AdminTestStats } from "@/lib/admin/content/stats";
import type { BookCatalogEntry, DataCatalog } from "@/types/test-data";

export async function loadAdminExamCatalog(): Promise<DataCatalog> {
  const catalog = await loadAdminCatalog();
  return filterManagedExamCatalog(catalog);
}

export async function loadAdminEntranceTestBook(): Promise<BookCatalogEntry | null> {
  const catalog = await loadAdminCatalog();
  return getBookFromCatalog(catalog, ENTRANCE_TEST_BOOK_ID) ?? null;
}

export async function loadAdminCommonBook(): Promise<BookCatalogEntry | null> {
  const catalog = await loadAdminCatalog();
  return getCommonPracticeBook(catalog) ?? null;
}

export async function loadTestStatsMap(
  book: BookCatalogEntry,
): Promise<Record<string, AdminTestStats>> {
  const supabase = await createClient();
  return fetchAdminTestsStats(supabase, book.id);
}
