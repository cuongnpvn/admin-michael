import { getBookFromCatalog } from "@/lib/content/load-catalog";
import type { DataCatalog } from "@/types/test-data";

export interface CatalogDisplayNames {
  bookName: string;
  testLabel: string;
}

export function catalogDisplayKey(bookId: string, testId: string): string {
  return `${bookId}::${testId}`;
}

export function resolveCatalogDisplay(
  catalog: DataCatalog,
  bookId: string,
  testId: string,
): CatalogDisplayNames {
  const book = getBookFromCatalog(catalog, bookId);
  const test = book?.tests.find((entry) => entry.id === testId);

  return {
    bookName: book?.name ?? bookId,
    testLabel: test?.label ?? testId,
  };
}

export function buildCatalogDisplayLookup(
  catalog: DataCatalog,
): Map<string, CatalogDisplayNames> {
  const lookup = new Map<string, CatalogDisplayNames>();

  for (const book of catalog.books) {
    for (const test of book.tests) {
      lookup.set(catalogDisplayKey(book.id, test.id), {
        bookName: book.name,
        testLabel: test.label,
      });
    }
  }

  return lookup;
}

const CATALOG_TITLE_SEPARATOR = " · ";

export function formatCatalogDisplayLabel(label: string): string {
  return label.toUpperCase();
}

export function formatCatalogTitleReference(
  bookName: string,
  testLabel: string,
  separator: string = CATALOG_TITLE_SEPARATOR,
): string {
  return `${formatCatalogDisplayLabel(bookName)}${separator}${formatCatalogDisplayLabel(testLabel)}`;
}

/** Uppercase book and test segments in stored deck titles like "Ets 2026 · Test 1 · Listening". */
export function formatVocabDeckDisplayName(name: string): string {
  const parts = name.split(CATALOG_TITLE_SEPARATOR);
  if (parts.length < 2) return name;

  return [
    formatCatalogDisplayLabel(parts[0]!),
    formatCatalogDisplayLabel(parts[1]!),
    ...parts.slice(2),
  ].join(CATALOG_TITLE_SEPARATOR);
}

export function formatCatalogTestReference(
  bookName: string,
  testLabel: string,
): string {
  return `${formatCatalogDisplayLabel(bookName)} / ${formatCatalogDisplayLabel(testLabel)}`;
}
