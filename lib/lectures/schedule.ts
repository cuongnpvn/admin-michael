import type {
  LectureCollectionStage,
  LectureProgress,
  LectureSummary,
} from "@/lib/lectures/types";

export const DAYS_PER_WEEK = 7;

export type ScheduledLecture = LectureSummary & {
  progress: LectureProgress | null;
};

export interface ScheduleDay {
  dayNumber: number | null;
  lecture: ScheduledLecture | null;
}

export interface ScheduleWeek {
  weekIndex: number;
  days: ScheduleDay[];
}

export interface ScheduleStageView {
  stage: LectureCollectionStage;
  weeks: ScheduleWeek[];
}

export type StageDraft = {
  title: string;
  dayStart: number;
  dayEnd: number;
};

export type StageDraftError =
  | "emptyTitle"
  | "invalidDay"
  | "invalidRange"
  | "overlap";

export type ScheduleDayKind = "lesson" | "practice" | "rest";

export type ScheduleStageTone = 1 | 2 | 3;

/** First stage is light, middle stages are mid, the last stage uses the primary fill. */
export function scheduleStageTone(index: number, count: number): ScheduleStageTone {
  if (index <= 0) return 1;
  if (count > 1 && index >= count - 1) return 3;
  if (index > 0) return 2;
  return 1;
}

export function hasCollectionSchedule(
  stages: LectureCollectionStage[],
): boolean {
  return stages.length > 0;
}

export function scheduleDayKind(title: string | null | undefined): ScheduleDayKind {
  const value = (title ?? "").toLowerCase();
  if (value.includes("nghỉ")) return "rest";
  if (value.includes("mini test") || value.includes("final test")) {
    return "practice";
  }
  return "lesson";
}

export function scheduleLastDay(stages: LectureCollectionStage[]): number {
  return stages.reduce((max, stage) => Math.max(max, stage.dayEnd), 0);
}

export function dateKeyFromCourseDay(
  startDateKey: string,
  dayNumber: number,
): string {
  const [year, month, day] = startDateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  date.setUTCDate(date.getUTCDate() + (dayNumber - 1));
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function courseDayFromDateKey(
  startDateKey: string,
  dateKey: string,
  lastDay: number,
): number | null {
  const [startYear, startMonth, startDay] = startDateKey.split("-").map(Number);
  const [year, month, day] = dateKey.split("-").map(Number);
  const start = Date.UTC(startYear!, startMonth! - 1, startDay!);
  const current = Date.UTC(year!, month! - 1, day!);
  const dayNumber =
    Math.round((current - start) / (24 * 60 * 60 * 1000)) + 1;
  if (dayNumber < 1 || dayNumber > lastDay) return null;
  return dayNumber;
}

export function parseDayQuery(value: string | undefined): number | null {
  if (!value) return null;
  const day = Number(value);
  if (!Number.isInteger(day) || day < 1) return null;
  return day;
}

export function stageContainingDay(
  stages: LectureCollectionStage[],
  dayNumber: number,
): LectureCollectionStage | null {
  return (
    stages.find(
      (stage) => dayNumber >= stage.dayStart && dayNumber <= stage.dayEnd,
    ) ?? null
  );
}

export function buildSchedule(
  stages: LectureCollectionStage[],
  lectures: ScheduledLecture[],
): ScheduleStageView[] {
  const byDay = new Map<number, ScheduledLecture>();
  for (const lecture of lectures) {
    if (lecture.dayNumber != null) {
      byDay.set(lecture.dayNumber, lecture);
    }
  }

  return [...stages]
    .sort((a, b) => a.stageNumber - b.stageNumber)
    .map((stage) => {
      const days: ScheduleDay[] = [];
      for (let day = stage.dayStart; day <= stage.dayEnd; day += 1) {
        days.push({
          dayNumber: day,
          lecture: byDay.get(day) ?? null,
        });
      }

      const weeks: ScheduleWeek[] = [];
      for (let index = 0; index < days.length; index += DAYS_PER_WEEK) {
        const chunk = days.slice(index, index + DAYS_PER_WEEK);
        while (chunk.length < DAYS_PER_WEEK) {
          chunk.push({ dayNumber: null, lecture: null });
        }
        weeks.push({ weekIndex: weeks.length, days: chunk });
      }

      return { stage, weeks };
    });
}

export function resolveSelectedDay({
  stages,
  lectures,
  requestedDay,
  resumeLectureId,
}: {
  stages: LectureCollectionStage[];
  lectures: ScheduledLecture[];
  requestedDay: number | null;
  resumeLectureId: string | null;
}): number | null {
  if (stages.length === 0) return null;

  const inRange = (day: number) => stageContainingDay(stages, day) != null;

  if (requestedDay != null && inRange(requestedDay)) return requestedDay;

  if (resumeLectureId) {
    const resume = lectures.find((lecture) => lecture.id === resumeLectureId);
    if (resume?.dayNumber != null && inRange(resume.dayNumber)) {
      return resume.dayNumber;
    }
  }

  return stages[0]?.dayStart ?? null;
}

export function firstDayInStage(
  stage: LectureCollectionStage,
  lectures: ScheduledLecture[],
  preferredDay: number | null,
): number {
  if (
    preferredDay != null &&
    preferredDay >= stage.dayStart &&
    preferredDay <= stage.dayEnd
  ) {
    return preferredDay;
  }

  const firstScheduled = lectures
    .filter(
      (lecture) =>
        lecture.dayNumber != null &&
        lecture.dayNumber >= stage.dayStart &&
        lecture.dayNumber <= stage.dayEnd,
    )
    .sort((a, b) => (a.dayNumber ?? 0) - (b.dayNumber ?? 0))[0];

  return firstScheduled?.dayNumber ?? stage.dayStart;
}

export function normalizeCollectionStages(
  drafts: StageDraft[],
): { ok: true; stages: StageDraft[] } | { ok: false; error: StageDraftError } {
  const stages: StageDraft[] = [];

  for (const draft of drafts) {
    const title = draft.title.trim();
    if (!title) return { ok: false, error: "emptyTitle" };
    if (
      !Number.isInteger(draft.dayStart) ||
      !Number.isInteger(draft.dayEnd) ||
      draft.dayStart < 1 ||
      draft.dayEnd < 1
    ) {
      return { ok: false, error: "invalidDay" };
    }
    if (draft.dayStart > draft.dayEnd) {
      return { ok: false, error: "invalidRange" };
    }
    stages.push({
      title,
      dayStart: draft.dayStart,
      dayEnd: draft.dayEnd,
    });
  }

  const ordered = [...stages].sort((a, b) => a.dayStart - b.dayStart);
  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1];
    const current = ordered[index];
    if (previous && current && current.dayStart <= previous.dayEnd) {
      return { ok: false, error: "overlap" };
    }
  }

  return { ok: true, stages: ordered };
}

export function mapStageRow(row: {
  id: string;
  collection_id: string;
  stage_number: number;
  title: string;
  day_start: number;
  day_end: number;
}): LectureCollectionStage {
  return {
    id: row.id,
    collectionId: row.collection_id,
    stageNumber: row.stage_number,
    title: row.title,
    dayStart: row.day_start,
    dayEnd: row.day_end,
  };
}
