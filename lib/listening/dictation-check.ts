import {
  normalizeDictationAnswer,
  normalizeDictationDisplayToken,
  tokenizeDictationAnswer,
  tokenizeDictationDisplay,
} from "@/lib/listening/dictation-normalize";
import { isNonTranscriptToken } from "@/lib/listening/non-transcript-text";

export interface DictationAnswerSegment {
  text: string;
  matched: boolean;
  /** Markup that is not spoken (speaker labels, chat times, …). */
  exempt?: boolean;
}

export interface DictationCheckResult {
  isCorrect: boolean;
  normalizedInput: string;
  normalizedExpected: string;
  expectedSegments: DictationAnswerSegment[];
}

type AlignOp =
  | { kind: "match"; expectedIdx: number }
  | { kind: "mismatch"; expectedIdx: number }
  | { kind: "insert" };

function alignNormalizedWords(
  inputWords: string[],
  expectedWords: string[],
): AlignOp[] {
  const inputLen = inputWords.length;
  const expectedLen = expectedWords.length;
  const dp = Array.from({ length: inputLen + 1 }, () =>
    Array<number>(expectedLen + 1).fill(0),
  );

  for (let i = 1; i <= inputLen; i++) {
    dp[i]![0] = i;
  }
  for (let j = 1; j <= expectedLen; j++) {
    dp[0]![j] = j;
  }

  for (let i = 1; i <= inputLen; i++) {
    for (let j = 1; j <= expectedLen; j++) {
      const inputWord = inputWords[i - 1]!;
      const expectedWord = expectedWords[j - 1]!;

      if (inputWord === expectedWord) {
        dp[i]![j] = dp[i - 1]![j - 1]!;
        continue;
      }

      dp[i]![j] = 1 + Math.min(
        dp[i - 1]![j - 1]!,
        dp[i - 1]![j]!,
        dp[i]![j - 1]!,
      );
    }
  }

  const ops: AlignOp[] = [];
  let inputIndex = inputLen;
  let expectedIndex = expectedLen;

  while (inputIndex > 0 || expectedIndex > 0) {
    const current = dp[inputIndex]![expectedIndex]!;
    const wordsMatch =
      inputIndex > 0 &&
      expectedIndex > 0 &&
      inputWords[inputIndex - 1] === expectedWords[expectedIndex - 1];

    // Prefer skipping later expected words when costs tie so a repeated
    // word matches its earliest occurrence (dictation is typed from the start).
    const canDelete =
      expectedIndex > 0 && current === dp[inputIndex]![expectedIndex - 1]! + 1;
    if (canDelete) {
      ops.unshift({ kind: "mismatch", expectedIdx: expectedIndex - 1 });
      expectedIndex--;
      continue;
    }

    if (wordsMatch && current === dp[inputIndex - 1]![expectedIndex - 1]!) {
      ops.unshift({ kind: "match", expectedIdx: expectedIndex - 1 });
      inputIndex--;
      expectedIndex--;
      continue;
    }

    const canSubstitute =
      inputIndex > 0 &&
      expectedIndex > 0 &&
      current === dp[inputIndex - 1]![expectedIndex - 1]! + 1;
    if (canSubstitute) {
      ops.unshift({ kind: "mismatch", expectedIdx: expectedIndex - 1 });
      inputIndex--;
      expectedIndex--;
      continue;
    }

    if (inputIndex === 0) {
      ops.unshift({ kind: "mismatch", expectedIdx: expectedIndex - 1 });
      expectedIndex--;
      continue;
    }

    ops.unshift({ kind: "insert" });
    inputIndex--;
  }

  return ops;
}

function getAlignableExpectedTokens(displayTokens: string[]): {
  words: string[];
  displayIndexes: number[];
} {
  const words: string[] = [];
  const displayIndexes: number[] = [];

  for (let index = 0; index < displayTokens.length; index++) {
    const token = displayTokens[index]!;
    if (isNonTranscriptToken(token)) continue;
    words.push(normalizeDictationDisplayToken(token));
    displayIndexes.push(index);
  }

  return { words, displayIndexes };
}

function buildExpectedSegments(
  displayTokens: string[],
  ops: AlignOp[],
  displayIndexes: number[],
): DictationAnswerSegment[] {
  const matchedByDisplayIndex = new Map<number, boolean>();

  for (const op of ops) {
    if (op.kind === "insert") continue;
    const displayIndex = displayIndexes[op.expectedIdx];
    if (displayIndex === undefined) continue;
    matchedByDisplayIndex.set(
      displayIndex,
      op.kind === "match" ? true : false,
    );
  }

  return displayTokens.map((text, index) => {
    const exempt = isNonTranscriptToken(text);
    return {
      text,
      exempt,
      matched: exempt || (matchedByDisplayIndex.get(index) ?? false),
    };
  });
}

export function checkDictationAnswer(
  rawInput: string,
  rawExpected: string,
): DictationCheckResult {
  const normalizedInput = normalizeDictationAnswer(rawInput);
  const displayTokens = tokenizeDictationDisplay(rawExpected);
  const { words: expectedWords, displayIndexes } =
    getAlignableExpectedTokens(displayTokens);
  const normalizedExpected = expectedWords.join(" ");
  const inputWords = tokenizeDictationAnswer(normalizedInput);
  const ops = alignNormalizedWords(inputWords, expectedWords);
  const expectedSegments = buildExpectedSegments(
    displayTokens,
    ops,
    displayIndexes,
  );

  const isCorrect =
    inputWords.length === expectedWords.length &&
    inputWords.every((word, index) => word === expectedWords[index]);

  return {
    isCorrect,
    normalizedInput,
    normalizedExpected,
    expectedSegments,
  };
}
