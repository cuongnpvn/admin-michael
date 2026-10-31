import { notFound, redirect } from "next/navigation";
import { AdminCreateExamTestDialog } from "@/components/admin/exams/admin-create-exam-test-dialog";
import { AdminReorderExamBooksDialog } from "@/components/admin/exams/admin-reorder-exam-books-dialog";
import { AdminReorderExamTestsDialog } from "@/components/admin/exams/admin-reorder-exam-tests-dialog";
import { AdminSectionBookTabs } from "@/components/admin/section/admin-section-book-tabs";
import { adminPartPath, adminEntranceTestPath } from "@/lib/admin/admin-paths";
import { loadAdminExamCatalog } from "@/lib/admin/load-section-admin-data";
import { isEntranceTestBook } from "@/lib/content/catalog-ids";
import { loadAdminTestTabData } from "@/lib/admin/load-admin-test-tab-data";
import { renderAdminPartPage } from "@/lib/admin/render-admin-part-page";
import { copy } from "@/lib/copy/vi";
import type { AdminTestStats } from "@/lib/admin/content/stats";
import type { PublishSection } from "@/lib/content/publish-test";

type ExamsSearchParams = {
  bookId?: string;
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

export default async function AdminExamsPage({
  searchParams,
}: {
  searchParams: Promise<ExamsSearchParams>;
}) {
  const params = await searchParams;

  if (params.bookId && isEntranceTestBook(params.bookId)) {
    if (params.part && params.testId) {
      const part = Number.parseInt(params.part, 10);
      redirect(
        adminPartPath(
          params.bookId,
          params.testId,
          part,
          params.question,
        ),
      );
    }
    redirect(adminEntranceTestPath(params.testId));
  }

  if (params.part) {
    if (!params.bookId || !params.testId) {
      notFound();
    }
    const part = Number.parseInt(params.part, 10);
    if (Number.isNaN(part) || part < 1 || part > 7) {
      notFound();
    }
    const section = resolvePublishSection(params.section, part);
    return renderAdminPartPage(
      params.bookId,
      params.testId,
      params.part,
      section,
      params.question,
    );
  }

  const examCatalog = await loadAdminExamCatalog();

  const testStatsMapByBook: Record<
    string,
    Record<string, AdminTestStats | null>
  > = {};

  const selectedBook =
    examCatalog.books.find((book) => book.id === params.bookId) ??
    examCatalog.books[0];
  const selectedTestId =
    selectedBook?.tests.find((test) => test.id === params.testId)?.id ??
    selectedBook?.tests[0]?.id;

  if (selectedBook && selectedTestId) {
    const { testStats } = await loadAdminTestTabData(
      selectedBook.id,
      selectedTestId,
    );
    testStatsMapByBook[selectedBook.id] = { [selectedTestId]: testStats };
  }

  const section: PublishSection | "exam" =
    params.section === "listening" || params.section === "reading"
      ? params.section
      : "exam";

  const title =
    section === "listening"
      ? copy.admin.listening.title
      : section === "reading"
        ? copy.admin.reading.title
        : copy.admin.exams.title;
  const subtitle =
    section === "listening"
      ? copy.admin.listening.subtitle
      : section === "reading"
        ? copy.admin.reading.subtitle
        : copy.admin.exams.selectHint;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 lg:px-8 lg:py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-muted-foreground">{subtitle}</p>
        </div>
        {section === "exam" ? (
          <div className="flex flex-wrap items-center gap-2">
            <AdminReorderExamBooksDialog books={examCatalog.books} />
            {selectedBook ? (
              <AdminReorderExamTestsDialog
                bookId={selectedBook.id}
                tests={selectedBook.tests}
              />
            ) : null}
            <AdminCreateExamTestDialog books={examCatalog.books} />
          </div>
        ) : null}
      </div>

      <AdminSectionBookTabs
        books={examCatalog.books}
        section={section}
        lazyLoadTests
        testStatsMapByBook={testStatsMapByBook}
      />
    </div>
  );
}
