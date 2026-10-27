import type { ContentVocabularyWord } from "@/lib/content/content-vocabulary";
import type { TranscriptSegment } from "@/lib/listening/transcript-segments";
import type { QuestionExplanation } from "@/lib/content/question-explanation";
import type {
  ListeningFormat,
  ListeningStimulusKind,
  PassageSetContentModel,
} from "@/types/content-db";
import type { FlattenFullExamResult } from "@/lib/data/mappers";

export type BookId = string;
export type TestId = `test-${number}` | `test-${string}`;
export type ToeicPart = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type PassageLayout = "single" | "double" | "triple";
export type OptionLabel = "A" | "B" | "C" | "D";

export type {
  ListeningFormat,
  ListeningStimulusKind,
  PassageSetContentModel,
};

export interface AnswerOptionData {
  id: string;
  label: OptionLabel;
  text: string;
  audioUrl: string | null;
}

export interface QuestionTranslationEntry {
  english: string;
  vietnamese: string;
}

export interface QuestionData {
  id: string;
  /** Official TOEIC test question number (1–200). */
  globalItemNumber: number;
  prompt: string;
  /** Recorded audio for the question stem (listening parts). */
  audioUrl?: string | null;
  /** Part 1 question-only stem audio (without answer options). */
  questionStemAudioUrl?: string | null;
  /** Optional context graphic (Parts 3–4). */
  imageUrl?: string | null;
  options: AnswerOptionData[];
  correctOptionId: string;
  hint?: string | null;
  explanation?: QuestionExplanation | null;
  /** True when explanation is Pro-gated for this viewer. */
  explanationLocked?: boolean;
  /** Admin free-preview flag (compiled for entitlement redaction). */
  freeExplanation?: boolean;
  tags?: string[];
  translations?: QuestionTranslationEntry[];
  vocabulary?: ContentVocabularyWord[];
  /** Part 6 HTML passage translation (review stacked view). */
  translationHtml?: string;
}

export type ListeningPart1QuestionData = Omit<QuestionData, "prompt">;

export interface ListeningPart1Item {
  question: ListeningPart1QuestionData;
  imageUrl: string | null;
}

export interface ListeningPart2Item {
  question: QuestionData;
  questionTranscript: string;
  questionTranscriptAudioUrl?: string | null;
}

export interface ListeningStimulusGroup {
  id: string;
  /** Short topic label for practice catalog cards. */
  topic?: string;
  transcript: string;
  vocabulary?: ContentVocabularyWord[];
  format?: ListeningFormat;
  audioUrl: string | null;
  stimulusKind?: ListeningStimulusKind;
  /** Admin free-preview flag for group explanations. */
  freeExplanation?: boolean;
  /** Speaker-turn marks on the group conversation audio. */
  transcriptSegments?: TranscriptSegment[];
  questions: QuestionData[];
}

export interface ReadingPassageData {
  id: string;
  title: string;
  content: string;
  /** Part 7 per-passage bilingual rows (optional for legacy published content). */
  translations?: QuestionTranslationEntry[];
  /** Part 7 HTML passage translation (review stacked view). */
  translationHtml?: string;
}

export interface ReadingPassageSet {
  id: string;
  /** Short topic label for practice catalog cards. */
  topic?: string;
  vocabulary?: ContentVocabularyWord[];
  layout: PassageLayout;
  contentModel?: PassageSetContentModel;
  /** Admin free-preview flag for set explanations. */
  freeExplanation?: boolean;
  passages: ReadingPassageData[];
  questions: QuestionData[];
}

export interface ListeningPart1Data {
  part: 1;
  title: string;
  items: ListeningPart1Item[];
}

export interface ListeningPart2Data {
  part: 2;
  title: string;
  items: ListeningPart2Item[];
}

export interface ListeningPart3Data {
  part: 3;
  title: string;
  groups: ListeningStimulusGroup[];
}

export interface ListeningPart4Data {
  part: 4;
  title: string;
  groups: ListeningStimulusGroup[];
}

export type ListeningPartData =
  | ListeningPart1Data
  | ListeningPart2Data
  | ListeningPart3Data
  | ListeningPart4Data;

export interface ReadingPart5Data {
  part: 5;
  title: string;
  items: { question: QuestionData }[];
}

export interface ReadingPart6Data {
  part: 6;
  title: string;
  passageSets: ReadingPassageSet[];
}

export interface ReadingPart7Data {
  part: 7;
  title: string;
  passageSets: ReadingPassageSet[];
}

export type ReadingPartData =
  | ReadingPart5Data
  | ReadingPart6Data
  | ReadingPart7Data;

export interface TestMeta {
  bookId: BookId;
  testId: string;
  title: string;
  /** Full-length listening audio for exam mode (single track for parts 1–4). */
  listeningTestAudioUrl?: string | null;
  parts: {
    part: ToeicPart;
    title: string;
    questionCount: number;
  }[];
}

export type AccessTier = "free" | "pro";

export interface TestCatalogEntry {
  id: string;
  label: string;
  /** Display order within the parent book (1-based). */
  sortOrder: number;
  /** Full mock exam available (both sections published on exam books). */
  published: boolean;
  listeningPublished: boolean;
  readingPublished: boolean;
  /** Who may see/open this test in practice/exam UI. */
  accessTier: AccessTier;
}

export interface BookCatalogEntry {
  id: BookId;
  name: string;
  publisher: string;
  year: number;
  tests: TestCatalogEntry[];
}

export interface DataCatalog {
  books: BookCatalogEntry[];
}

export interface FullExamData extends FlattenFullExamResult {
  meta: TestMeta;
}

export type { TestImportFile } from "@/lib/content/schemas";
