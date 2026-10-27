import type { ContentVocabularyWord } from "@/lib/content/content-vocabulary";
import type { QuestionExplanation } from "@/lib/content/question-explanation";
import type { TranscriptSegment } from "@/lib/listening/transcript-segments";
import type { OptionLabelDb, ToeicPartDb } from "@/types/content-db";
import type { OptionLabel } from "@/types/test-data";

export interface QuestionTranslationEntry {
  english: string;
  vietnamese: string;
}

export interface DraftOptionRow {
  slug: string;
  label: OptionLabel;
  text: string;
  sortOrder: number;
  audioAssetId?: string | null;
}

export interface DraftQuestionRow {
  slug: string;
  part: number;
  /** Official TOEIC test question number (1–200). */
  globalItemNumber: number;
  prompt: string;
  correctOptionSlug: string;
  hint?: string | null;
  explanation?: QuestionExplanation | null;
  tags?: string[];
  translations?: QuestionTranslationEntry[];
  vocabulary?: ContentVocabularyWord[];
  options: DraftOptionRow[];
  listeningGroupSlug?: string;
  readingPassageSetSlug?: string;
  primaryPassageSlug?: string;
  /** Parts 3–4 optional context graphic. */
  contextImageAssetId?: string | null;
  /** Whole Q+A audio (Part 1); question stem (Parts 2–4). */
  audioAssetId?: string | null;
  /** Part 1 question-only stem audio. */
  stemAudioAssetId?: string | null;
}

export interface DraftPart1ItemRow {
  questionSlug: string;
  imageAssetId?: string | null;
}

export interface DraftPart2ItemRow {
  questionSlug: string;
  transcript: string;
  /** Part 2 whole Q+A audio. */
  audioAssetId?: string | null;
}

export interface DraftListeningGroupRow {
  slug: string;
  part: 3 | 4;
  /** Short topic label for practice catalog cards. */
  topic?: string | null;
  transcript: string;
  vocabulary?: ContentVocabularyWord[];
  questionSlugs: string[];
  audioAssetId?: string | null;
}

export interface DraftReadingPassageRow {
  slug: string;
  title: string;
  content: string;
  translations?: QuestionTranslationEntry[];
}

export interface DraftReadingPassageSetRow {
  slug: string;
  part: 6 | 7;
  /** Short topic label for practice catalog cards. */
  topic?: string | null;
  vocabulary?: ContentVocabularyWord[];
  layout: "single" | "double" | "triple";
  contentModel: "comprehension" | "text_completion_cloze";
  passages: DraftReadingPassageRow[];
  questionSlugs: string[];
}

export interface DraftPartTitleRow {
  part: number;
  title: string;
}

export interface DraftBundle {
  bookId: string;
  testId: string;
  testTitle: string;
  partTitles: DraftPartTitleRow[];
  part1Items: DraftPart1ItemRow[];
  part2Items: DraftPart2ItemRow[];
  listeningGroups: DraftListeningGroupRow[];
  readingPassageSets: DraftReadingPassageSetRow[];
  questions: DraftQuestionRow[];
}

export interface LoadedAnswerOption {
  id: string;
  slug: string;
  label: OptionLabelDb;
  text: string;
  sortOrder: number;
  audioAsset?: { storageBucket: string; storagePath: string } | null;
}

export interface LoadedQuestion {
  id: string;
  slug: string;
  part: ToeicPartDb;
  globalItemNumber: number;
  prompt: string;
  hint: string | null;
  explanation: QuestionExplanation | null;
  freeExplanation: boolean;
  tags: string[];
  translations: QuestionTranslationEntry[];
  vocabulary: ContentVocabularyWord[];
  translationHtml?: string;
  correctOptionId: string | null;
  audioAsset?: { storageBucket: string; storagePath: string } | null;
  /** Part 1 question-only stem audio. */
  stemAudioAsset?: { storageBucket: string; storagePath: string } | null;
  contextImageAsset?: { storageBucket: string; storagePath: string } | null;
  options: LoadedAnswerOption[];
}

export interface LoadedListeningGroup {
  id: string;
  slug: string;
  part: "3" | "4";
  topic: string | null;
  transcript: string;
  vocabulary: ContentVocabularyWord[];
  format: "dialogue" | "monologue";
  stimulusKind: string;
  sortOrder: number;
  freeExplanation: boolean;
  audioAsset?: { storageBucket: string; storagePath: string } | null;
  transcriptSegments?: TranscriptSegment[];
  questions: LoadedQuestion[];
}

export interface LoadedReadingPassage {
  id: string;
  slug: string;
  title: string;
  content: string;
  sortOrder: number;
  translations: QuestionTranslationEntry[];
  translationHtml?: string;
}

export interface LoadedReadingPassageSet {
  id: string;
  slug: string;
  part: "6" | "7";
  topic: string | null;
  vocabulary: ContentVocabularyWord[];
  contentModel: "comprehension" | "text_completion_cloze";
  layout: "single" | "double" | "triple";
  sortOrder: number;
  freeExplanation: boolean;
  passages: LoadedReadingPassage[];
  questions: LoadedQuestion[];
}

export interface LoadedDraftBundle {
  bookId: string;
  testId: string;
  testTitle: string;
  listeningTestAudioAsset?: { storageBucket: string; storagePath: string } | null;
  partTitles: Record<number, string>;
  part1Items: Array<{
    question: LoadedQuestion;
    imageAsset?: { storageBucket: string; storagePath: string } | null;
  }>;
  part2Items: Array<{
    question: LoadedQuestion;
    transcript: string;
    transcriptAudioAsset?: { storageBucket: string; storagePath: string } | null;
  }>;
  listeningGroups: LoadedListeningGroup[];
  readingPassageSets: LoadedReadingPassageSet[];
  standaloneQuestions: LoadedQuestion[];
}

export function partToDb(part: number): ToeicPartDb {
  return String(part) as ToeicPartDb;
}

export function partFromDb(part: ToeicPartDb): number {
  return Number.parseInt(part, 10);
}
