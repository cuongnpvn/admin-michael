import type { ExamAttemptStudentRow } from "@/lib/admin/dashboard/aggregate-exam-attempt-stats";

export type ExamAttemptStudentSortKey = "lastTakenAt" | "totalScore";
export type ExamAttemptStudentSortDir = "asc" | "desc";
export type ExamAttemptStudentSortState = {
  key: ExamAttemptStudentSortKey;
  dir: ExamAttemptStudentSortDir;
};

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function compareNullable(
  a: number | string | null,
  b: number | string | null,
  dir: ExamAttemptStudentSortDir,
): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (a === b) return 0;
  const cmp = a < b ? -1 : 1;
  return dir === "asc" ? cmp : -cmp;
}

export function filterExamAttemptStudentsByName(
  students: ExamAttemptStudentRow[],
  query: string,
): ExamAttemptStudentRow[] {
  const needle = normalizeSearchText(query);
  if (!needle) return students;
  return students.filter((student) =>
    normalizeSearchText(student.displayName).includes(needle),
  );
}

export function sortExamAttemptStudents(
  students: ExamAttemptStudentRow[],
  sort: ExamAttemptStudentSortState | null,
): ExamAttemptStudentRow[] {
  if (!sort) return students;
  return [...students].sort((a, b) => {
    const aVal = sort.key === "lastTakenAt" ? a.lastTakenAt : a.totalScore;
    const bVal = sort.key === "lastTakenAt" ? b.lastTakenAt : b.totalScore;
    const cmp = compareNullable(aVal, bVal, sort.dir);
    if (cmp !== 0) return cmp;
    return a.displayName.localeCompare(b.displayName, "vi");
  });
}

export function filterAndSortExamAttemptStudents(
  students: ExamAttemptStudentRow[],
  query: string,
  sort: ExamAttemptStudentSortState | null,
): ExamAttemptStudentRow[] {
  return sortExamAttemptStudents(
    filterExamAttemptStudentsByName(students, query),
    sort,
  );
}
