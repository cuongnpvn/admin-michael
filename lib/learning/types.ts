import type { DailyGoalSummary } from "@/lib/learning/daily-goals/types";
import type { Enums } from "@/types/database";
import type { ExamScoreResult } from "@/lib/exam/score-exam";

export type LearningActivityType = Enums<"learning_activity_type">;
export type VocabularySection = Enums<"vocabulary_section">;
export type ToeicPart = Enums<"toeic_part">;

export interface PracticeScoreData {
  accuracy: number;
  part: number;
}

export interface VocabularyScoreData {
  wordsCompleted: number;
  fillInCorrect: number;
  dictationCorrect: number;
}

export interface SaveLearningActivityPayload {
  activityType: LearningActivityType;
  bookId: string;
  testId: string;
  classId?: string;
  section?: VocabularySection | null;
  parts?: number[];
  totalCount: number;
  correctCount: number;
  wrongCount?: number;
  unansweredCount?: number;
  finishedTimeSeconds?: number | null;
  scoreData?: ExamScoreResult | PracticeScoreData | VocabularyScoreData | Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface LearningActivityRow {
  id: string;
  activityType: LearningActivityType;
  bookId: string;
  testId: string;
  section: VocabularySection | null;
  parts: ToeicPart[];
  completedAt: string;
  totalCount: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  finishedTimeSeconds: number | null;
  scoreData: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface LearningJournalHistoryItem {
  id: string;
  activityType: LearningActivityType;
  bookId: string;
  testId: string;
  bookName: string;
  testLabel: string;
  section: VocabularySection | null;
  parts: ToeicPart[];
  completedAt: string;
  summary: string;
}

export interface LearningJournalAchievements {
  studyStreakDays: number;
  testsCompleted: number;
  practiceSessions: number;
  wordsLearned: number;
  vocabularyMilestone: number | null;
}

export interface LearningJournalLevel {
  latestExamScore: number | null;
  bestExamScore: number | null;
  latestListeningScore: number | null;
  latestReadingScore: number | null;
  weakestPart: number | null;
  wordsLearned: number;
}

export interface LearningJournal {
  level: LearningJournalLevel;
  history: LearningJournalHistoryItem[];
  achievements: LearningJournalAchievements;
  dailyGoalSummary: DailyGoalSummary;
}

export const VOCABULARY_MILESTONES = [25, 50, 100, 200] as const;

export function partNumberToEnum(part: number): ToeicPart {
  return String(part) as ToeicPart;
}

export function partEnumToNumber(part: ToeicPart): number {
  return Number.parseInt(part, 10);
}
