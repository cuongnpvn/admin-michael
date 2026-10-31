"use server";

import { revalidateAdminExamCatalogPaths } from "@/lib/admin/revalidate-admin-exam-catalog";
import { ZodError } from "zod";
import {
  AdminAccessError,
  requireAdminSession,
} from "@/lib/admin/auth/require-admin";
import { generateAndImportListeningPart12SentenceAlignment } from "@/lib/admin/content/generate-and-import-listening-part12-sentence-alignment";
import { syncDictationItemClips } from "@/lib/admin/content/sync-dictation-item-clips";
import { buildListeningWholeAudioPath } from "@/lib/content/listening-audio-paths";
import { assertTranscriptSegmentsValid } from "@/lib/content/listening-turn-alignment-schema";
import { normalizeQuestionTranslations } from "@/lib/content/question-metadata";
import { copy } from "@/lib/copy/vi";
import type { TranscriptSegment } from "@/lib/listening/transcript-segments";

export type AlignListeningShortItemResult =
  | { ok: true; segments: TranscriptSegment[] }
  | { ok: false; error: string };

function accessError(code: string): string {
  if (code === "not_signed_in") return copy.admin.import.errors.notSignedIn;
  if (code === "not_admin") return copy.admin.import.errors.notAdmin;
  return copy.admin.cms.turnAlignment.errors.generic;
}

function mapAlignmentError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  const errors = copy.admin.cms.turnAlignment.errors;

  if (error instanceof ZodError) return errors.invalidMarks;
  if (message.includes("not found")) return errors.notFoundQuestion;
  if (message.includes("only available for Part")) return errors.unsupportedShortPart;
  if (message.includes("no speech sentences")) return errors.noSentences;
  if (message.includes("no audio")) return errors.noQuestionAudio;
  if (message.includes("GEMINI_API_KEY")) return errors.geminiMissing;
  if (message.includes("english empty")) return errors.emptyEnglish;
  if (message.includes("count mismatch") || message.includes("english mismatch")) {
    return errors.invalidMarks;
  }
  if (
    message.includes("times invalid") ||
    message.includes("overlap") ||
    message.includes("segments empty")
  ) {
    return errors.invalidTimes;
  }
  if (
    message.includes("index mismatch") ||
    message.includes("questionId mismatch")
  ) {
    return errors.invalidMarks;
  }

  return message.trim() || errors.generic;
}

async function questionPart(
  supabase: Awaited<ReturnType<typeof requireAdminSession>>["supabase"],
  bookId: string,
  testId: string,
  questionId: string,
): Promise<"1" | "2"> {
  const { data: question, error } = await supabase
    .from("questions")
    .select("part")
    .eq("id", questionId)
    .eq("book_id", bookId)
    .eq("test_id", testId)
    .maybeSingle();

  if (error) throw error;
  if (!question) {
    throw new Error("Listening question not found.");
  }
  if (question.part !== "1" && question.part !== "2") {
    throw new Error("Sentence alignment is only available for Parts 1 and 2.");
  }
  return question.part;
}

export async function alignListeningShortItem(
  bookId: string,
  testId: string,
  questionId: string,
): Promise<AlignListeningShortItemResult> {
  try {
    const { supabase } = await requireAdminSession();
    await questionPart(supabase, bookId, testId, questionId);
    const segments = await generateAndImportListeningPart12SentenceAlignment(
      supabase,
      bookId,
      testId,
      questionId,
    );
    revalidateAdminExamCatalogPaths(bookId, testId);
    return { ok: true, segments };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return { ok: false, error: mapAlignmentError(error) };
  }
}

export async function updateListeningShortItemSegments(
  bookId: string,
  testId: string,
  questionId: string,
  segments: TranscriptSegment[],
): Promise<AlignListeningShortItemResult> {
  try {
    const { supabase } = await requireAdminSession();
    const normalized = assertTranscriptSegmentsValid(segments);
    const part = await questionPart(supabase, bookId, testId, questionId);
    const table = part === "1" ? "listening_part1_items" : "listening_part2_items";

    const { error: updateError } = await supabase
      .from(table)
      .update({ transcript_segments: normalized })
      .eq("question_id", questionId);

    if (updateError) throw updateError;

    const { data: question, error: questionError } = await supabase
      .from("questions")
      .select("global_item_number, translations")
      .eq("id", questionId)
      .eq("book_id", bookId)
      .eq("test_id", testId)
      .maybeSingle();
    if (questionError) throw questionError;
    if (question?.global_item_number) {
      await syncDictationItemClips(
        supabase,
        buildListeningWholeAudioPath(
          bookId,
          testId,
          question.global_item_number as number,
        ),
        normalized,
        normalizeQuestionTranslations(question.translations),
      );
    }

    revalidateAdminExamCatalogPaths(bookId, testId);
    return { ok: true, segments: normalized };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return { ok: false, error: mapAlignmentError(error) };
  }
}
