import type { SpeechSentence } from "@/lib/listening/speech-sentences";

export interface Part12OptionLine {
  text: string;
  sortOrder: number;
}

function cleanLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function linesFromBlock(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map(cleanLine)
    .filter((line) => line.length > 0);
}

function linesFromOptions(options: Part12OptionLine[]): string[] {
  return [...options]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .flatMap((option) => linesFromBlock(option.text));
}

/** Part 1: one spoken statement per answer option, in option order. */
export function part1SpokenLines(options: Part12OptionLine[]): SpeechSentence[] {
  return linesFromOptions(options).map((english, index) => ({ index, english }));
}

/** Part 2: the question transcript, then each response, without re-splitting a line. */
export function part2SpokenLines(
  transcript: string,
  options: Part12OptionLine[],
): SpeechSentence[] {
  return [...linesFromBlock(transcript), ...linesFromOptions(options)].map(
    (english, index) => ({ index, english }),
  );
}
