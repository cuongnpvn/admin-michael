import {
  catalogDisplayKey,
  formatCatalogTitleReference,
} from "@/lib/content/resolve-catalog-display";
import { readExamScore } from "@/lib/admin/dashboard/read-exam-score";
import type { Enums } from "@/types/database";

type ToeicPart = Enums<"toeic_part">;

const ALL_EXAM_PARTS = [1, 2, 3, 4, 5, 6, 7] as const;

function isFullExamParts(parts: number[]): boolean {
  return (
    parts.length === ALL_EXAM_PARTS.length &&
    ALL_EXAM_PARTS.every((part) => parts.includes(part))
  );
}

function partEnumToNumber(part: ToeicPart): number {
  return Number.parseInt(part, 10);
}

export type ExamScoreHolder = {
  score: number;
  userId: string;
  displayName: string;
};

export type ExamAttemptStudentRow = {
  userId: string;
  displayName: string;
  attemptCount: number;
  lastTakenAt: string | null;
  finishedTimeSeconds: number | null;
  totalScore: number | null;
  listeningScore: number | null;
  readingScore: number | null;
};

export type ExamAttemptStatsRow = {
  bookId: string;
  testId: string;
  bookName: string;
  testLabel: string;
  totalAttempts: number;
  lastTakenAt: string | null;
  highest: ExamScoreHolder | null;
  lowest: ExamScoreHolder | null;
  students: ExamAttemptStudentRow[];
};

export type ExamAttemptStatsByRange = {
  days7: ExamAttemptStatsRow[];
  days30: ExamAttemptStatsRow[];
};

export type ExamAttemptActivityRow = {
  user_id: string;
  book_id: string;
  test_id: string;
  parts?: ToeicPart[] | null;
  completed_at: string;
  finished_time: number | null;
  score_data: Record<string, unknown> | null;
};

type StudentBucket = {
  userId: string;
  attemptCount: number;
  lastTakenAt: string | null;
  finishedTimeSeconds: number | null;
  totalScore: number | null;
  listeningScore: number | null;
  readingScore: number | null;
};

type AggregateBucket = {
  bookId: string;
  testId: string;
  totalAttempts: number;
  lastTakenAt: string | null;
  highest: ExamScoreHolder | null;
  lowest: ExamScoreHolder | null;
  students: Map<string, StudentBucket>;
};

type CatalogDisplayLookup = Map<
  string,
  { bookName: string; testLabel: string }
>;

export function displayNameForUser(
  userId: string,
  namesByUserId: Map<string, string>,
): string {
  const name = namesByUserId.get(userId)?.trim();
  return name || userId.slice(0, 8);
}

export function isFullExamActivity(row: ExamAttemptActivityRow): boolean {
  const parts = (row.parts ?? []).map(partEnumToNumber);
  return isFullExamParts(parts);
}

function applyLatestAttempt(
  student: StudentBucket,
  row: ExamAttemptActivityRow,
): void {
  student.lastTakenAt = row.completed_at;
  student.finishedTimeSeconds = row.finished_time ?? null;

  const score = readExamScore(row.score_data ?? {});
  if (!score) {
    student.totalScore = null;
    student.listeningScore = null;
    student.readingScore = null;
    return;
  }

  student.totalScore = score.totalScaled;
  student.listeningScore = score.listening.scaled;
  student.readingScore = score.reading.scaled;
}

function toStudentRow(
  bucket: StudentBucket,
  namesByUserId: Map<string, string>,
): ExamAttemptStudentRow {
  return {
    userId: bucket.userId,
    displayName: displayNameForUser(bucket.userId, namesByUserId),
    attemptCount: bucket.attemptCount,
    lastTakenAt: bucket.lastTakenAt,
    finishedTimeSeconds: bucket.finishedTimeSeconds,
    totalScore: bucket.totalScore,
    listeningScore: bucket.listeningScore,
    readingScore: bucket.readingScore,
  };
}

function sortStudents(students: ExamAttemptStudentRow[]): ExamAttemptStudentRow[] {
  return [...students].sort((a, b) => {
    if (a.lastTakenAt && b.lastTakenAt) {
      if (a.lastTakenAt === b.lastTakenAt) return 0;
      return a.lastTakenAt < b.lastTakenAt ? 1 : -1;
    }
    if (!a.lastTakenAt) return 1;
    if (!b.lastTakenAt) return -1;
    return 0;
  });
}

