import type { QuestionTranslationEntry } from "@/lib/content/draft-types";
import { normalizeTurnEnglish } from "@/lib/listening/speaker-turns";
import type { SpeechSentence } from "@/lib/listening/speech-sentences";
import { transcriptSegmentsMatchLines } from "@/lib/listening/transcript-segments-match";
import type { TranscriptSegment } from "@/lib/listening/transcript-segments";

const PART_CATALOG = {
  "1": {
    itemType: "image_description",
    topic: "Photographs",
    topicSort: 1,
  },
  "2": {
    itemType: "question_answer",
    topic: "Question-Response",
    topicSort: 2,
  },
  "3": {
    itemType: "conversation",
    topic: "Conversations",
    topicSort: 3,
  },
  "4": {
    itemType: "monologue",
    topic: "Talks",
    topicSort: 4,
  },
} as const;

export type ListeningDictationPart = keyof typeof PART_CATALOG;

export interface ListeningDictationSegment {
  index: number;
  text: string;
  startSec: number;
  endSec: number;
  translation?: string;
}

export interface ListeningDictationUnit {
  audioPath: string;
  itemType: (typeof PART_CATALOG)[ListeningDictationPart]["itemType"];
  topic: string;
  topicSort: number;
  title: string;
  sortOrder: number;
  imagePath: string | null;
  transcript: string;
  segments: ListeningDictationSegment[];
}

function clipTitle(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= 180 ? clean : clean.slice(0, 180).trimEnd();
}

function translationFor(
  english: string,
  entries: QuestionTranslationEntry[],
): string | undefined {
  const target = normalizeTurnEnglish(english);
  const stripped = normalizeTurnEnglish(
    english.replace(/^(?:[WMNAB]\d*):\s+/i, ""),
  );
  for (const entry of entries) {
    const value = normalizeTurnEnglish(entry.english);
    if (value !== target && value !== stripped) continue;
    const vietnamese = entry.vietnamese.trim();
    if (vietnamese) return vietnamese;
  }
  return undefined;
}

function toDictationSegments(
  segments: TranscriptSegment[],
  translations: QuestionTranslationEntry[],
): ListeningDictationSegment[] {
  return segments.map((segment) => {
    const translation = translationFor(segment.english, translations);
    return {
      index: segment.index,
      text: segment.english,
      startSec: segment.startSec,
      endSec: segment.endSec,
      ...(translation ? { translation } : {}),
    };
  });
}

export function unitFromLines(input: {
  part: ListeningDictationPart;
  audioPath: string;
  sortOrder: number;
  imagePath: string | null;
  lines: SpeechSentence[];
  segments: TranscriptSegment[];
  translations: QuestionTranslationEntry[];
}): ListeningDictationUnit | null {
  if (!transcriptSegmentsMatchLines(input.segments, input.lines)) return null;
  const catalog = PART_CATALOG[input.part];
  const title = clipTitle(input.lines[0]?.english ?? "");
  if (!title) return null;

  return {
    audioPath: input.audioPath,
    itemType: catalog.itemType,
    topic: catalog.topic,
    topicSort: catalog.topicSort,
    title,
    sortOrder: input.sortOrder,
    imagePath: input.imagePath,
    transcript: input.lines.map((line) => line.english).join("\n"),
    segments: toDictationSegments(input.segments, input.translations),
  };
}
