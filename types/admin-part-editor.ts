import type { QuestionExplanation } from "@/lib/content/question-explanation";
import type { ContentVocabularyWord } from "@/lib/content/content-vocabulary";
import type { TranscriptSegment } from "@/lib/listening/transcript-segments";
import type { OptionLabelDb, PassageSetLayout, ToeicPartDb } from "@/types/content-db";
import type { QuestionTranslationEntry } from "@/lib/content/draft-types";

export interface AdminPartOptionRow {
  id: string;
  slug: string;
  label: OptionLabelDb;
  text: string;
  sortOrder: number;
  audioStoragePath: string | null;
  audioAssetId: string | null;
}

export interface AdminPartQuestionRow {
  id: string;
  slug: string;
  /** Official TOEIC test question number (1–200). */
  globalItemNumber: number;
  prompt: string;
  hint: string | null;
  explanation: QuestionExplanation | null;
  freeExplanation: boolean;
  tags: string[];
  translations: QuestionTranslationEntry[];
  /** Part 6 HTML passage translation on the anchor question. */
  translationHtml: string | null;
  correctOptionId: string | null;
  options: AdminPartOptionRow[];
  imageStoragePath: string | null;
  imageAssetId: string | null;
  transcript: string | null;
  transcriptAudioStoragePath: string | null;
  transcriptAudioAssetId: string | null;
  groupTranscript: string | null;
  questionAudioStoragePath: string | null;
  questionAudioAssetId: string | null;
  listeningGroupId: string | null;
  listeningGroupSlug: string | null;
  groupAudioStoragePath: string | null;
  groupAudioAssetId: string | null;
  groupTopic: string | null;
  groupFreeExplanation: boolean;
  /** Parts 3–4 curated vocab on the listening group. */
  groupVocabulary: ContentVocabularyWord[];
  /** Speaker-turn / sentence audio marks for the listening group (Parts 3–4). */
  groupTranscriptSegments: TranscriptSegment[];
  isFirstInGroup: boolean;
  readingPassageSetId: string | null;
}

export interface AdminPassageRow {
  id: string;
  slug: string;
  title: string;
  content: string;
  sortOrder: number;
  /** Part 7 per-passage bilingual rows (empty for Part 6). */
  translations: QuestionTranslationEntry[];
  /** Vietnamese HTML fragment mirroring the passage layout. */
  translationHtml: string | null;
}

export interface AdminPassageSetRow {
  id: string;
  slug: string;
  topic: string | null;
  freeExplanation: boolean;
  /** Parts 6–7 curated vocab for the passage set. */
  vocabulary: ContentVocabularyWord[];
  layout: PassageSetLayout;
  contentModel: string;
  sortOrder: number;
  passages: AdminPassageRow[];
  questionIds: string[];
}

export interface AdminPartEditorData {
  bookId: string;
  testId: string;
  part: ToeicPartDb;
  partTitle: string;
  targetCount: number;
  questions: AdminPartQuestionRow[];
  passageSets: AdminPassageSetRow[];
}
