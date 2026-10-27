"use server";

import { parseQuestionExplanation } from "@/lib/content/question-explanation";
import { copy } from "@/lib/copy/vi";
import { fetchQuestionExplanationsByIds } from "@/lib/content/question-explanations-db";
import { UserAccessError, requireUserSession } from "@/lib/learning/require-user";
import type { SubmitTutorPracticeResult } from "@/lib/lectures/tutor/types";

function explanationText(value: unknown): string {
  return parseQuestionExplanation(value)?.reasoning.trim() ?? "";
}

export async function submitTutorPractice(input: {
  questionIds: string[];
  answers: Record<string, string>;
}): Promise<SubmitTutorPracticeResult> {
  try {
    const { supabase } = await requireUserSession();
    const [{ data: hasPro }, { data: isAdmin }] = await Promise.all([
      supabase.rpc("has_pro_access"),
      supabase.rpc("is_admin"),
    ]);
    if (!hasPro && !isAdmin) {
      return { ok: false, error: copy.lectures.tutorProRequired };
    }

    const questionIds = [...new Set(input.questionIds.filter(Boolean))];
    if (questionIds.length === 0) {
      return { ok: false, error: copy.lectures.submitFailed };
    }
    const incomplete = questionIds.some((id) => !input.answers[id]);
    if (incomplete) {
      return { ok: false, error: copy.lectures.incomplete };
    }

    const { data: rows, error } = await supabase
      .from("questions")
      .select("id, correct_option_id")
      .eq("part", "5")
      .in("id", questionIds);
    if (error) throw error;

    const keyById = new Map(
      (rows ?? []).flatMap((row) => {
        const id = String(row.id ?? "");
        const correctOptionId = String(row.correct_option_id ?? "");
        return id && correctOptionId ? [[id, correctOptionId] as const] : [];
      }),
    );
    if (keyById.size !== questionIds.length) {
      return { ok: false, error: copy.lectures.submitFailed };
    }

    const explanations = await fetchQuestionExplanationsByIds(
      supabase,
      questionIds,
    );

    let correctCount = 0;
    const results = questionIds.map((questionId) => {
      const correctOptionId = keyById.get(questionId)!;
      const selectedOptionId = input.answers[questionId] ?? null;
      const correct = selectedOptionId === correctOptionId;
      if (correct) correctCount += 1;
      return {
        questionId,
        selectedOptionId,
        correct,
        correctOptionId,
        explanation: explanationText(explanations.get(questionId)),
      };
    });

    return {
      ok: true,
      correctCount,
      totalCount: questionIds.length,
      results,
    };
  } catch (error) {
    if (error instanceof UserAccessError) {
      return { ok: false, error: copy.lectures.submitFailed };
    }
    return { ok: false, error: copy.lectures.submitFailed };
  }
}
