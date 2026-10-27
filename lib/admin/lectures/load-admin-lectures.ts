import { requireAdminSession } from "@/lib/admin/auth/require-admin";
import {
  emptyKeyAnswer,
  explanationFromUnknown,
  parseKeyAnswer,
  parseLecturePayload,
  type LectureExerciseKind,
} from "@/lib/lectures/exercise";
import type {
  LectureCollectionStage,
  LectureCollectionSummary,
  LectureDetail,
  LectureExtractStatus,
  LectureQuestionWithKey,
  LectureSummary,
} from "@/lib/lectures/types";
import type { LectureOption } from "@/lib/lectures/types";
import { loadCollectionStages } from "@/lib/lectures/load-catalog";
import type { LecturePracticeRef } from "@/lib/lectures/practice";
import { parseLectureFormat } from "@/lib/lectures/format";
import { countLectureVocabItems } from "@/lib/lectures/vocab";
import { sanitizeLectureHtml } from "@/lib/lectures/sanitize-html";
import { normalizeLectureTags } from "@/lib/lectures/tags";

export type AdminTutorLectureOption = {
  id: string;
  title: string;
  collectionTitle: string;
};

export async function fetchAdminPublishedTutorLectures(): Promise<
  AdminTutorLectureOption[]
> {
  const { supabase } = await requireAdminSession();
  const { data: collections, error: collectionError } = await supabase
    .from("lecture_collections")
    .select("id, title")
    .eq("published", true);
  if (collectionError) throw collectionError;

  const titleByCollection = new Map(
    (collections ?? []).map((row) => [row.id as string, row.title as string]),
  );
  const collectionIds = [...titleByCollection.keys()];
  if (collectionIds.length === 0) return [];

  const { data, error } = await supabase
    .from("lectures")
    .select("id, collection_id, title, sort_order")
    .eq("published", true)
    .in("collection_id", collectionIds)
    .order("sort_order", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    collectionTitle: titleByCollection.get(row.collection_id as string) ?? "",
  }));
}

export async function fetchAdminLectureCollections(): Promise<
  LectureCollectionSummary[]
> {
  const { supabase } = await requireAdminSession();
  const { data: collections, error } = await supabase
    .from("lecture_collections")
    .select("id, slug, title, excerpt, description_html, sort_order, access_tier, published")
    .order("sort_order", { ascending: true });

  if (error) throw error;

  const { data: lectures, error: lectureError } = await supabase
    .from("lectures")
    .select("id, collection_id, published");

  if (lectureError) throw lectureError;

  return (collections ?? []).map((row) => {
    const inCollection = (lectures ?? []).filter(
      (lecture) => lecture.collection_id === row.id,
    );
    return {
      id: row.id as string,
      slug: row.slug as string,
      title: row.title as string,
      excerpt: row.excerpt as string,
      descriptionHtml: sanitizeLectureHtml(
        (row.description_html as string | null) ?? "",
      ),
      sortOrder: row.sort_order as number,
      accessTier: row.access_tier as LectureCollectionSummary["accessTier"],
      published: Boolean(row.published),
      publishedCount: inCollection.filter((lecture) => lecture.published).length,
      finishedCount: 0,
      startedCount: inCollection.length,
    };
  });
}

export async function fetchAdminCollectionLectures(
  collectionId: string,
): Promise<{
  collection: LectureCollectionSummary | null;
  lectures: LectureSummary[];
  stages: LectureCollectionStage[];
}> {
  const collections = await fetchAdminLectureCollections();
  const collection = collections.find((entry) => entry.id === collectionId) ?? null;
  if (!collection) return { collection: null, lectures: [], stages: [] };

  const { supabase } = await requireAdminSession();
  const stages = await loadCollectionStages(supabase, collectionId);
  const { data, error } = await supabase
    .from("lectures")
    .select(
      "id, collection_id, slug, title, excerpt, tags, estimated_minutes, sort_order, published, extract_status, day_number, review_goal, is_rest_day, is_mini_test_day, is_final_test_day, format",
    )
    .eq("collection_id", collectionId)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  const lectureIds = (data ?? []).map((row) => row.id as string);
  const { data: questions, error: questionError } = lectureIds.length
    ? await supabase
        .from("lecture_questions")
        .select("lecture_id")
        .in("lecture_id", lectureIds)
    : { data: [], error: null };

  if (questionError) throw questionError;

  const countByLecture = new Map<string, number>();
  for (const row of questions ?? []) {
    const lectureId = row.lecture_id as string;
    countByLecture.set(lectureId, (countByLecture.get(lectureId) ?? 0) + 1);
  }
  const vocabCountByLecture = await countLectureVocabItems(supabase, lectureIds);

  return {
    collection,
    lectures: (data ?? []).map((row) => ({
      id: row.id as string,
      collectionId: row.collection_id as string,
      slug: row.slug as string,
      title: row.title as string,
      excerpt: row.excerpt as string,
      tags: normalizeLectureTags(row.tags),
      estimatedMinutes: (row.estimated_minutes as number | null) ?? null,
      sortOrder: row.sort_order as number,
      published: Boolean(row.published),
      extractStatus: row.extract_status as LectureExtractStatus,
      questionCount: countByLecture.get(row.id as string) ?? 0,
      vocabCount: vocabCountByLecture.get(row.id as string) ?? 0,
      dayNumber: (row.day_number as number | null) ?? null,
      reviewGoal: (row.review_goal as string | null) ?? "",
      isRestDay: Boolean(row.is_rest_day),
      isMiniTestDay: Boolean(row.is_mini_test_day),
      isFinalTestDay: Boolean(row.is_final_test_day),
      format: parseLectureFormat(row.format),
    })),
    stages,
  };
}

