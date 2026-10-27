"use server";

import { revalidateAdminExamCatalogPaths } from "@/lib/admin/revalidate-admin-exam-catalog";
import { ZodError } from "zod";
import {
  AdminAccessError,
  requireAdminSession,
} from "@/lib/admin/auth/require-admin";
import { generateAndImportListeningPart3TurnAlignment } from "@/lib/admin/content/generate-and-import-listening-part3-turn-alignment";
import { generateAndImportListeningPart4SentenceAlignment } from "@/lib/admin/content/generate-and-import-listening-part4-sentence-alignment";
import { assertTranscriptSegmentsValid } from "@/lib/content/listening-turn-alignment-schema";
import { copy } from "@/lib/copy/vi";
import type { TranscriptSegment } from "@/lib/listening/transcript-segments";

export type AlignListeningGroupTurnsResult =
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
  if (message.includes("not found")) return errors.notFound;
  if (message.includes("only available for Part")) return errors.unsupportedPart;
  if (message.includes("no speech sentences")) return errors.noSentences;
  if (message.includes("no speaker turns")) return errors.noTurns;
  if (message.includes("no questions")) return errors.noTurns;
  if (message.includes("no audio")) return errors.noAudio;
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

function revalidateGroupPaths(
  _bookId: string,
  _testId: string,
  _part: string,
): void {
  revalidateAdminExamCatalogPaths();
}

export async function alignListeningGroupTurns(
  bookId: string,
  testId: string,
  listeningGroupId: string,
): Promise<AlignListeningGroupTurnsResult> {
  try {
    const { supabase } = await requireAdminSession();

    const { data: group, error: groupError } = await supabase
      .from("listening_groups")
      .select("part")
      .eq("id", listeningGroupId)
      .eq("book_id", bookId)
      .eq("test_id", testId)
      .maybeSingle();

    if (groupError) throw groupError;
    if (!group) {
      throw new Error("Listening group not found.");
    }

    if (group.part !== "3" && group.part !== "4") {
      throw new Error("Alignment is only available for Parts 3 and 4.");
    }

    const segments =
      group.part === "4"
        ? await generateAndImportListeningPart4SentenceAlignment(
            supabase,
            bookId,
            testId,
            listeningGroupId,
          )
        : await generateAndImportListeningPart3TurnAlignment(
            supabase,
            bookId,
            testId,
            listeningGroupId,
          );

    revalidateGroupPaths(bookId, testId, group.part);
    return { ok: true, segments };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return { ok: false, error: mapAlignmentError(error) };
  }
}

export async function updateListeningGroupTurnSegments(
  bookId: string,
  testId: string,
  listeningGroupId: string,
  segments: TranscriptSegment[],
): Promise<AlignListeningGroupTurnsResult> {
  try {
    const { supabase } = await requireAdminSession();
    const normalized = assertTranscriptSegmentsValid(segments);

    const { data: group, error: groupError } = await supabase
      .from("listening_groups")
      .select("id, part")
      .eq("id", listeningGroupId)
      .eq("book_id", bookId)
      .eq("test_id", testId)
      .maybeSingle();

    if (groupError) throw groupError;
    if (!group) {
      throw new Error("Listening group not found.");
    }
    if (group.part !== "3" && group.part !== "4") {
      throw new Error("Alignment is only available for Parts 3 and 4.");
    }

    const { error: updateError } = await supabase
      .from("listening_groups")
      .update({ transcript_segments: normalized })
      .eq("id", listeningGroupId)
      .eq("book_id", bookId)
      .eq("test_id", testId);

    if (updateError) throw updateError;

    revalidateGroupPaths(bookId, testId, group.part);
    return { ok: true, segments: normalized };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return { ok: false, error: mapAlignmentError(error) };
  }
}
