import type { SupabaseClient } from "@supabase/supabase-js";

export async function replaceLecturePracticeQuestions(
  supabase: SupabaseClient,
  lectureId: string,
  questionIds: string[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("lecture_practice_questions")
    .delete()
    .eq("lecture_id", lectureId);
  if (deleteError) throw deleteError;
  if (questionIds.length === 0) return;

  const { error } = await supabase.from("lecture_practice_questions").insert(
    questionIds.map((questionId, index) => ({
      lecture_id: lectureId,
      question_id: questionId,
      sort_order: index + 1,
    })),
  );
  if (error) throw error;
}
