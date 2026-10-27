"use server";

import { revalidatePath } from "next/cache";
import {
  AdminAccessError,
  requireAdminSession,
} from "@/lib/admin/auth/require-admin";
import { replaceLecturePracticeQuestions } from "@/lib/admin/lectures/persist-practice-questions";
import { replaceLectureQuestions } from "@/lib/admin/lectures/persist-questions";
import { replaceLectureVocabItems } from "@/lib/admin/lectures/persist-vocab";
import { syncLectureRagIndex } from "@/lib/lectures/rag/reindex-lecture";
import { copy } from "@/lib/copy/vi";
import type { LectureFormat } from "@/lib/lectures/types";
import type { LectureQuestionInsert } from "@/lib/lectures/options";
import { parseLectureFormat } from "@/lib/lectures/format";
import { normalizeLectureTags } from "@/lib/lectures/tags";
import type { LectureVocabDraft } from "@/lib/lectures/vocab";
import {
  adminLectureCollectionPath,
  adminLectureEditorPath,
  adminLecturesPath,
} from "@/lib/lectures/paths";
import { sanitizeLectureHtml } from "@/lib/lectures/sanitize-html";
import {
  ensureUniqueLectureSlug,
  slugifyLectureTitle,
} from "@/lib/lectures/slug";
import type { AdminLectureActionResult } from "@/lib/admin/lectures/collection-actions";

function accessError(code: string): string {
  if (code === "not_signed_in") return copy.admin.lectures.errors.notSignedIn;
  if (code === "not_admin") return copy.admin.lectures.errors.notAdmin;
  return copy.admin.lectures.errors.generic;
}

export interface SaveLectureEditorInput {
  lectureId: string;
  collectionId: string;
  title: string;
  excerpt: string;
  bodyHtml: string;
  tags: string[];
  estimatedMinutes: number | null;
  dayNumber: number | null;
  reviewGoal: string;
  isRestDay: boolean;
  isMiniTestDay: boolean;
  isFinalTestDay: boolean;
  format: LectureFormat;
  questions: LectureQuestionInsert[];
  practiceQuestionIds: string[];
  vocabItems: LectureVocabDraft[];
}

function isDayTakenError(error: { code?: string; message?: string }): boolean {
  return (
    error.code === "23505" ||
    (error.message ?? "").includes("idx_lectures_collection_day")
  );
}

export async function saveLectureEditor(
  input: SaveLectureEditorInput,
): Promise<AdminLectureActionResult> {
  try {
    const title = input.title.trim();
    if (!title) return { ok: false, error: copy.admin.lectures.errors.titleRequired };
    if (
      input.dayNumber != null &&
      (!Number.isInteger(input.dayNumber) || input.dayNumber < 1)
    ) {
      return { ok: false, error: copy.admin.lectures.errors.dayInvalid };
    }
    if (
      input.format === "vocab" &&
      input.vocabItems.some(
        (item) => !item.term.trim() || !item.meaningVi.trim(),
      )
    ) {
      return { ok: false, error: copy.admin.lectures.errors.vocabRequired };
    }

    const { supabase } = await requireAdminSession();
    const { data: existing, error: existingError } = await supabase
      .from("lectures")
      .select("id, slug")
      .eq("collection_id", input.collectionId);

    if (existingError) return { ok: false, error: existingError.message };

    const currentSlug = (existing ?? []).find((row) => row.id === input.lectureId)
      ?.slug as string | undefined;
    const slug =
      currentSlug ||
      ensureUniqueLectureSlug(
        slugifyLectureTitle(title) || input.lectureId.slice(0, 8),
        (existing ?? [])
          .filter((row) => row.id !== input.lectureId)
          .map((row) => row.slug as string),
      );

    const { error } = await supabase
      .from("lectures")
      .update({
        title,
        excerpt: input.excerpt.trim(),
        slug,
        body_html: sanitizeLectureHtml(input.bodyHtml),
        tags: normalizeLectureTags(input.tags),
        estimated_minutes: input.estimatedMinutes,
        day_number: input.dayNumber,
        review_goal: input.reviewGoal.trim(),
        is_rest_day: input.isRestDay,
        is_mini_test_day: input.isMiniTestDay,
        is_final_test_day: input.isFinalTestDay,
        format: parseLectureFormat(input.format),
      })
      .eq("id", input.lectureId)
      .eq("collection_id", input.collectionId);

    if (error) {
      return {
        ok: false,
        error: isDayTakenError(error)
          ? copy.admin.lectures.errors.dayTaken
          : error.message,
      };
    }

    await replaceLectureQuestions(supabase, input.lectureId, input.questions);
    await replaceLecturePracticeQuestions(
      supabase,
      input.lectureId,
      input.practiceQuestionIds,
    );
    if (input.format === "vocab") {
      await replaceLectureVocabItems(
        supabase,
        input.lectureId,
        input.vocabItems,
      );
    }
    await syncLectureRagIndex(input.lectureId);

    revalidatePath(adminLecturesPath());
    revalidatePath(adminLectureCollectionPath(input.collectionId));
    revalidatePath(adminLectureEditorPath(input.collectionId, input.lectureId));
    return { ok: true, lectureId: input.lectureId };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return { ok: false, error: copy.admin.lectures.errors.generic };
  }
}

