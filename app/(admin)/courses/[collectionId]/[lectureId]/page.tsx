import { notFound } from "next/navigation";
import { AdminLectureEditor } from "@/components/admin/lectures/admin-lecture-editor";
import { UploadLecturePdfDialog } from "@/components/admin/lectures/upload-lecture-pdf-dialog";
import { fetchAdminLectureEditor } from "@/lib/admin/lectures/load-admin-lectures";
import { loadLectureVocabItems } from "@/lib/lectures/vocab";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLectureEditorPage({
  params,
}: {
  params: Promise<{ collectionId: string; lectureId: string }>;
}) {
  const { collectionId, lectureId } = await params;
  const { lecture, questions, practiceQuestions } = await fetchAdminLectureEditor(
    collectionId,
    lectureId,
  );
  if (!lecture) notFound();

  const supabase = await createClient();
  const vocabItems = await loadLectureVocabItems(supabase, lecture.id);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:px-8 lg:py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{lecture.title}</h1>
        {lecture.format === "vocab" ? null : (
          <UploadLecturePdfDialog
            collectionId={collectionId}
            lectureId={lectureId}
          />
        )}
      </div>
      <AdminLectureEditor
        lecture={lecture}
        questions={questions}
        practiceQuestions={practiceQuestions}
        vocabItems={vocabItems}
      />
    </div>
  );
}
