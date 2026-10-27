import type { SupabaseClient } from "@supabase/supabase-js";
import { publicPayload, secretAnswer } from "@/lib/lectures/exercise";
import type { LectureQuestionInsert } from "@/lib/lectures/options";

export async function replaceLectureQuestions(
  supabase: SupabaseClient,
  lectureId: string,
  questions: LectureQuestionInsert[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("lecture_questions")
    .delete()
    .eq("lecture_id", lectureId);

  if (deleteError) throw deleteError;
  if (questions.length === 0) return;

  const { data: inserted, error: insertError } = await supabase
    .from("lecture_questions")
    .insert(
      questions.map((question) => ({
        lecture_id: lectureId,
        sort_order: question.sortOrder,
        kind: question.kind,
        stem: question.stem,
        options: question.kind === "multiple_choice" ? question.options : [],
        payload: publicPayload(question.kind, question.payload),
      })),
    )
    .select("id, sort_order");

  if (insertError) throw insertError;

  const idBySort = new Map(
    (inserted ?? []).map((row) => [row.sort_order as number, row.id as string]),
  );

  const keys = questions.map((question) => {
    const questionId = idBySort.get(question.sortOrder);
    if (!questionId) {
      throw new Error("Failed to persist lecture question keys");
    }
    return {
      question_id: questionId,
      correct_option_id:
        question.kind === "multiple_choice" ? question.correctOptionId : null,
      answer: secretAnswer(question.kind, question.answer),
      explanation: question.explanation,
    };
  });

  const { error: keyError } = await supabase
    .from("lecture_question_keys")
    .insert(keys);

  if (keyError) throw keyError;
}
