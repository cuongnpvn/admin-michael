import type { SupabaseClient } from "@supabase/supabase-js";
import { buildListeningPart4SentenceAlignmentExport } from "@/lib/admin/export/build-listening-part4-sentence-alignment-export";
import { extractListeningPart4SentenceAlignment } from "@/lib/admin/gemini/extract-listening-part4-sentence-alignment";
import { elapsedMs, geminiLog, previewText } from "@/lib/admin/gemini/gemini-log";
import {
  assertAlignedSegmentsMatchTurns,
  listeningTurnAlignmentResponseSchema,
} from "@/lib/content/listening-turn-alignment-schema";
import type { TranscriptSegment } from "@/lib/listening/transcript-segments";

const PREFIX = "[listening-part4-sentence-alignment]";

function alignmentLog(
  event: string,
  details: Record<string, unknown> = {},
): void {
  console.log(PREFIX, event, details);
}

export async function generateAndImportListeningPart4SentenceAlignment(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  listeningGroupId: string,
): Promise<TranscriptSegment[]> {
  const startedAt = performance.now();
  alignmentLog("start", { bookId, testId, listeningGroupId });

  const exportEntry = await buildListeningPart4SentenceAlignmentExport(
    supabase,
    bookId,
    testId,
    listeningGroupId,
  );

  alignmentLog("export_built", {
    bookId,
    testId,
    listeningGroupId,
    questionId: exportEntry.questionId,
    sentenceCount: exportEntry.sentences.length,
    audioStoragePath: exportEntry.audioStoragePath,
  });

  const { data: audioFile, error: downloadError } = await supabase.storage
    .from(exportEntry.audioStorageBucket)
    .download(exportEntry.audioStoragePath);

  if (downloadError || !audioFile) {
    throw new Error("Listening group has no audio.");
  }

  const audioBytes = Buffer.from(await audioFile.arrayBuffer());
  if (audioBytes.length === 0) {
    throw new Error("Listening group has no audio.");
  }

  geminiLog("sentence_alignment_audio_ready", {
    bookId,
    testId,
    listeningGroupId,
    audioBytes: audioBytes.length,
    audioPreview: previewText(exportEntry.audioStoragePath, 120),
  });

  const parsed = await extractListeningPart4SentenceAlignment({
    questionId: exportEntry.questionId,
    sentences: exportEntry.sentences,
    audioBytes,
    audioMimeType: audioFile.type || "audio/mpeg",
  });

  const response = listeningTurnAlignmentResponseSchema.parse(parsed);
  const segments = assertAlignedSegmentsMatchTurns(
    exportEntry.questionId,
    exportEntry.sentences,
    response,
  );

  const { error: updateError } = await supabase
    .from("listening_groups")
    .update({ transcript_segments: segments })
    .eq("id", listeningGroupId)
    .eq("book_id", bookId)
    .eq("test_id", testId);

  if (updateError) throw updateError;

  alignmentLog("import_done", {
    bookId,
    testId,
    listeningGroupId,
    segmentCount: segments.length,
    totalMs: elapsedMs(startedAt),
  });

  return segments;
}
