import type { LectureProgress, LectureQuestion } from "@/lib/lectures/types";

export const MAX_TUTOR_MESSAGE_LENGTH = 2000;
export const MAX_TUTOR_QA_ROUNDS = 5;
export const MAX_TUTOR_HISTORY_MESSAGES = MAX_TUTOR_QA_ROUNDS * 2;
export const MAX_EXERCISE_CANDIDATES = 3;
export const MAX_STEM_PREVIEW_LENGTH = 120;
export const TUTOR_PRACTICE_LIMIT = 6;
export const TUTOR_PRACTICE_MIN_LIMIT = 5;
export const TUTOR_PRACTICE_MAX_LIMIT = 8;
export const TUTOR_PRACTICE_SEARCH_POOL = 40;
export const TUTOR_AGENT_MAX_ROUNDS = 3;

export type TutorChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export type AskLectureTutorInput = {
  lectureId: string;
  message: string;
  questionId?: string;
  history?: TutorChatMessage[];
};

export type LectureCitation = {
  lectureId: string;
  title: string;
  headingPath?: string;
  questionSortOrder?: number;
  slug: string;
  collectionSlug: string;
  href: string;
};

export type RecommendedExercise = {
  lectureId: string;
  questionId: string;
  stemPreview: string;
  reason: string;
  slug: string;
  collectionSlug: string;
  href: string;
};

export type RecommendedLecture = {
  lectureId: string;
  title: string;
  reason: string;
  slug: string;
  collectionSlug: string;
  href: string;
};

export type TutorPracticeOffer = {
  reason: string;
};

export type TutorPracticeQuestion = {
  id: string;
  stem: string;
  options: LectureQuestion["options"];
};

export type TutorPracticeSet = {
  questionIds: string[];
  questions: TutorPracticeQuestion[];
};

export type AskLectureTutorSuccess = {
  ok: true;
  refuse: boolean;
  refuseReason?: string;
  answerMarkdown: string;
  citations: LectureCitation[];
  recommendedExercise: RecommendedExercise | null;
  recommendedLecture: RecommendedLecture | null;
  offerPractice: TutorPracticeOffer | null;
};

export type ConfirmTutorPracticeResult =
  | { ok: true; set: TutorPracticeSet }
  | { ok: false; error: string };

export type TutorPracticeResultItem = {
  questionId: string;
  selectedOptionId: string | null;
  correct: boolean;
  correctOptionId: string;
  explanation: string;
};

export type SubmitTutorPracticeResult =
  | {
      ok: true;
      correctCount: number;
      totalCount: number;
      results: TutorPracticeResultItem[];
    }
  | { ok: false; error: string };

export type AskLectureTutorResult =
  | AskLectureTutorSuccess
  | { ok: false; error: string };

export type TutorLecture = {
  id: string;
  collectionId: string;
  collectionSlug: string;
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  sortOrder: number;
  bodyText: string;
};

export type TutorQuestion = LectureQuestion & {
  lectureId: string;
};

export type TutorCollection = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
};

export type TutorPrefetch = {
  collectionId: string;
  collectionSlug: string;
  currentLecture: TutorLecture;
  lectures: TutorLecture[];
  collections: TutorCollection[];
  questions: TutorQuestion[];
  progressByLectureId: Map<string, LectureProgress>;
};

export type TutorExerciseCandidate = {
  lectureId: string;
  questionId: string;
  stemPreview: string;
};

export type TutorLectureCandidate = {
  lectureId: string;
  title: string;
};

export type TutorCandidates = {
  nextLecture: TutorLectureCandidate | null;
  exercises: TutorExerciseCandidate[];
};
