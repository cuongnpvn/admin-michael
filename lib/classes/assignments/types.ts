import type { QuestionExplanation } from "@/lib/content/question-explanation";

export type ClassAssignmentStatus = "draft" | "published" | "closed";
export type ClassAssignmentAttemptStatus = "in_progress" | "submitted";
export type AssignmentOptionLabel = "A" | "B" | "C" | "D";

export interface AssignmentOption {
  id: string;
  label: AssignmentOptionLabel;
  text: string;
}

export interface AssignmentQuestionInput {
  id?: string;
  sortOrder: number;
  stem: string;
  options: AssignmentOption[];
  correctOptionId: string;
  explanation?: QuestionExplanation | null;
}

export interface AssignmentQuestion {
  id: string;
  sortOrder: number;
  stem: string;
  options: AssignmentOption[];
}

export interface AssignmentQuestionKey {
  questionId: string;
  correctOptionId: string;
  explanation?: QuestionExplanation | null;
}

export interface AssignmentQuestionResult {
  questionId: string;
  selectedOptionId: string | null;
  correctOptionId: string;
  correct: boolean;
}

export interface ClassAssignmentSummary {
  id: string;
  classId: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  attemptLimit: number;
  status: ClassAssignmentStatus;
  publishedAt: string | null;
  createdAt: string;
  submittedStudentCount: number;
}

export interface ClassAssignmentDetail extends ClassAssignmentSummary {
  questions: AssignmentQuestionInput[];
}

export interface TeacherAssignmentCard extends ClassAssignmentSummary {
  totalStudents: number;
}

export interface StudentAssignmentCard extends ClassAssignmentSummary {
  submittedCount: number;
  hasInProgress: boolean;
  latestCorrectCount: number | null;
  latestTotalCount: number | null;
}

export interface AssignmentAttemptView {
  id: string;
  attemptNumber: number;
  status: ClassAssignmentAttemptStatus;
  answers: Record<string, string>;
  results: Record<string, AssignmentQuestionResult>;
  correctCount: number;
  totalCount: number;
  startedAt: string;
  submittedAt: string | null;
}

export interface AssignmentResultRow {
  userId: string;
  displayName: string;
  status: "notStarted" | "inProgress" | "submitted" | "late";
  correctCount: number | null;
  totalCount: number | null;
  submittedAt: string | null;
  attemptsUsed: number;
}

export interface AssignmentEditorInput {
  title: string;
  description?: string | null;
  dueAt: string | null;
  attemptLimit: number;
  questions: AssignmentQuestionInput[];
}
