import {
  buildListeningCatalogItems,
  buildReadingCatalogItems,
  type StudySectionCatalog,
} from "@/lib/catalog/study-section-items";
import { loadDraftBundle } from "@/lib/content/load-draft-bundle";
import {
  compileListeningPart,
  compileReadingPart,
} from "@/lib/content/publish-compiler";
import { createClient } from "@/lib/supabase/server";
import type { ReadingPartData } from "@/types/test-data";
import type { BookCatalogEntry } from "@/types/test-data";
import type { PublishSection } from "@/lib/content/validate-section-counts";

function supabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
}

async function loadAdminListeningTestItems(bookId: string, testId: string) {
  const supabase = await createClient();
  const result = await loadDraftBundle(supabase, bookId, testId, {
    parts: [1, 2, 3, 4],
    requirePublished: false,
  });

  if (!result) {
    return buildListeningCatalogItems({});
  }

  const parts: Partial<Record<1 | 2 | 3 | 4, NonNullable<Awaited<ReturnType<typeof compileListeningPart>>>>> =
    {};

  for (const part of [1, 2, 3, 4] as const) {
    const compiled = compileListeningPart(result.bundle, part, supabaseUrl());
    if (compiled) {
      parts[part] = compiled;
    }
  }

  return buildListeningCatalogItems(parts);
}

async function loadAdminReadingTestItems(bookId: string, testId: string) {
  const supabase = await createClient();
  const result = await loadDraftBundle(supabase, bookId, testId, {
    parts: [5, 6, 7],
    requirePublished: false,
  });

  const parts: Partial<Record<5 | 6 | 7, ReadingPartData>> = {};

  if (result) {
    for (const part of [5, 6, 7] as const) {
      const compiled = compileReadingPart(result.bundle, part, supabaseUrl());
      if (compiled) {
        parts[part] = compiled;
      }
    }
  }

  return buildReadingCatalogItems(parts);
}

export async function loadAdminSectionCatalog(
  books: BookCatalogEntry[],
  section: PublishSection,
): Promise<StudySectionCatalog> {
  const bookEntries = await Promise.all(
    books.map(async (book) => {
      const tests = await Promise.all(
        book.tests.map(async (test) => {
          const items =
            section === "listening"
              ? await loadAdminListeningTestItems(book.id, test.id)
              : await loadAdminReadingTestItems(book.id, test.id);

          return {
            id: test.id,
            label: test.label,
            available: true,
            items,
          };
        }),
      );

      return {
        id: book.id,
        name: book.name,
        tests,
      };
    }),
  );

  return { books: bookEntries.filter((book) => book.tests.length > 0) };
}
