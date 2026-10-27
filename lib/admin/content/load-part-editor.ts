import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AdminPartEditorData,
  AdminPartOptionRow,
  AdminPartQuestionRow,
  AdminPassageRow,
  AdminPassageSetRow,
} from "@/types/admin-part-editor";
import { normalizeContentVocabulary } from "@/lib/content/content-vocabulary";
import { parseQuestionExplanation } from "@/lib/content/question-explanation";
import { fetchQuestionExplanationsByIds } from "@/lib/content/question-explanations-db";
import { normalizeQuestionTranslations } from "@/lib/content/question-metadata";
import { buildListeningPart1ImagePath } from "@/lib/content/listening-image-paths";
import { normalizeTranscriptSegments } from "@/lib/listening/transcript-segments";
import type { ToeicPartDb } from "@/types/content-db";

interface MediaAssetRow {
  id: string;
  storage_bucket: string;
  storage_path: string;
}

interface AnswerOptionRow {
  id: string;
  slug: string;
  label: AdminPartOptionRow["label"];
  text: string;
  sort_order: number;
  audio_asset_id: string | null;
}

interface QuestionRow {
  id: string;
  slug: string;
  global_item_number: number;
  prompt: string;
  hint: string | null;
  free_explanation: boolean;
  tags: string[];
  translations: unknown;
  translation_html: string | null;
  correct_option_id: string | null;
  audio_asset_id: string | null;
  stem_audio_asset_id: string | null;
  context_image_asset_id: string | null;
  listening_group_id: string | null;
  reading_passage_set_id: string | null;
  answer_options: AnswerOptionRow[];
}

interface PassageSetRow {
  id: string;
  slug: string;
  topic: string | null;
  free_explanation: boolean;
  layout: AdminPassageSetRow["layout"];
  content_model: string;
  sort_order: number;
}

interface PassageRow {
  id: string;
  slug: string;
  title: string;
  content: string;
  sort_order: number;
  passage_set_id: string;
  translations: unknown;
  translation_html: string | null;
}

const PART_TARGETS: Record<ToeicPartDb, number> = {
  "1": 6,
  "2": 25,
  "3": 39,
  "4": 30,
  "5": 30,
  "6": 16,
  "7": 54,
};

function pathFromAsset(
  asset: MediaAssetRow | null | undefined,
): string | null {
  if (!asset) return null;
  return asset.storage_path;
}

async function loadMediaByIds(
  supabase: SupabaseClient,
  ids: string[],
): Promise<Map<string, MediaAssetRow>> {
  const map = new Map<string, MediaAssetRow>();
  if (ids.length === 0) return map;

  const { data, error } = await supabase
    .from("media_assets")
    .select("id, storage_bucket, storage_path")
    .in("id", ids);

  if (error) throw error;

  for (const row of data ?? []) {
    map.set(row.id, row);
  }

  return map;
}

export async function loadPartQuestionOrder(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  part: number,
): Promise<Array<{ id: string; globalItemNumber: number }>> {
  const partDb = String(part) as ToeicPartDb;

  const { data, error } = await supabase
    .from("questions")
    .select("id, global_item_number")
    .eq("book_id", bookId)
    .eq("test_id", testId)
    .eq("part", partDb)
    .order("global_item_number", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    globalItemNumber: row.global_item_number,
  }));
}