export async function publishLecture(input: {
  lectureId: string;
  collectionId: string;
  published: boolean;
}): Promise<AdminLectureActionResult> {
  try {
    const { supabase } = await requireAdminSession();
    const { data, error: loadError } = await supabase
      .from("lectures")
      .select("id, body_html, published_at, day_number, format")
      .eq("id", input.lectureId)
      .eq("collection_id", input.collectionId)
      .maybeSingle();

    if (loadError) return { ok: false, error: loadError.message };
    if (!data) return { ok: false, error: copy.admin.lectures.errors.generic };

    const scheduled = data.day_number != null;
    const isVocab = data.format === "vocab";
    if (input.published && isVocab) {
      const { count, error: vocabError } = await supabase
        .from("lecture_vocab_items")
        .select("id", { count: "exact", head: true })
        .eq("lecture_id", input.lectureId);
      if (vocabError) return { ok: false, error: vocabError.message };
      if ((count ?? 0) === 0) {
        return { ok: false, error: copy.admin.lectures.errors.vocabRequired };
      }
    } else if (
      input.published &&
      !scheduled &&
      !String(data.body_html ?? "").trim()
    ) {
      return { ok: false, error: copy.admin.lectures.errors.bodyRequired };
    }

    const { error } = await supabase
      .from("lectures")
      .update({
        published: input.published,
        published_at: input.published
          ? ((data.published_at as string | null) ?? new Date().toISOString())
          : null,
      })
      .eq("id", input.lectureId);

    if (error) return { ok: false, error: error.message };

    await syncLectureRagIndex(input.lectureId);

    revalidatePath(adminLecturesPath());
    revalidatePath(adminLectureCollectionPath(input.collectionId));
    return { ok: true, lectureId: input.lectureId };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return { ok: false, error: copy.admin.lectures.errors.generic };
  }
}

export async function deleteLecture(input: {
  lectureId: string;
  collectionId: string;
}): Promise<AdminLectureActionResult> {
  try {
    const { supabase } = await requireAdminSession();
    const { count, error: countError } = await supabase
      .from("user_lecture_progress")
      .select("lecture_id", { count: "exact", head: true })
      .eq("lecture_id", input.lectureId);

    if (countError) return { ok: false, error: countError.message };
    if ((count ?? 0) > 0) {
      return { ok: false, error: copy.admin.lectures.errors.hasProgress };
    }

    const { error } = await supabase
      .from("lectures")
      .delete()
      .eq("id", input.lectureId)
      .eq("collection_id", input.collectionId);

    if (error) return { ok: false, error: error.message };

    revalidatePath(adminLecturesPath());
    revalidatePath(adminLectureCollectionPath(input.collectionId));
    return { ok: true };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return { ok: false, error: copy.admin.lectures.errors.generic };
  }
}
