import type { SupabaseClient } from "@supabase/supabase-js";
import { extractLectureFromPdfBuffer } from "@/lib/admin/gemini/extract-lecture-from-pdf";
import { replaceLectureQuestions } from "@/lib/admin/lectures/persist-questions";
import { syncLectureRagIndex } from "@/lib/lectures/rag/reindex-lecture";
import { copy } from "@/lib/copy/vi";
import { assignLectureQuestionIds } from "@/lib/lectures/options";
import { sanitizeLectureHtml } from "@/lib/lectures/sanitize-html";
import {
  ensureUniqueLectureSlug,
  slugifyLectureTitle,
} from "@/lib/lectures/slug";

export async function nextLectureSortOrder(
  supabase: SupabaseClient,
  collectionId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("lectures")
    .select("sort_order")
    .eq("collection_id", collectionId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (Number(data?.sort_order) || 0) + 1;
}

export async function uniqueLectureSlug(
  supabase: SupabaseClient,
  collectionId: string,
  title: string,
  excludeId?: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("lectures")
    .select("id, slug")
    .eq("collection_id", collectionId);

  if (error) throw error;

  return ensureUniqueLectureSlug(
    slugifyLectureTitle(title) || `lecture-${Date.now()}`,
    (data ?? [])
      .filter((row) => row.id !== excludeId)
      .map((row) => row.slug as string),
  );
}

export async function applyLectureExtractFromPdf(
  supabase: SupabaseClient,
  input: {
    lectureId: string;
    collectionId: string;
    pdfBytes: Buffer;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const extract = await extractLectureFromPdfBuffer(input.pdfBytes);
    const nextSlug = await uniqueLectureSlug(
      supabase,
      input.collectionId,
      extract.title,
      input.lectureId,
    );
    const questions = assignLectureQuestionIds(extract.questions);

    const { error: updateError } = await supabase
      .from("lectures")
      .update({
        title: extract.title,
        excerpt: extract.excerpt,
        slug: nextSlug,
        body_html: sanitizeLectureHtml(extract.bodyHtml),
        tags: extract.tags,
        estimated_minutes: extract.estimatedMinutes,
        extract_status: "ready",
        extract_error: null,
      })
      .eq("id", input.lectureId);

    if (updateError) throw updateError;
    await replaceLectureQuestions(supabase, input.lectureId, questions);
    await syncLectureRagIndex(input.lectureId);
    return { ok: true };
  } catch (extractError) {
    const message = lectureExtractErrorMessage(extractError);
    await supabase
      .from("lectures")
      .update({ extract_status: "failed", extract_error: message })
      .eq("id", input.lectureId);
    return { ok: false, error: message };
  }
}

function lectureExtractErrorMessage(error: unknown): string {
  const message =
    error instanceof Error ? error.message : copy.admin.lectures.errors.extractFailed;
  if (/GEMINI_API_KEY/i.test(message)) {
    return copy.admin.lectures.errors.geminiMissing;
  }
  return message;
}
