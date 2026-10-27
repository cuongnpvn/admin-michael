import { createClient } from "@/lib/supabase/server";
import {
  getBookFromCatalog,
  getDefaultBookFromCatalog,
  loadCatalog,
} from "@/lib/content/load-catalog";
import type { BookCatalogEntry, DataCatalog } from "@/types/test-data";

export async function loadAdminCatalog(): Promise<DataCatalog> {
  const supabase = await createClient();
  return loadCatalog(supabase);
}

export async function loadAdminBook(
  bookId: string,
): Promise<BookCatalogEntry | undefined> {
  const catalog = await loadAdminCatalog();
  return getBookFromCatalog(catalog, bookId);
}

export async function loadDefaultAdminBook(): Promise<BookCatalogEntry | null> {
  const catalog = await loadAdminCatalog();
  return getDefaultBookFromCatalog(catalog);
}
