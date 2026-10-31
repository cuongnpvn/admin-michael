import type { SupabaseClient } from "@supabase/supabase-js";
import { syncDictationItemClips } from "@/lib/admin/content/sync-dictation-item-clips";
import { buildListeningPart12SentenceAlignmentExport } from "@/lib/admin/export/build-listening-part12-sentence-alignment-export";
import { extractListeningPart12SentenceAlignment } from "@/lib/admin/gemini/extract-listening-part12-sentence-alignment";
import { buildListeningWholeAudioPath } from "@/lib/content/listening-audio-paths";
import { normalizeQuestionTranslations } from "@/lib/content/question-metadata";
import { elapsedMs, geminiLog, previewText } from "@/lib/admin/gemini/gemini-log";
import {
  assertAlignedSegmentsMatchTurns,
  listeningTurnAlignmentResponseSchema,
} from "@/lib/content/listening-turn-alignment-schema";
import type { TranscriptSegment } from "@/lib/listening/transcript-segments";

const PREFIX = "[listening-part12-sentence-alignment]";

function alignmentLog(
  event: string,
  details: Record<string, unknown> = {},
): void {
  console.log(PREFIX, event, details);
}

export async function generateAndImportListeningPart12SentenceAlignment(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  questionRowId: string,
): Promise<TranscriptSegment[]> {
  const startedAt = performance.now();
  alignmentLog("start", { bookId, testId, questionRowId });

  const exportEntry = await buildListeningPart12SentenceAlignmentExport(
    supabase,
    bookId,
    testId,
    questionRowId,
  );

  alignmentLog("export_built", {
    bookId,
    testId,
    questionRowId,
    part: exportEntry.part,
    questionId: exportEntry.questionId,
    sentenceCount: exportEntry.sentences.length,
    audioStoragePath: exportEntry.audioStoragePath,
  });

  const { data: audioFile, error: downloadError } = await supabase.storage
    .from(exportEntry.audioStorageBucket)
    .download(exportEntry.audioStoragePath);

  if (downloadError || !audioFile) {
    throw new Error("Listening question has no audio.");
  }

  const audioBytes = Buffer.from(await audioFile.arrayBuffer());
  if (audioBytes.length === 0) {
    throw new Error("Listening question has no audio.");
  }

  geminiLog("sentence_alignment_audio_ready", {
    bookId,
    testId,
    questionRowId,
    part: exportEntry.part,
    audioBytes: audioBytes.length,
    audioPreview: previewText(exportEntry.audioStoragePath, 120),
  });

  const parsed = await extractListeningPart12SentenceAlignment({
    part: exportEntry.part,
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

  const table =
    exportEntry.part === 1 ? "listening_part1_items" : "listening_part2_items";
  const { error: updateError } = await supabase
    .from(table)
    .update({ transcript_segments: segments })
    .eq("question_id", exportEntry.questionRowId);

  if (updateError) throw updateError;

  const { data: question, error: translationError } = await supabase
    .from("questions")
    .select("translations")
    .eq("id", exportEntry.questionRowId)
    .maybeSingle();
  if (translationError) throw translationError;

  await syncDictationItemClips(
    supabase,
    buildListeningWholeAudioPath(bookId, testId, exportEntry.globalItemNumber),
    segments,
    normalizeQuestionTranslations(question?.translations),
  );

  alignmentLog("import_done", {
    bookId,
    testId,
    questionRowId,
    part: exportEntry.part,
    segmentCount: segments.length,
    totalMs: elapsedMs(startedAt),
  });

  return segments;
}
