import type { ContentVocabularyWord } from "@/lib/content/content-vocabulary";
import type { QuestionExplanation } from "@/lib/content/question-explanation";

export type StudyMode = "practice" | "exam";

/** @deprecated Use boolean `clozeEnabled` in listening practice UI. */
export type ListeningDisplayMode = "cloze" | "exam";

/** Reading passage pane: formatted passage vs sentence-level bilingual vs review stacked view. */
export type PassageViewMode = "original" | "bilingual" | "review";

/** How much answer text is visible before cloze masking (UI-only for now). */
export type ClozeVisibilityPercent = 20 | 50 | 100;

/** Listening practice modes (tab view). */
export type ListeningPracticeMode = "exam" | "cloze" | "dictation";

/** @deprecated Use `ListeningPracticeMode`. */
export type ListeningPart1PracticeMode = ListeningPracticeMode;

export interface ExamBook {
  id: string;
  name: string;
  publisher?: string;
  year?: number;
}

export interface AnswerOption {
  id: string;
  label: string;
  text: string;
  audioId?: string;
  audioUrl?: string | null;
}

export interface QuestionTranslationEntry {
  english: string;
  vietnamese: string;
}

export interface Question {
  id: string;
  number: number;
  /** Official TOEIC test question number (1–200). */
  globalItemNumber: number;
  prompt: string;
  /** Recorded audio for the question stem (listening practice). */
  audioUrl?: string | null;
  /** Optional context graphic shown with the question (listening Parts 3–4). */
  imageUrl?: string | null;
  options: AnswerOption[];
  hint?: string | null;
  explanation?: QuestionExplanation | null;
  /** True when explanation is Pro-gated for this viewer. */
  explanationLocked?: boolean;
  /** Admin free-preview flag used before entitlement redaction. */
  freeExplanation?: boolean;
  tags?: string[];
  translations?: QuestionTranslationEntry[];
  /** Curated vocab for this question (parts 1, 2, 5). */
  vocabulary?: ContentVocabularyWord[];
  /** Part 6 HTML passage translation (review stacked view). */
  translationHtml?: string;
}

export interface Passage {
  id: string;
  title: string;
  content: string;
  /** Part 6 review: HTML or markdown with filled cloze blanks. */
  parsedAnswerContent?: string;
}

export interface ReadingSession {
  part: number;
  partTitle: string;
  passage: Passage;
  questions: Question[];
}

export interface ListeningPart {
  part: number;
  title: string;
  description: string;
  questionCount: number;
  estimatedMinutes: number;
}

export interface ListeningSession {
  examBookId?: string;
  examBookName?: string;
  part: number;
  partTitle: string;
  questionNumber: number;
  totalQuestions: number;
  question: Question;
  transcript?: string;
}

export interface ReadingPart {
  part: number;
  title: string;
  description: string;
  questionCount: number;
  estimatedMinutes: number;
}

export interface ExamSection {
  id: string;
  name: string;
  durationMinutes: number;
  questionCount: number;
}

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}
