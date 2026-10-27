import { parseLectureAnswers } from "@/lib/lectures/exercise";
import { parsePracticeAnswers } from "@/lib/lectures/practice-completeness";
import type { LectureProgress } from "@/lib/lectures/types";

export const LECTURE_PROGRESS_COLUMNS =
  "status, focus, answers, finished_at, last_finished_at, attempt_count, correct_count, total_count, practice_answers, practice_correct_count, practice_total_count, practice_submitted_at, active_seconds";

export function mapLectureProgress(row: {
  status: unknown;
  focus: unknown;
  answers: unknown;
  finished_at: unknown;
  last_finished_at: unknown;
  attempt_count: unknown;
  correct_count: unknown;
  total_count: unknown;
  practice_answers?: unknown;
  practice_correct_count?: unknown;
  practice_total_count?: unknown;
  practice_submitted_at?: unknown;
  active_seconds?: unknown;
}): LectureProgress {
  return {
    status: row.status as LectureProgress["status"],
    focus: row.focus as LectureProgress["focus"],
    answers: parseLectureAnswers(row.answers),
    finishedAt: (row.finished_at as string | null) ?? null,
    lastFinishedAt: (row.last_finished_at as string | null) ?? null,
    attemptCount: row.attempt_count as number,
    correctCount: row.correct_count as number,
    totalCount: row.total_count as number,
    practiceAnswers: parsePracticeAnswers(row.practice_answers),
    practiceCorrectCount: Number(row.practice_correct_count ?? 0),
    practiceTotalCount: Number(row.practice_total_count ?? 0),
    practiceSubmittedAt: (row.practice_submitted_at as string | null) ?? null,
    activeSeconds: Number(row.active_seconds ?? 0),
  };
}
