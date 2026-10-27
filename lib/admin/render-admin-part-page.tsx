import { notFound } from "next/navigation";
import { AdminPartWorkspace } from "@/components/admin/exams/admin-part-workspace";
import { loadAdminPartEditor } from "@/lib/admin/content/load-part-editor";
import { fetchAdminPartStats, fetchAdminTestStats } from "@/lib/admin/content/stats";
import { loadAdminBook } from "@/lib/admin/mock-catalog";
import { fetchPracticeDifficultyStats } from "@/lib/practice/feedback/fetch-difficulty-stats";
import type { PublishSection } from "@/lib/content/publish-test";
import { createClient } from "@/lib/supabase/server";

export async function renderAdminPartPage(
  bookId: string,
  testId: string,
  partParam: string,
  section: PublishSection,
  question?: string,
) {
  const part = Number.parseInt(partParam, 10);
  const book = await loadAdminBook(bookId);
  const test = book?.tests.find((entry) => entry.id === testId);

  if (!book || !test || part < 1 || part > 7) {
    notFound();
  }

  if (section === "listening" && part > 4) notFound();
  if (section === "reading" && part < 5) notFound();

  const supabase = await createClient();
  const { data: testRow } = await supabase
    .from("tests")
    .select("id")
    .eq("book_id", bookId)
    .eq("id", testId)
    .maybeSingle();

  if (!testRow) notFound();

  const [editorData, partStats, testStats, difficultyStatsResult] =
    await Promise.all([
      loadAdminPartEditor(supabase, bookId, testId, part),
      fetchAdminPartStats(supabase, bookId, testId, part),
      fetchAdminTestStats(supabase, bookId, testId),
      fetchPracticeDifficultyStats(supabase, bookId, testId).catch(() => new Map()),
    ]);
  const difficultyStats = difficultyStatsResult;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:px-8 lg:py-10">
      <AdminPartWorkspace
        book={book}
        test={test}
        part={part}
        partTitle={editorData?.partTitle ?? `Part ${part}`}
        editorData={editorData}
        partStats={partStats}
        testStats={testStats}
        difficultyStats={difficultyStats}
        highlightedQuestion={question}
        adminSection={section}
      />
    </div>
  );
}
