import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CollectionProgress,
  LectureCollectionStage,
  LectureCollectionSummary,
  LectureProgress,
  LectureResumeState,
  LectureSummary,
} from "@/lib/lectures/types";
import {
  LECTURE_PROGRESS_COLUMNS,
  mapLectureProgress,
} from "@/lib/lectures/map-lecture-progress";
import { sanitizeCollectionDescriptionHtml } from "@/lib/lectures/sanitize-html";
import { mapStageRow } from "@/lib/lectures/schedule";
import { parseLectureFormat } from "@/lib/lectures/format";
import { countLectureVocabItems } from "@/lib/lectures/vocab";
import { normalizeLectureTags } from "@/lib/lectures/tags";

function emptyProgress(collectionId: string): CollectionProgress {
  return {
    collectionId,
    publishedCount: 0,
    finishedCount: 0,
    startedCount: 0,
    lastFinishedAt: null,
    lastFinishedLectureId: null,
  };
}

export async function loadLectureCollections(
  supabase: SupabaseClient,
  userId: string | null,
): Promise<{
  collections: LectureCollectionSummary[];
  resume: LectureResumeState | null;
}> {
  const { data: collections, error } = await supabase
    .from("lecture_collections")
    .select("id, slug, title, excerpt, sort_order, access_tier, published")
    .eq("published", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  const { data: lectures, error: lectureError } = await supabase
    .from("lectures")
    .select("id, collection_id, slug")
    .eq("published", true);

  if (lectureError) throw lectureError;

  const publishedByCollection = new Map<string, number>();
  for (const lecture of lectures ?? []) {
    const collectionId = lecture.collection_id as string;
    publishedByCollection.set(
      collectionId,
      (publishedByCollection.get(collectionId) ?? 0) + 1,
    );
  }

  const progressByCollection = new Map<string, CollectionProgress>();
  let resume: LectureResumeState | null = null;

  if (userId) {
    const { data: progressRows, error: progressError } = await supabase
      .from("user_lecture_progress")
      .select("collection_id, lecture_id, status, finished_at")
      .eq("user_id", userId);

    if (progressError) throw progressError;

    for (const row of progressRows ?? []) {
      const collectionId = row.collection_id as string;
      const current = progressByCollection.get(collectionId) ?? emptyProgress(collectionId);
      if (row.status === "finished") {
        current.finishedCount += 1;
        const finishedAt = row.finished_at as string | null;
        if (
          finishedAt &&
          (!current.lastFinishedAt || finishedAt > current.lastFinishedAt)
        ) {
          current.lastFinishedAt = finishedAt;
          current.lastFinishedLectureId = row.lecture_id as string;
        }
      } else {
        current.startedCount += 1;
      }
      progressByCollection.set(collectionId, current);
    }

    const { data: state } = await supabase
      .from("user_lecture_state")
      .select("last_collection_id, last_lecture_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (state) {
      const lastLecture = (lectures ?? []).find(
        (row) => row.id === state.last_lecture_id,
      );
      const lastCollectionFromLecture = lastLecture
        ? (collections ?? []).find((row) => row.id === lastLecture.collection_id)
        : undefined;
      const lastCollectionFromState = (collections ?? []).find(
        (row) => row.id === state.last_collection_id,
      );
      resume = {
        lastCollectionId:
          (lastLecture?.collection_id as string | undefined) ??
          ((state.last_collection_id as string | null) ?? null),
        lastLectureId: (lastLecture?.id as string | undefined) ?? null,
        lastCollectionSlug:
          (lastCollectionFromLecture?.slug as string | undefined) ??
          (lastCollectionFromState?.slug as string | undefined) ??
          null,
        lastLectureSlug: (lastLecture?.slug as string | undefined) ?? null,
      };
    }
  }

  const mapped = (collections ?? []).map((row) => {
    const progress = progressByCollection.get(row.id as string);
    return {
      id: row.id as string,
      slug: row.slug as string,
      title: row.title as string,
      excerpt: row.excerpt as string,
      descriptionHtml: "",
      sortOrder: row.sort_order as number,
      accessTier: row.access_tier as LectureCollectionSummary["accessTier"],
      published: true,
      publishedCount: publishedByCollection.get(row.id as string) ?? 0,
      finishedCount: progress?.finishedCount ?? 0,
      startedCount: progress?.startedCount ?? 0,
    };
  });

  return {
    collections: mapped,
    resume,
  };
}

export async function loadCollectionStages(
  supabase: SupabaseClient,
  collectionId: string,
): Promise<LectureCollectionStage[]> {
  const { data, error } = await supabase
    .from("lecture_collection_stages")
    .select("id, collection_id, stage_number, title, day_start, day_end")
    .eq("collection_id", collectionId)
    .order("stage_number", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) =>
    mapStageRow({
      id: row.id as string,
      collection_id: row.collection_id as string,
      stage_number: row.stage_number as number,
      title: row.title as string,
      day_start: row.day_start as number,
      day_end: row.day_end as number,
    }),
  );
}