export async function loadAdminPartEditor(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  part: number,
): Promise<AdminPartEditorData | null> {
  const partDb = String(part) as ToeicPartDb;

  const { data: testPart, error: partError } = await supabase
    .from("test_parts")
    .select("title, question_count_target")
    .eq("book_id", bookId)
    .eq("test_id", testId)
    .eq("part", partDb)
    .maybeSingle();

  if (partError) throw partError;

  const { data: questionRows, error: questionError } = await supabase
    .from("questions")
    .select(
      `
      id,
      slug,
      global_item_number,
      prompt,
      hint,
      free_explanation,
      tags,
      translations,
      translation_html,
      correct_option_id,
      audio_asset_id,
      stem_audio_asset_id,
      context_image_asset_id,
      listening_group_id,
      reading_passage_set_id,
      answer_options!answer_options_question_id_fkey (
        id,
        slug,
        label,
        text,
        sort_order,
        audio_asset_id
      )
    `,
    )
    .eq("book_id", bookId)
    .eq("test_id", testId)
    .eq("part", partDb)
    .order("global_item_number", { ascending: true });

  if (questionError) throw questionError;

  const questions = (questionRows ?? []) as QuestionRow[];
  const questionIds = questions.map((q) => q.id);
  const explanationByQuestionId = await fetchQuestionExplanationsByIds(
    supabase,
    questionIds,
  );
  const groupIds = [
    ...new Set(
      questions
        .map((q) => q.listening_group_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const [part1Rows, part2Rows, groupRows] = await Promise.all([
    questionIds.length > 0 && part === 1
      ? supabase
          .from("listening_part1_items")
          .select("question_id, image_asset_id")
          .in("question_id", questionIds)
      : Promise.resolve({ data: [], error: null }),
    questionIds.length > 0 && part === 2
      ? supabase
          .from("listening_part2_items")
          .select("question_id, transcript, audio_asset_id")
          .in("question_id", questionIds)
      : Promise.resolve({ data: [], error: null }),
    groupIds.length > 0
      ? supabase
          .from("listening_groups")
          .select(
            "id, slug, topic, transcript, vocabulary, audio_asset_id, free_explanation, transcript_segments",
          )
          .in("id", groupIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (part1Rows.error) throw part1Rows.error;
  if (part2Rows.error) throw part2Rows.error;
  if (groupRows.error) throw groupRows.error;

  const assetIds = new Set<string>();
  for (const question of questions) {
    for (const option of question.answer_options ?? []) {
      if (option.audio_asset_id) assetIds.add(option.audio_asset_id);
    }
  }
  for (const question of questions) {
    if (question.audio_asset_id) assetIds.add(question.audio_asset_id);
    if (question.stem_audio_asset_id) assetIds.add(question.stem_audio_asset_id);
    if (question.context_image_asset_id) assetIds.add(question.context_image_asset_id);
  }
  for (const row of part1Rows.data ?? []) {
    if (row.image_asset_id) assetIds.add(row.image_asset_id);
  }
  for (const row of part2Rows.data ?? []) {
    if (row.audio_asset_id) assetIds.add(row.audio_asset_id);
  }
  for (const row of groupRows.data ?? []) {
    if (row.audio_asset_id) assetIds.add(row.audio_asset_id);
  }

  const mediaById = await loadMediaByIds(supabase, [...assetIds]);

  const part1ByQuestion = new Map(
    (part1Rows.data ?? []).map((row) => [row.question_id, row]),
  );
  const part2ByQuestion = new Map(
    (part2Rows.data ?? []).map((row) => [row.question_id, row]),
  );
  const groupById = new Map((groupRows.data ?? []).map((row) => [row.id, row]));

  const firstQuestionIdByGroup = new Map<string, string>();
  for (const question of questions) {
    if (!question.listening_group_id) continue;
    const current = firstQuestionIdByGroup.get(question.listening_group_id);
    if (!current) {
      firstQuestionIdByGroup.set(question.listening_group_id, question.id);
      continue;
    }
    const currentQ = questions.find((q) => q.id === current);
    if (currentQ && question.global_item_number < currentQ.global_item_number) {
      firstQuestionIdByGroup.set(question.listening_group_id, question.id);
    }
  }

  const editorQuestions: AdminPartQuestionRow[] = questions.map((question) => {
    const sortedOptions = [...(question.answer_options ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    );

    const options: AdminPartOptionRow[] = sortedOptions.map((option) => ({
      id: option.id,
      slug: option.slug,
      label: option.label,
      text: option.text,
      sortOrder: option.sort_order,
      audioAssetId: option.audio_asset_id,
      audioStoragePath: pathFromAsset(
        option.audio_asset_id ? mediaById.get(option.audio_asset_id) : null,
      ),
    }));

    const part1 = part1ByQuestion.get(question.id);
    const imageAssetId =
      part1?.image_asset_id ?? question.context_image_asset_id ?? null;
    const group = question.listening_group_id
      ? groupById.get(question.listening_group_id)
      : null;
    const groupAudioAssetId = group?.audio_asset_id ?? null;
    const part2 = part2ByQuestion.get(question.id);
    const part2AudioAssetId = part2?.audio_asset_id ?? null;
    const questionWholeAssetId =
      part === 1 ? question.audio_asset_id : null;
    const questionStemAssetId =
      part === 1
        ? question.stem_audio_asset_id
        : question.audio_asset_id;
    const isFirstInGroup =
      question.listening_group_id !== null &&
      firstQuestionIdByGroup.get(question.listening_group_id) === question.id;
    const groupTranscript = group?.transcript ?? null;
    const transcriptAudioAssetId =
      part === 1
        ? questionWholeAssetId
        : part === 2
          ? part2AudioAssetId
          : groupAudioAssetId;
    const transcriptAudioStoragePath = pathFromAsset(
      transcriptAudioAssetId ? mediaById.get(transcriptAudioAssetId) : null,
    );

    return {
      id: question.id,
      slug: question.slug,
      globalItemNumber: question.global_item_number,
      prompt: question.prompt,
      hint: question.hint ?? null,
      explanation: parseQuestionExplanation(
        explanationByQuestionId.get(question.id),
      ),
      freeExplanation: Boolean(question.free_explanation),
      tags: question.tags ?? [],
      translations: normalizeQuestionTranslations(question.translations),
      translationHtml: question.translation_html?.trim() || null,
      correctOptionId: question.correct_option_id,
      options,
      imageAssetId,
      imageStoragePath:
        part === 1
          ? buildListeningPart1ImagePath(
              bookId,
              testId,
              question.global_item_number,
            )
          : pathFromAsset(
              imageAssetId ? mediaById.get(imageAssetId) : null,
            ),
      transcript: part2?.transcript ?? null,
      transcriptAudioStoragePath,
      transcriptAudioAssetId,
      groupTranscript,
      questionAudioStoragePath: pathFromAsset(
        questionStemAssetId ? mediaById.get(questionStemAssetId) : null,
      ),
      questionAudioAssetId: questionStemAssetId,
      listeningGroupId: question.listening_group_id,
      listeningGroupSlug: group?.slug ?? null,
      groupAudioAssetId,
      groupAudioStoragePath: pathFromAsset(
        groupAudioAssetId ? mediaById.get(groupAudioAssetId) : null,
      ),
      groupTopic: group?.topic ?? null,
      groupFreeExplanation: Boolean(
        (group as { free_explanation?: boolean } | null)?.free_explanation,
      ),
      groupVocabulary: normalizeContentVocabulary(
        (group as { vocabulary?: unknown } | null)?.vocabulary,
      ),
      groupTranscriptSegments: normalizeTranscriptSegments(
        (group as { transcript_segments?: unknown } | null)
          ?.transcript_segments,
      ),
      isFirstInGroup,
      readingPassageSetId: question.reading_passage_set_id,
    };
  });

  let passageSets: AdminPassageSetRow[] = [];

  if (part === 6 || part === 7) {
    const { data: setRows, error: setError } = await supabase
      .from("reading_passage_sets")
      .select(
        "id, slug, topic, vocabulary, layout, content_model, sort_order, free_explanation",
      )
      .eq("book_id", bookId)
      .eq("test_id", testId)
      .eq("part", partDb)
      .order("sort_order", { ascending: true });

    if (setError) throw setError;

    const sets = (setRows ?? []) as PassageSetRow[];
    const setIds = sets.map((set) => set.id);

    const { data: passageRows, error: passageError } =
      setIds.length > 0
        ? await supabase
            .from("reading_passages")
            .select(
              "id, slug, title, content, sort_order, passage_set_id, translations, translation_html",
            )
            .in("passage_set_id", setIds)
            .order("sort_order", { ascending: true })
        : { data: [], error: null };

    if (passageError) throw passageError;

    const passagesBySet = new Map<string, AdminPassageRow[]>();
    for (const row of (passageRows ?? []) as PassageRow[]) {
      const passage: AdminPassageRow = {
        id: row.id,
        slug: row.slug,
        title: row.title,
        content: row.content,
        sortOrder: row.sort_order,
        translations:
          part === 7
            ? normalizeQuestionTranslations(row.translations)
            : [],
        translationHtml: row.translation_html?.trim() || null,
      };
      const list = passagesBySet.get(row.passage_set_id) ?? [];
      list.push(passage);
      passagesBySet.set(row.passage_set_id, list);
    }

    const questionIdsBySet = new Map<string, string[]>();
    for (const question of editorQuestions) {
      if (!question.readingPassageSetId) continue;
      const list = questionIdsBySet.get(question.readingPassageSetId) ?? [];
      list.push(question.id);
      questionIdsBySet.set(question.readingPassageSetId, list);
    }

    passageSets = sets.map((set) => ({
      id: set.id,
      slug: set.slug,
      topic: set.topic ?? null,
      freeExplanation: Boolean(set.free_explanation),
      vocabulary: normalizeContentVocabulary(
        (set as { vocabulary?: unknown }).vocabulary,
      ),
      layout: set.layout,
      contentModel: set.content_model,
      sortOrder: set.sort_order,
      passages: passagesBySet.get(set.id) ?? [],
      questionIds: questionIdsBySet.get(set.id) ?? [],
    }));
  }

  return {
    bookId,
    testId,
    part: partDb,
    partTitle: testPart?.title ?? `Part ${part}`,
    targetCount: testPart?.question_count_target ?? PART_TARGETS[partDb],
    questions: editorQuestions,
    passageSets,
  };
}
