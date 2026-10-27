import type { SupabaseClient } from "@supabase/supabase-js";
import { readExamScore, readPartScores } from "@/lib/classes/activity-summary";
import {
  filterExamCatalog,
  loadCatalog,
} from "@/lib/content/load-catalog";
import { resolveCatalogDisplay } from "@/lib/content/resolve-catalog-display";
import {
  PART_NUMBERS,
  partCorrectToScaledScore,
  type PartNumber,
} from "@/lib/learning/part-score-targets";
import {
  partEnumToNumber,
  type LearningActivityRow,
} from "@/lib/learning/types";
import type { Database } from "@/types/database";
import type { DataCatalog } from "@/types/test-data";

export type ExamProgressTrend = "up" | "down" | "same";

export interface ExamProgressMetric {
  value: number | null;
  delta: number | null;
  trend: ExamProgressTrend | null;
  /** Raw correct count for part columns (scaled value is stored in `value`). */
  rawCorrect?: number | null;
}

export interface ExamProgressRow {
  id: string;
  bookId: string;
  testId: string;
  bookName: string;
  testLabel: string;
  completedAt: string;
  completedAtLabel: string;
  attemptParts: number[];
  hasAnswerSheet: boolean;
  parts: Record<number, ExamProgressMetric>;
  listening: ExamProgressMetric;
  reading: ExamProgressMetric;
  total: ExamProgressMetric;
}

interface ExamActivityDbRow {
  id: string;
  activity_type: LearningActivityRow["activityType"];
  book_id: string;
  test_id: string;
  parts: LearningActivityRow["parts"];
  completed_at: string;
  score_data: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

const MAX_PROGRESS_ROWS = 10;

function mapExamRow(row: ExamActivityDbRow): LearningActivityRow {
  return {
    id: row.id,
    activityType: row.activity_type,
    bookId: row.book_id,
    testId: row.test_id,
    section: null,
    parts: row.parts ?? [],
    completedAt: row.completed_at,
    totalCount: 0,
    correctCount: 0,
    wrongCount: 0,
    unansweredCount: 0,
    finishedTimeSeconds: null,
    scoreData: row.score_data ?? {},
    metadata: row.metadata ?? {},
  };
}

export function formatExamProgressCompletedAt(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
    hour12: false,
  }).format(new Date(value));
}

function buildMetric(
  current: number | null,
  previous: number | null,
): ExamProgressMetric {
  if (current == null) {
    return { value: null, delta: null, trend: null };
  }

  if (previous == null) {
    return { value: current, delta: null, trend: null };
  }

  const delta = current - previous;
  const trend: ExamProgressTrend =
    delta > 0 ? "up" : delta < 0 ? "down" : "same";

  return { value: current, delta, trend };
}

function buildPartMetric(
  currentScaled: number | null,
  previousScaled: number | null,
  hasPreviousAttempt: boolean,
  rawCorrect: number | null,
): ExamProgressMetric {
  if (currentScaled == null || rawCorrect == null) {
    return { value: null, delta: null, trend: null, rawCorrect: null };
  }

  if (!hasPreviousAttempt) {
    return {
      value: currentScaled,
      delta: null,
      trend: null,
      rawCorrect,
    };
  }

  if (previousScaled == null) {
    return { value: null, delta: null, trend: null, rawCorrect: null };
  }

  return { ...buildMetric(currentScaled, previousScaled), rawCorrect };
}

function readPartScaledByNumber(
  row: LearningActivityRow,
): {
  scaled: Record<number, number | null>;
  rawCorrect: Record<number, number | null>;
} {
  const partScores = readPartScores(row.scoreData);
  const scaled: Record<number, number | null> = {
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    6: null,
    7: null,
  };
  const rawCorrect: Record<number, number | null> = {
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    6: null,
    7: null,
  };

  for (const entry of partScores) {
    if (!PART_NUMBERS.includes(entry.part as PartNumber)) continue;
    const part = entry.part as PartNumber;
    rawCorrect[part] = entry.correct;
    scaled[part] = partCorrectToScaledScore(entry.correct, part);
  }

  return { scaled, rawCorrect };
}