export async function loadPublishedLecturesInCollection(
  supabase: SupabaseClient,
  collectionSlug: string,
  userId: string | null,
): Promise<{
  collection: LectureCollectionSummary | null;
  lectures: Array<LectureSummary & { progress: LectureProgress | null }>;
  stages: LectureCollectionStage[];
  resumeLectureId: string | null;
  enrollmentStartedOn: string | null;
}> {
  const { data: collection, error } = await supabase
    .from("lecture_collections")
    .select("id, slug, title, excerpt, description_html, sort_order, access_tier, published")
    .eq("slug", collectionSlug)
    .eq("published", true)
    .maybeSingle();

  if (error) throw error;
  if (!collection) {
    return {
      collection: null,
      lectures: [],
      stages: [],
      resumeLectureId: null,
      enrollmentStartedOn: null,
    };
  }

  const { data: lectures, error: lectureError } = await supabase
    .from("lectures")
    .select(
      "id, collection_id, slug, title, excerpt, tags, estimated_minutes, sort_order, published, extract_status, day_number, review_goal, is_rest_day, is_mini_test_day, is_final_test_day, format",
    )
    .eq("collection_id", collection.id)
    .eq("published", true)
    .order("sort_order", { ascending: true });

  if (lectureError) throw lectureError;

  const progressByLecture = new Map<string, LectureProgress>();
  let resumeLectureId: string | null = null;
  let enrollmentStartedOn: string | null = null;
  if (userId) {
    const { data: progressRows, error: progressError } = await supabase
      .from("user_lecture_progress")
      .select(`lecture_id, ${LECTURE_PROGRESS_COLUMNS}`)
      .eq("user_id", userId)
      .eq("collection_id", collection.id);

    if (progressError) throw progressError;
    for (const row of progressRows ?? []) {
      progressByLecture.set(row.lecture_id as string, mapLectureProgress(row));
    }

    const { data: state } = await supabase
      .from("user_lecture_state")
      .select("last_lecture_id")
      .eq("user_id", userId)
      .maybeSingle();
    const lastLectureId = (state?.last_lecture_id as string | null) ?? null;
    if (
      lastLectureId &&
      (lectures ?? []).some((row) => row.id === lastLectureId)
    ) {
      resumeLectureId = lastLectureId;
    }

    const { data: enrollment, error: enrollmentError } = await supabase
      .from("lecture_enrollments")
      .select("started_on, status")
      .eq("user_id", userId)
      .eq("collection_id", collection.id)
      .maybeSingle();
    if (enrollmentError) throw enrollmentError;
    if (enrollment?.status === "active" && enrollment.started_on) {
      enrollmentStartedOn = String(enrollment.started_on);
    }
  }

  const publishedCount = lectures?.length ?? 0;
  const finishedCount = [...progressByLecture.values()].filter(
    (row) => row.status === "finished",
  ).length;

  const lectureIds = (lectures ?? []).map((row) => row.id as string);
  const { data: questionRows, error: questionError } = lectureIds.length
    ? await supabase
        .from("lecture_questions")
        .select("lecture_id")
        .in("lecture_id", lectureIds)
    : { data: [], error: null };
  if (questionError) throw questionError;

  const questionCountByLecture = new Map<string, number>();
  for (const row of questionRows ?? []) {
    const lectureId = row.lecture_id as string;
    questionCountByLecture.set(
      lectureId,
      (questionCountByLecture.get(lectureId) ?? 0) + 1,
    );
  }
  const vocabCountByLecture = await countLectureVocabItems(supabase, lectureIds);

  const stages = await loadCollectionStages(supabase, collection.id as string);

  const loaded = {
    collection: {
      id: collection.id as string,
      slug: collection.slug as string,
      title: collection.title as string,
      excerpt: collection.excerpt as string,
      descriptionHtml: sanitizeCollectionDescriptionHtml(
        (collection.description_html as string | null) ?? "",
      ),
      sortOrder: collection.sort_order as number,
      accessTier: collection.access_tier as LectureCollectionSummary["accessTier"],
      published: true,
      publishedCount,
      finishedCount,
      startedCount: progressByLecture.size - finishedCount,
    },
    lectures: (lectures ?? []).map((row) => ({
      id: row.id as string,
      collectionId: row.collection_id as string,
      slug: row.slug as string,
      title: row.title as string,
      excerpt: row.excerpt as string,
      tags: normalizeLectureTags(row.tags),
      estimatedMinutes: (row.estimated_minutes as number | null) ?? null,
      sortOrder: row.sort_order as number,
      published: true,
      extractStatus: row.extract_status as LectureSummary["extractStatus"],
      questionCount: questionCountByLecture.get(row.id as string) ?? 0,
      vocabCount: vocabCountByLecture.get(row.id as string) ?? 0,
      dayNumber: (row.day_number as number | null) ?? null,
      reviewGoal: (row.review_goal as string | null) ?? "",
      isRestDay: Boolean(row.is_rest_day),
      isMiniTestDay: Boolean(row.is_mini_test_day),
      isFinalTestDay: Boolean(row.is_final_test_day),
      format: parseLectureFormat(row.format),
      progress: progressByLecture.get(row.id as string) ?? null,
    })),
    stages,
    resumeLectureId,
    enrollmentStartedOn,
  };

  return loaded;
}
