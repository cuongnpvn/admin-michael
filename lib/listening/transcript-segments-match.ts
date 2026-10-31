import { assertTranscriptSegmentsValid } from "@/lib/content/listening-turn-alignment-schema";
import { normalizeTurnEnglish } from "@/lib/listening/speaker-turns";
import type { SpeechSentence } from "@/lib/listening/speech-sentences";
import type { TranscriptSegment } from "@/lib/listening/transcript-segments";

/** True when stored marks already cover the current spoken lines in order. */
export function transcriptSegmentsMatchLines(
  segments: TranscriptSegment[],
  lines: SpeechSentence[],
): boolean {
  if (lines.length === 0 || segments.length !== lines.length) return false;

  let normalized: TranscriptSegment[];
  try {
    normalized = assertTranscriptSegmentsValid(segments);
  } catch {
    return false;
  }

  return normalized.every((segment, index) => {
    const line = lines[index];
    if (!line) return false;
    return (
      segment.index === line.index &&
      normalizeTurnEnglish(segment.english) === normalizeTurnEnglish(line.english)
    );
  });
}