export function aggregateExamAttemptStats(
  rows: ExamAttemptActivityRow[],
  displayLookup: CatalogDisplayLookup,
  namesByUserId: Map<string, string>,
): ExamAttemptStatsRow[] {
  const buckets = new Map<string, AggregateBucket>();

  for (const row of rows) {
    const key = catalogDisplayKey(row.book_id, row.test_id);
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        bookId: row.book_id,
        testId: row.test_id,
        totalAttempts: 0,
        lastTakenAt: null,
        highest: null,
        lowest: null,
        students: new Map(),
      };
      buckets.set(key, bucket);
    }

    bucket.totalAttempts += 1;

    if (!bucket.lastTakenAt || row.completed_at > bucket.lastTakenAt) {
      bucket.lastTakenAt = row.completed_at;
    }

    let student = bucket.students.get(row.user_id);
    if (!student) {
      student = {
        userId: row.user_id,
        attemptCount: 0,
        lastTakenAt: null,
        finishedTimeSeconds: null,
        totalScore: null,
        listeningScore: null,
        readingScore: null,
      };
      bucket.students.set(row.user_id, student);
    }

    student.attemptCount += 1;
    if (!student.lastTakenAt || row.completed_at > student.lastTakenAt) {
      applyLatestAttempt(student, row);
    }

    const score = readExamScore(row.score_data ?? {});
    if (!score) continue;

    const holderPlaceholder: ExamScoreHolder = {
      score: score.totalScaled,
      userId: row.user_id,
      displayName: row.user_id,
    };

    if (!bucket.highest || score.totalScaled > bucket.highest.score) {
      bucket.highest = holderPlaceholder;
    }
    if (!bucket.lowest || score.totalScaled < bucket.lowest.score) {
      bucket.lowest = holderPlaceholder;
    }
  }

  const result: ExamAttemptStatsRow[] = [...buckets.values()].map((bucket) => {
    const display = displayLookup.get(
      catalogDisplayKey(bucket.bookId, bucket.testId),
    );
    const bookName = display?.bookName ?? bucket.bookId;
    const testLabel = display?.testLabel ?? bucket.testId;

    const withName = (
      holder: ExamScoreHolder | null,
    ): ExamScoreHolder | null => {
      if (!holder) return null;
      return {
        ...holder,
        displayName: displayNameForUser(holder.userId, namesByUserId),
      };
    };

    return {
      bookId: bucket.bookId,
      testId: bucket.testId,
      bookName,
      testLabel,
      totalAttempts: bucket.totalAttempts,
      lastTakenAt: bucket.lastTakenAt,
      highest: withName(bucket.highest),
      lowest: withName(bucket.lowest),
      students: sortStudents(
        [...bucket.students.values()].map((student) =>
          toStudentRow(student, namesByUserId),
        ),
      ),
    };
  });

  result.sort((a, b) => {
    if (b.totalAttempts !== a.totalAttempts) {
      return b.totalAttempts - a.totalAttempts;
    }
    return formatCatalogTitleReference(a.bookName, a.testLabel).localeCompare(
      formatCatalogTitleReference(b.bookName, b.testLabel),
    );
  });

  return result;
}

export function collectStatsUserIds(rows: ExamAttemptStatsRow[]): Set<string> {
  const ids = new Set<string>();
  for (const row of rows) {
    if (row.highest) ids.add(row.highest.userId);
    if (row.lowest) ids.add(row.lowest.userId);
    for (const student of row.students) ids.add(student.userId);
  }
  return ids;
}

export function applyDisplayNames(
  rows: ExamAttemptStatsRow[],
  namesByUserId: Map<string, string>,
): ExamAttemptStatsRow[] {
  const withName = (
    holder: ExamScoreHolder | null,
  ): ExamScoreHolder | null => {
    if (!holder) return null;
    return {
      ...holder,
      displayName: displayNameForUser(holder.userId, namesByUserId),
    };
  };

  return rows.map((row) => ({
    ...row,
    highest: withName(row.highest),
    lowest: withName(row.lowest),
    students: row.students.map((student) => ({
      ...student,
      displayName: displayNameForUser(student.userId, namesByUserId),
    })),
  }));
}
