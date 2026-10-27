import { isCommonBook } from "@/lib/content/catalog-ids";
import { isTestSectionStudyAvailable } from "@/lib/content/load-catalog";
import type { PublishSection } from "@/lib/content/validate-section-counts";
import type { BookCatalogEntry } from "@/types/test-data";
import type { ListeningPart, ReadingPart } from "@/types/ui";

export type SectionPartMeta = ListeningPart | ReadingPart;

export interface SectionPartItem {
  key: string;
  bookId: string;
  bookName: string;
  testId: string;
  testLabel: string;
  part: SectionPartMeta;
  isCommon: boolean;
}

export function sectionPartsFor(
  section: PublishSection,
  allParts: SectionPartMeta[],
): SectionPartMeta[] {
  return section === "listening"
    ? allParts.filter((p) => p.part <= 4)
    : allParts.filter((p) => p.part >= 5);
}

export function flattenSectionPartItems(
  books: BookCatalogEntry[],
  sectionParts: SectionPartMeta[],
): SectionPartItem[] {
  const items: SectionPartItem[] = [];

  for (const book of books) {
    for (const test of book.tests) {
      for (const part of sectionParts) {
        items.push({
          key: `${book.id}-${test.id}-${part.part}`,
          bookId: book.id,
          bookName: book.name,
          testId: test.id,
          testLabel: test.label,
          part,
          isCommon: isCommonBook(book.id),
        });
      }
    }
  }

  return items;
}

export function flattenPublishedSectionPartItems(
  books: BookCatalogEntry[],
  sectionParts: SectionPartMeta[],
  section: PublishSection,
): SectionPartItem[] {
  const publishedBooks = books
    .map((book) => ({
      ...book,
      tests: book.tests.filter((test) => isTestSectionStudyAvailable(test, section)),
    }))
    .filter((book) => book.tests.length > 0);

  return flattenSectionPartItems(publishedBooks, sectionParts);
}
