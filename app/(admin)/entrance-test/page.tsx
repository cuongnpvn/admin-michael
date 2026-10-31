import { notFound } from "next/navigation";
import { AdminCreateExamTestDialog } from "@/components/admin/exams/admin-create-exam-test-dialog";
import { AdminReorderExamTestsDialog } from "@/components/admin/exams/admin-reorder-exam-tests-dialog";
import { AdminSectionBookTabs } from "@/components/admin/section/admin-section-book-tabs";
import { loadAdminTestTabData } from "@/lib/admin/load-admin-test-tab-data";
import { loadAdminEntranceTestBook } from "@/lib/admin/load-section-admin-data";
import { renderAdminPartPage } from "@/lib/admin/render-admin-part-page";
import { ENTRANCE_TEST_BOOK_ID } from "@/lib/content/catalog-ids";
import { copy } from "@/lib/copy/vi";
import type { AdminTestStats } from "@/lib/admin/content/stats";
import type { PublishSection } from "@/lib/content/publish-test";

type EntranceTestSearchParams = {
  testId?: string;
  part?: string;
  section?: string;
  question?: string;
};

function resolvePublishSection(
  sectionParam: string | undefined,
  part: number,
): PublishSection {
  if (sectionParam === "listening" || sectionParam === "reading") {
    return sectionParam;
  }
  return part <= 4 ? "listening" : "reading";
}

export default async function AdminEntranceTestPage({
  searchParams,
}: {
  searchParams: Promise<EntranceTestSearchParams>;
}) {
  const params = await searchParams;

  if (params.part) {
    if (!params.testId) {
      notFound();
    }
    const part = Number.parseInt(params.part, 10);
    if (Number.isNaN(part) || part < 1 || part > 7) {
      notFound();
    }
    const section = resolvePublishSection(params.section, part);
    return renderAdminPartPage(
      ENTRANCE_TEST_BOOK_ID,
      params.testId,
      params.part,
      section,
      params.question,
    );
  }

  const book = await loadAdminEntranceTestBook();
  const selectedTestId =
    book?.tests.find((test) => test.id === params.testId)?.id ??
    book?.tests[0]?.id;

  const testStatsMapByBook: Record<
    string,
    Record<string, AdminTestStats | null>
  > = {};

  if (book && selectedTestId) {
    const { testStats } = await loadAdminTestTabData(book.id, selectedTestId);
    testStatsMapByBook[book.id] = { [selectedTestId]: testStats };
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 lg:px-8 lg:py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight">
            {copy.admin.entranceTest.title}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {copy.admin.entranceTest.selectHint}
          </p>
        </div>
        {book ? (
          <div className="flex flex-wrap items-center gap-2">
            <AdminReorderExamTestsDialog
              bookId={book.id}
              tests={book.tests}
            />
            <AdminCreateExamTestDialog books={[book]} lockBook />
          </div>
        ) : null}
      </div>

      {book ? (
        <AdminSectionBookTabs
          books={[book]}
          section="exam"
          lazyLoadTests
          hideBookTabs
          testStatsMapByBook={testStatsMapByBook}
        />
      ) : (
        <p className="text-sm text-muted-foreground">{copy.admin.emptyTable}</p>
      )}
    </div>
  );
}