export async function fetchAdminLectureEditor(
  collectionId: string,
  lectureId: string,
): Promise<{
  lecture: LectureDetail | null;
  questions: LectureQuestionWithKey[];
  practiceQuestions: LecturePracticeRef[];
}> {
  const { supabase } = await requireAdminSession();
  const { data, error } = await supabase
    .from("lectures")
    .select(
      "id, collection_id, slug, title, excerpt, body_html, tags, estimated_minutes, sort_order, published, extract_status, extract_error, day_number, review_goal, is_rest_day, is_mini_test_day, is_final_test_day, format",
    )
    .eq("id", lectureId)
    .eq("collection_id", collectionId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { lecture: null, questions: [], practiceQuestions: [] };

  const { data: questionRows, error: questionError } = await supabase
    .from("lecture_questions")
    .select("id, sort_order, kind, stem, options, payload")
    .eq("lecture_id", lectureId)
    .order("sort_order", { ascending: true });

  if (questionError) throw questionError;

  const questionIds = (questionRows ?? []).map((row) => row.id as string);
  const { data: keys, error: keyError } = questionIds.length
    ? await supabase
        .from("lecture_question_keys")
        .select("question_id, correct_option_id, explanation, answer")
        .in("question_id", questionIds)
    : { data: [], error: null };

  if (keyError) throw keyError;

  const { data: practiceLinks, error: practiceError } = await supabase
    .from("lecture_practice_questions")
    .select("question_id, sort_order")
    .eq("lecture_id", lectureId)
    .order("sort_order", { ascending: true });
  if (practiceError) throw practiceError;

  const practiceIds = (practiceLinks ?? []).map((row) => row.question_id as string);
  const { data: bankRows, error: bankError } = practiceIds.length
    ? await supabase
        .from("questions")
        .select("id, part, global_item_number, prompt")
        .in("id", practiceIds)
    : { data: [], error: null };
  if (bankError) throw bankError;
  const bankById = new Map((bankRows ?? []).map((row) => [row.id as string, row]));

  const keyById = new Map(
    (keys ?? []).map((row) => [row.question_id as string, row]),
  );

  return {
    lecture: {
      id: data.id as string,
      collectionId: data.collection_id as string,
      slug: data.slug as string,
      title: data.title as string,
      excerpt: data.excerpt as string,
      bodyHtml: sanitizeLectureHtml(data.body_html as string),
      tags: normalizeLectureTags(data.tags),
      estimatedMinutes: (data.estimated_minutes as number | null) ?? null,
      sortOrder: data.sort_order as number,
      published: Boolean(data.published),
      extractStatus: data.extract_status as LectureExtractStatus,
      questionCount: questionRows?.length ?? 0,
      dayNumber: (data.day_number as number | null) ?? null,
      reviewGoal: (data.review_goal as string | null) ?? "",
      isRestDay: Boolean(data.is_rest_day),
      isMiniTestDay: Boolean(data.is_mini_test_day),
      isFinalTestDay: Boolean(data.is_final_test_day),
      format: parseLectureFormat(data.format),
      extractError: (data.extract_error as string | null) ?? null,
    },
    questions: (questionRows ?? []).map((row) => {
      const key = keyById.get(row.id as string);
      const kind = (row.kind as LectureExerciseKind | null) ?? "multiple_choice";
      return {
        id: row.id as string,
        sortOrder: row.sort_order as number,
        kind,
        stem: row.stem as string,
        options: (row.options ?? []) as LectureOption[],
        payload: parseLecturePayload(row.payload),
        correctOptionId: (key?.correct_option_id as string | null) ?? null,
        explanation: explanationFromUnknown(key?.explanation),
        answer: key ? parseKeyAnswer(key.answer) : emptyKeyAnswer(),
      };
    }),
    practiceQuestions: (practiceLinks ?? []).flatMap((link) => {
      const bank = bankById.get(link.question_id as string);
      if (!bank) return [];
      return [
        {
          questionId: bank.id as string,
          part: String(bank.part),
          globalItemNumber: bank.global_item_number as number,
          stem: String(bank.prompt ?? "").replace(/\s+/g, " ").trim(),
        },
      ];
    }),
  };
}
