import { isNonTranscriptLine } from "@/lib/listening/non-transcript-text";

export interface SpeakerTurn {
  index: number;
  english: string;
}

export function normalizeTurnEnglish(english: string): string {
  return english.trim().replace(/\s+/g, " ");
}

const SPEAKER_TURN_LINE = /^(?:[WMNAB]|woman|man|narrator):\s+\S/iu;

/** True when the transcript uses Part 3 speaker-turn lines. */
export function transcriptHasSpeakerTurns(transcript: string): boolean {
  return transcript
    .replace(/\r\n/g, "\n")
    .split("\n")
    .some((line) => SPEAKER_TURN_LINE.test(line.trim()));
}

/** One speaker-turn line per transcript newline. Editorial / label-only lines are dropped. */
export function resolveSpeakerTurns(transcript: string): SpeakerTurn[] {
  return transcript
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !isNonTranscriptLine(line))
    .map((english, index) => ({ index, english }));
}
