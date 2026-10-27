import { isNonTranscriptLine } from "@/lib/listening/non-transcript-text";

export interface SpeechSentence {
  index: number;
  english: string;
}

const TITLE_ABBREVIATIONS = new Set(
  [
    "Mr",
    "Mrs",
    "Ms",
    "Dr",
    "Prof",
    "Sr",
    "Jr",
    "Inc",
    "Ltd",
    "Corp",
    "Co",
    "vs",
    "etc",
    "St",
    "Ave",
    "Blvd",
    "Rd",
    "No",
    "Fig",
  ].map((entry) => entry.toLowerCase()),
);

const DOTTED_ABBREVIATIONS = new Set(
  ["e.g", "i.e", "u.s", "u.k", "e.u", "u.n", "a.m", "p.m"].map((entry) =>
    entry.toLowerCase(),
  ),
);

function tokenBeforePeriod(text: string, periodIndex: number): string {
  let start = periodIndex;
  while (start > 0 && /[A-Za-z0-9]/.test(text[start - 1]!)) {
    start -= 1;
  }
  return text.slice(start, periodIndex);
}

function dottedTokenBeforePeriod(text: string, periodIndex: number): string {
  let start = periodIndex;
  while (start > 0 && /[A-Za-z.]/.test(text[start - 1]!)) {
    start -= 1;
  }
  return text.slice(start, periodIndex);
}

function isProtectedPeriod(text: string, periodIndex: number): boolean {
  const token = tokenBeforePeriod(text, periodIndex);
  if (!token) return false;
  if (/^\d+$/.test(token)) return false;
  if (token.length === 1 && /[A-Za-z]/.test(token)) return true;
  if (TITLE_ABBREVIATIONS.has(token.toLowerCase())) return true;

  const dotted = dottedTokenBeforePeriod(text, periodIndex).toLowerCase();
  return DOTTED_ABBREVIATIONS.has(dotted);
}

function canEndSentenceAt(text: string, punctuationIndex: number): boolean {
  const mark = text[punctuationIndex];
  if (mark === "." && isProtectedPeriod(text, punctuationIndex)) {
    return false;
  }

  let nextIndex = punctuationIndex + 1;
  while (nextIndex < text.length && /\s/.test(text[nextIndex]!)) {
    nextIndex += 1;
  }

  if (nextIndex >= text.length) return true;
  return /[A-Z"'“‘]/.test(text[nextIndex]!);
}

function splitSpokenSentences(text: string): string[] {
  const sentences: string[] = [];
  let start = 0;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character !== "." && character !== "?" && character !== "!") {
      continue;
    }
    if (!canEndSentenceAt(text, index)) continue;

    const sentence = text.slice(start, index + 1).trim();
    if (sentence) sentences.push(sentence);

    let nextStart = index + 1;
    while (nextStart < text.length && /\s/.test(text[nextStart]!)) {
      nextStart += 1;
    }
    start = nextStart;
    index = nextStart - 1;
  }

  const tail = text.slice(start).trim();
  if (tail) sentences.push(tail);
  return sentences;
}

function spokenTranscriptText(transcript: string): string {
  return transcript
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !isNonTranscriptLine(line))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/** One spoken sentence per Part 4 monologue unit. Editorial lines are dropped. */
export function resolveSpeechSentences(transcript: string): SpeechSentence[] {
  const spoken = spokenTranscriptText(transcript);
  if (!spoken) return [];

  return splitSpokenSentences(spoken).map((english, index) => ({
    index,
    english,
  }));
}
