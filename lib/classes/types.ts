import type { LearningActivityType } from "@/lib/learning/types";
import type { ExamProgressRow } from "@/lib/learning/exam-progress";

export type ClassMemberStatus = "active" | "removed";

export interface ClassSummary {
  id: string;
  name: string;
  description?: string | null;
  ownerId?: string | null;
  createdAt?: string;
}

export interface ClassStudentSummary {
  memberId: string;
  userId: string;
  displayName: string;
  email: string | null;
  displayNameOverride: string | null;
  externalStudentId: string | null;
  joinedAt: string;
  status: ClassMemberStatus;
  lastTestBookId: string | null;
  lastTestTestId: string | null;
  lastTestBookName: string | null;
  lastTestLabel: string | null;
  lastTestFinishedTimeSeconds: number | null;
  lastExamScore: number | null;
  examsCompleted: number;
}

export interface ClassOverview {
  class: ClassSummary;
  totalStudents: number;
  examsCompletedThisWeek: number;
  recentCompletions: ClassRecentCompletion[];
}

export interface ClassRecentCompletion {
  id: string;
  userId: string;
  displayName: string;
  activityType: LearningActivityType;
  bookId: string;
  testId: string;
  bookName: string;
  testLabel: string;
  completedAt: string;
  summary: string;
}

export interface StudentActivitySummary {
  id: string;
  activityType: LearningActivityType;
  bookId: string;
  testId: string;
  bookName: string;
  testLabel: string;
  section: "listening" | "reading" | null;
  parts: number[];
  completedAt: string;
  summary: string;
  totalCount: number;
  correctCount: number;
  finishedTimeSeconds: number | null;
  listeningScore: number | null;
  readingScore: number | null;
  partScoresSummary: string | null;
  hasAnswerSheet: boolean;
}

export interface ClassStudentDetail {
  memberId: string;
  userId: string;
  displayName: string;
  email: string | null;
  displayNameOverride: string | null;
  externalStudentId: string | null;
  joinedAt: string;
  status: ClassMemberStatus;
  examsCompleted: number;
  practiceSessions: number;
  wordsLearned: number;
  latestExamScore: number | null;
  examProgressRows: ExamProgressRow[];
  activities: StudentActivitySummary[];
}

export interface UpdateStudentInput {
  displayNameOverride?: string | null;
  externalStudentId?: string | null;
}

export interface CreateClassInput {
  name: string;
  description?: string | null;
}

export interface UpdateClassInput {
  name?: string;
  description?: string | null;
}
