"use server";

import { copy } from "@/lib/copy/vi";
import { UserAccessError, requireUserSession } from "@/lib/learning/require-user";
import { mapHydratedPracticeQuestions } from "@/lib/lectures/tutor/hydrate-practice-questions";
import {
  resolveLectureSkillTags,
  tutorPracticeUnavailableMessage,
} from "@/lib/lectures/tutor/lecture-skill-tags";
import { searchPart5Questions } from "@/lib/lectures/tutor/search-part5-questions";
import type { ConfirmTutorPracticeResult } from "@/lib/lectures/tutor/types";

export async function confirmTutorPractice(input: {
  lectureId: string;
}): Promise<ConfirmTutorPracticeResult> {
  try {
    const { supabase } = await requireUserSession();
    const [{ data: hasPro }, { data: isAdmin }] = await Promise.all([
      supabase.rpc("has_pro_access"),
      supabase.rpc("is_admin"),
    ]);
    if (!hasPro && !isAdmin) {
      return { ok: false, error: copy.lectures.tutorProRequired };
    }
    if (!input.lectureId) {
      return { ok: false, error: copy.lectures.tutorPracticeFailed };
    }

    const { data: lecture, error: lectureError } = await supabase
      .from("lectures")
      .select("id, tags")
      .eq("id", input.lectureId)
      .eq("published", true)
      .maybeSingle();
    if (lectureError) throw lectureError;
    if (!lecture) {
      return { ok: false, error: copy.lectures.tutorPracticeFailed };
    }

    const tags = Array.isArray(lecture.tags)
      ? lecture.tags.filter((tag): tag is string => typeof tag === "string")
      : [];
    const unavailable = tutorPracticeUnavailableMessage(tags);
    if (unavailable) return { ok: false, error: unavailable };

    const skillTags = resolveLectureSkillTags(tags);
    const questionIds = await searchPart5Questions(supabase, skillTags);
    if (questionIds.length === 0) {
      return { ok: false, error: copy.lectures.tutorPracticeEmpty };
    }

    const { data: questionRows, error: questionError } = await supabase
      .from("questions")
      .select(
        "id, prompt, answer_options!answer_options_question_id_fkey(id, label, text, sort_order)",
      )
      .eq("part", "5")
      .in("id", questionIds);
    if (questionError) throw questionError;

    const questions = mapHydratedPracticeQuestions(questionRows, questionIds);
    if (questions.length === 0) {
      return { ok: false, error: copy.lectures.tutorPracticeEmpty };
    }

    return {
      ok: true,
      set: {
        questionIds: questions.map((question) => question.id),
        questions,
      },
    };
  } catch (error) {
    console.error("confirmTutorPractice", error);
    if (error instanceof UserAccessError) {
      return { ok: false, error: copy.lectures.tutorPracticeFailed };
    }
    return { ok: false, error: copy.lectures.tutorPracticeFailed };
  }
}
