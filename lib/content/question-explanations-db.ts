import type { SupabaseClient } from "@supabase/supabase-js";
import {
  explanationToDbJson,
  type QuestionExplanation,
} from "@/lib/content/question-explanation";
import { chunkForInQuery } from "@/lib/supabase/batch-in-query";

export async function upsertQuestionExplanation(
  supabase: SupabaseClient,
  questionId: string,
  explanation: QuestionExplanation | null | undefined,
): Promise<void> {
  const payload = explanationToDbJson(explanation ?? null);

  if (payload == null) {
    const { error } = await supabase
      .from("question_explanations")
      .delete()
      .eq("question_id", questionId);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("question_explanations").upsert(
    {
      question_id: questionId,
      explanation: payload,
    },
    { onConflict: "question_id" },
  );
  if (error) throw error;
}

export async function fetchQuestionExplanationsByIds(
  supabase: SupabaseClient,
  questionIds: string[],
): Promise<Map<string, unknown>> {
  const byId = new Map<string, unknown>();
  if (questionIds.length === 0) return byId;

  for (const batch of chunkForInQuery(questionIds)) {
    const { data, error } = await supabase
      .from("question_explanations")
      .select("question_id, explanation")
      .in("question_id", batch);

    if (error) throw error;

    for (const row of data ?? []) {
      const questionId = (row as { question_id: string }).question_id;
      byId.set(questionId, (row as { explanation: unknown }).explanation);
    }
  }

  return byId;
}