function buildProgressRow(
  current: LearningActivityRow,
  previous: LearningActivityRow | null,
  catalog: DataCatalog,
): ExamProgressRow {
  const display = resolveCatalogDisplay(
    catalog,
    current.bookId,
    current.testId,
  );
  const examScore = readExamScore(current.scoreData);
  const hasPreviousAttempt = previous != null;
  const previousParts = previous ? readPartScaledByNumber(previous) : null;
  const currentParts = readPartScaledByNumber(current);
  const parts = Object.fromEntries(
    PART_NUMBERS.map((part) => [
      part,
      buildPartMetric(
        currentParts.scaled[part],
        previousParts ? previousParts.scaled[part] : null,
        hasPreviousAttempt,
        currentParts.rawCorrect[part],
      ),
    ]),
  ) as Record<number, ExamProgressMetric>;

  const previousScore = previous ? readExamScore(previous.scoreData) : null;

  return {
    id: current.id,
    bookId: current.bookId,
    testId: current.testId,
    bookName: display.bookName,
    testLabel: display.testLabel,
    completedAt: current.completedAt,
    completedAtLabel: formatExamProgressCompletedAt(current.completedAt),
    attemptParts: (current.parts ?? []).map(partEnumToNumber),
    hasAnswerSheet: false,
    parts,
    listening: buildMetric(
      examScore?.listening.scaled ?? null,
      previousScore?.listening.scaled ?? null,
    ),
    reading: buildMetric(
      examScore?.reading.scaled ?? null,
      previousScore?.reading.scaled ?? null,
    ),
    total: buildMetric(
      examScore?.totalScaled ?? null,
      previousScore?.totalScaled ?? null,
    ),
  };
}

/**
 * One row per exam attempt, newest first (up to 10).
 * Each row compares against the previous attempt in chronological history,
 * regardless of book/test.
 */
export function buildExamProgressRows(
  rows: LearningActivityRow[],
  catalog: DataCatalog,
): ExamProgressRow[] {
  const chronological = rows
    .filter((row) => row.activityType === "exam")
    .sort(
      (left, right) =>
        new Date(left.completedAt).getTime() -
        new Date(right.completedAt).getTime(),
    );

  const progressRows = chronological.map((current, index) =>
    buildProgressRow(current, index > 0 ? chronological[index - 1]! : null, catalog),
  );

  return progressRows.slice(-MAX_PROGRESS_ROWS).reverse();
}

export function withExamAttemptAnswerSheets(
  rows: ExamProgressRow[],
  activityIds: Set<string>,
): ExamProgressRow[] {
  return rows.map((row) => ({
    ...row,
    hasAnswerSheet: activityIds.has(row.id),
  }));
}

async function loadExamCatalog(
  supabase: SupabaseClient<Database>,
): Promise<DataCatalog> {
  return filterExamCatalog(await loadCatalog(supabase));
}

export async function fetchExamProgressForUser(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<ExamProgressRow[]> {
  const [catalog, activityResult] = await Promise.all([
    loadExamCatalog(supabase),
    supabase
      .from("learning_activities")
      .select(
        "id, activity_type, book_id, test_id, parts, completed_at, score_data, metadata",
      )
      .eq("user_id", userId)
      .eq("activity_type", "exam")
      .order("completed_at", { ascending: true }),
  ]);

  if (activityResult.error) throw activityResult.error;

  const rows = ((activityResult.data ?? []) as ExamActivityDbRow[]).map(
    mapExamRow,
  );
  return attachExamProgressAnswerSheets(
    supabase,
    userId,
    buildExamProgressRows(rows, catalog),
  );
}

export async function attachExamProgressAnswerSheets(
  supabase: SupabaseClient<Database>,
  userId: string,
  rows: ExamProgressRow[],
): Promise<ExamProgressRow[]> {
  const activityIds = rows.map((row) => row.id);
  if (activityIds.length === 0) return rows;

  const sheetResult = await supabase
    .from("exam_last_attempts")
    .select("activity_id")
    .eq("user_id", userId)
    .in("activity_id", activityIds);

  if (sheetResult.error) throw sheetResult.error;

  const sheetIds = new Set(
    (sheetResult.data ?? [])
      .map((row) =>
        typeof row.activity_id === "string" ? row.activity_id : null,
      )
      .filter((id): id is string => id != null),
  );

  return withExamAttemptAnswerSheets(rows, sheetIds);
}

export async function buildExamProgressFromActivities(
  supabase: SupabaseClient<Database>,
  rows: LearningActivityRow[],
): Promise<ExamProgressRow[]> {
  const catalog = await loadExamCatalog(supabase);
  return buildExamProgressRows(rows, catalog);
}
