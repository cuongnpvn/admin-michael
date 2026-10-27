import type { QuestionExplanation } from "@/lib/content/question-explanation";
import type {
  LectureAnswers,
  LectureExerciseKind,
  LectureKeyAnswer,
  LectureQuestionPayload,
} from "@/lib/lectures/exercise";
import type { Enums } from "@/types/database";

export type LectureExtractStatus = Enums<"lecture_extract_status">;
export type LectureProgressStatus = Enums<"lecture_progress_status">;
export type LectureProgressFocus = Enums<"lecture_progress_focus">;
export type LectureOptionLabel = Enums<"option_label">;
export type LectureAccessTier = Enums<"subscription_plan">;
export type LectureFormat = Enums<"lecture_format">;

export interface LectureOption {
  id: string;
  label: LectureOptionLabel;
  text: string;
}

export interface LectureQuestion {
  id: string;
  sortOrder: number;
  kind: LectureExerciseKind;
  stem: string;
  options: LectureOption[];
  payload: LectureQuestionPayload;
}

export interface LectureQuestionWithKey extends LectureQuestion {
  correctOptionId: string | null;
  explanation: QuestionExplanation;
  answer: LectureKeyAnswer;
}

export interface LectureCollectionStage {
  id: string;
  collectionId: string;
  stageNumber: number;
  title: string;
  dayStart: number;
  dayEnd: number;
}

export interface LectureCollectionSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  descriptionHtml: string;
  imageUrl?: string | null;
  sortOrder: number;
  accessTier: LectureAccessTier;
  published: boolean;
  publishedCount: number;
  finishedCount: number;
  startedCount: number;
}

export interface LectureSummary {
  id: string;
  collectionId: string;
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  estimatedMinutes: number | null;
  sortOrder: number;
  published: boolean;
  extractStatus: LectureExtractStatus;
  questionCount: number;
  vocabCount?: number;
  dayNumber: number | null;
  reviewGoal: string;
  isRestDay: boolean;
  isMiniTestDay: boolean;
  isFinalTestDay: boolean;
  format: LectureFormat;
}

export interface LectureDetail extends LectureSummary {
  bodyHtml: string;
  extractError: string | null;
}

export interface LectureProgress {
  status: LectureProgressStatus;
  focus: LectureProgressFocus;
  answers: LectureAnswers;
  finishedAt: string | null;
  lastFinishedAt: string | null;
  attemptCount: number;
  correctCount: number;
  totalCount: number;
  practiceAnswers: Record<string, string>;
  practiceCorrectCount: number;
  practiceTotalCount: number;
  practiceSubmittedAt: string | null;
  activeSeconds: number;
}

export interface LectureResumeState {
  lastCollectionId: string | null;
  lastLectureId: string | null;
  lastCollectionSlug: string | null;
  lastLectureSlug: string | null;
}

export interface CollectionProgress {
  collectionId: string;
  publishedCount: number;
  finishedCount: number;
  startedCount: number;
  lastFinishedAt: string | null;
  lastFinishedLectureId: string | null;
}
