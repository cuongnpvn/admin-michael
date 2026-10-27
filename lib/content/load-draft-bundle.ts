import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  LoadedDraftBundle,
  LoadedListeningGroup,
  LoadedQuestion,
  LoadedReadingPassageSet,
} from "@/lib/content/draft-types";
import { normalizeContentVocabulary } from "@/lib/content/content-vocabulary";
import { normalizeTranscriptSegments } from "@/lib/listening/transcript-segments";
import { parseQuestionExplanation } from "@/lib/content/question-explanation";
import { fetchQuestionExplanationsByIds } from "@/lib/content/question-explanations-db";
import { normalizeQuestionTranslations } from "@/lib/content/question-metadata";
import type { PublishSection } from "@/lib/content/publish-test";
import { chunkForInQuery } from "@/lib/supabase/batch-in-query";
import type { ToeicPartDb } from "@/types/content-db";

interface MediaAssetRow {
  id: string;
  storage_bucket: string;
  storage_path: string;
}

interface AnswerOptionRow {
  id: string;
  slug: string;
  label: LoadedQuestion["options"][number]["label"];
  text: string;
  sort_order: number;
  audio_asset_id: string | null;
}

interface QuestionRow {
  id: string;
  slug: string;
  part: ToeicPartDb;
  global_item_number: number;
  prompt: string;
  hint: string | null;
  free_explanation: boolean;
  tags: string[];
  translations: unknown;
  vocabulary: unknown;
  translation_html: string | null;
  correct_option_id: string | null;
  audio_asset_id: string | null;
  stem_audio_asset_id: string | null;
  context_image_asset_id: string | null;
  listening_group_id: string | null;
  reading_passage_set_id: string | null;
  answer_options: AnswerOptionRow[];
}

interface ListeningGroupRow {
  id: string;
  slug: string;
  part: "3" | "4";
  topic: string | null;
  transcript: string;
  vocabulary: unknown;
  format: "dialogue" | "monologue";
  stimulus_kind: LoadedListeningGroup["stimulusKind"];
  sort_order: number;
  free_explanation: boolean;
  audio_asset_id: string | null;
  transcript_segments: unknown;
}

interface ReadingPassageSetRow {
  id: string;
  slug: string;
  part: "6" | "7";
  topic: string | null;
  vocabulary: unknown;
  content_model: "comprehension" | "text_completion_cloze";
  layout: "single" | "double" | "triple";
  sort_order: number;
  free_explanation: boolean;
}

interface ReadingPassageRow {
  id: string;
  passage_set_id: string;
  slug: string;
  title: string;
  content: string;
  sort_order: number;
  translations: unknown;
  translation_html: string | null;
}

interface Part1ItemRow {
  question_id: string;
  image_asset_id: string | null;
}

interface Part2ItemRow {
  question_id: string;
  transcript: string;
  audio_asset_id: string | null;
}

export type RequirePublishedGate = boolean | PublishSection | "exam";

export interface LoadDraftBundleOptions {
  parts?: number[];
  /** true/'exam' = full exam flag; 'listening'/'reading' = section flags; false = admin draft */
  requirePublished?: RequirePublishedGate;
  /** Server-only: bypass media_assets RLS for published learner content. */
  resolveMediaWithServiceRole?: boolean;
}

function inferPublishGate(
  parts: number[] | undefined,
  requirePublished: RequirePublishedGate,
): RequirePublishedGate {
  if (requirePublished !== true) return requirePublished;
  if (!parts || parts.length === 0) return "exam";
  if (parts.every((p) => p <= 4)) return "listening";
  if (parts.every((p) => p >= 5)) return "reading";
  return "exam";
}

function isPublishedForGate(
  testRow: {
    published: boolean;
    listening_published: boolean;
    reading_published: boolean;
  },
  gate: RequirePublishedGate,
): boolean {
  if (gate === false) return true;
  if (gate === "listening") {
    return Boolean(testRow.listening_published || testRow.published);
  }
  if (gate === "reading") {
    return Boolean(testRow.reading_published || testRow.published);
  }
  return Boolean(testRow.published);
}

function publishedAtForGate(
  testRow: {
    published: boolean;
    published_at: string | null;
    listening_published_at: string | null;
    reading_published_at: string | null;
  },
  gate: RequirePublishedGate,
): string | null {
  if (gate === "listening") {
    return (
      (testRow.listening_published_at as string | null) ??
      (testRow.published ? (testRow.published_at as string | null) : null)
    );
  }
  if (gate === "reading") {
    return (
      (testRow.reading_published_at as string | null) ??
      (testRow.published ? (testRow.published_at as string | null) : null)
    );
  }
  return (testRow.published_at as string | null) ?? null;
}

export interface LoadDraftBundleResult {
  bundle: LoadedDraftBundle;
  publishedAt: string | null;
}

async function loadMediaByIds(
  supabase: SupabaseClient,
  ids: string[],
): Promise<Map<string, MediaAssetRow>> {
  const map = new Map<string, MediaAssetRow>();
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length === 0) return map;

  for (const batch of chunkForInQuery(uniqueIds)) {
    const { data, error } = await supabase
      .from("media_assets")
      .select("id, storage_bucket, storage_path")
      .in("id", batch);

    if (error) throw error;

    for (const row of data ?? []) {
      map.set(row.id, row as MediaAssetRow);
    }
  }

  return map;
}

async function loadPart1ItemsByQuestionIds(
  supabase: SupabaseClient,
  questionIds: string[],
): Promise<Part1ItemRow[]> {
  if (questionIds.length === 0) return [];

  const rows: Part1ItemRow[] = [];
  for (const batch of chunkForInQuery(questionIds)) {
    const { data, error } = await supabase
      .from("listening_part1_items")
      .select("question_id, image_asset_id")
      .in("question_id", batch);

    if (error) throw error;
    rows.push(...((data ?? []) as Part1ItemRow[]));
  }

  return rows;
}

async function loadPart2ItemsByQuestionIds(
  supabase: SupabaseClient,
  questionIds: string[],
): Promise<Part2ItemRow[]> {
  if (questionIds.length === 0) return [];

  const rows: Part2ItemRow[] = [];
  for (const batch of chunkForInQuery(questionIds)) {
    const { data, error } = await supabase
      .from("listening_part2_items")
      .select("question_id, transcript, audio_asset_id")
      .in("question_id", batch);

    if (error) throw error;
    rows.push(...((data ?? []) as Part2ItemRow[]));
  }

  return rows;
}

async function loadPassagesBySetIds(
  supabase: SupabaseClient,
  setIds: string[],
): Promise<ReadingPassageRow[]> {
  if (setIds.length === 0) return [];

  const rows: ReadingPassageRow[] = [];
  for (const batch of chunkForInQuery(setIds)) {
    const { data, error } = await supabase
      .from("reading_passages")
      .select("id, passage_set_id, slug, title, content, sort_order, translations, translation_html")
      .in("passage_set_id", batch)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    rows.push(...((data ?? []) as ReadingPassageRow[]));
  }

  return rows;
}

function toMediaRef(
  assetId: string | null | undefined,
  mediaById: Map<string, MediaAssetRow>,
): { storageBucket: string; storagePath: string } | null {
  if (!assetId) return null;
  const asset = mediaById.get(assetId);
  if (!asset) return null;
  return { storageBucket: asset.storage_bucket, storagePath: asset.storage_path };
}

function normalizeTranslationHtml(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function mapQuestion(
  row: QuestionRow,
  mediaById: Map<string, MediaAssetRow>,
  explanationByQuestionId: Map<string, unknown>,
): LoadedQuestion {
  const sortedOptions = [...(row.answer_options ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  return {
    id: row.id,
    slug: row.slug,
    part: row.part,
    globalItemNumber: row.global_item_number,
    prompt: row.prompt,
    hint: row.hint ?? null,
    explanation: parseQuestionExplanation(explanationByQuestionId.get(row.id)),
    freeExplanation: Boolean(row.free_explanation),
    tags: row.tags ?? [],
    translations: normalizeQuestionTranslations(row.translations),
    vocabulary: normalizeContentVocabulary(row.vocabulary),
    translationHtml: normalizeTranslationHtml(row.translation_html),
    correctOptionId: row.correct_option_id,
    audioAsset: toMediaRef(row.audio_asset_id, mediaById),
    stemAudioAsset: toMediaRef(row.stem_audio_asset_id, mediaById),
    contextImageAsset: toMediaRef(row.context_image_asset_id, mediaById),
    options: sortedOptions.map((option) => ({
      id: option.id,
      slug: option.slug,
      label: option.label,
      text: option.text,
      sortOrder: option.sort_order,
      audioAsset: toMediaRef(option.audio_asset_id, mediaById),
    })),
  };
}

function partFilter(parts: number[] | undefined): ToeicPartDb[] | undefined {
  if (!parts || parts.length === 0) return undefined;
  return parts.map((part) => String(part) as ToeicPartDb);
}

export async function loadDraftBundle(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  options: LoadDraftBundleOptions = {},
): Promise<LoadDraftBundleResult | null> {
  const { parts, requirePublished = true, resolveMediaWithServiceRole = false } =
    options;
  const partFilterDb = partFilter(parts);

  const publishGate = inferPublishGate(parts, requirePublished);

  const { data: testRow, error: testError } = await supabase
    .from("tests")
    .select(
      "label, published, published_at, listening_published, listening_published_at, reading_published, reading_published_at, listening_audio_asset_id, books(name)",
    )
    .eq("book_id", bookId)
    .eq("id", testId)
    .maybeSingle();

  if (testError) throw testError;
  if (!testRow) return null;
  if (
    publishGate !== false &&
    !isPublishedForGate(
      testRow as {
        published: boolean;
        listening_published: boolean;
        reading_published: boolean;
      },
      publishGate,
    )
  ) {
    return null;
  }

  const bookRow = testRow.books as unknown;
  const bookName =
    (Array.isArray(bookRow)
      ? typeof bookRow[0]?.name === "string"
        ? bookRow[0].name
        : undefined
      : bookRow &&
          typeof bookRow === "object" &&
          "name" in bookRow &&
          typeof bookRow.name === "string"
        ? bookRow.name
        : undefined) ?? bookId;
  const testTitle = `${bookName} — ${testRow.label}`;

  const { data: testParts, error: partsError } = await supabase
    .from("test_parts")
    .select("part, title")
    .eq("book_id", bookId)
    .eq("test_id", testId)
    .order("sort_order", { ascending: true });

  if (partsError) throw partsError;

  const partTitles: Record<number, string> = {};
  for (const row of testParts ?? []) {
    const partNum = Number.parseInt(String(row.part), 10);
    if (partFilterDb && !partFilterDb.includes(row.part as ToeicPartDb)) {
      continue;
    }
    partTitles[partNum] = row.title as string;
  }

  let questionsQuery = supabase
    .from("questions")
    .select(
      `
      id,
      slug,
      part,
      global_item_number,
      prompt,
      hint,
      free_explanation,
      tags,
      translations,
      vocabulary,
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
    .order("global_item_number", { ascending: true });

  if (partFilterDb) {
    questionsQuery = questionsQuery.in("part", partFilterDb);
  }

  const { data: questionRows, error: questionError } = await questionsQuery;
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
  const setIds = [
    ...new Set(
      questions
        .map((q) => q.reading_passage_set_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const needsPart1 = !partFilterDb || partFilterDb.includes("1");
  const needsPart2 = !partFilterDb || partFilterDb.includes("2");
  const needsGroups =
    !partFilterDb || partFilterDb.includes("3") || partFilterDb.includes("4");
  const needsSets =
    !partFilterDb || partFilterDb.includes("6") || partFilterDb.includes("7");

  const [part1Rows, part2Rows, groupRows, setRows, passageRows] =
    await Promise.all([
      questionIds.length > 0 && needsPart1
        ? loadPart1ItemsByQuestionIds(supabase, questionIds).then((data) => ({
            data,
            error: null,
          }))
        : Promise.resolve({ data: [], error: null }),
      questionIds.length > 0 && needsPart2
        ? loadPart2ItemsByQuestionIds(supabase, questionIds).then((data) => ({
            data,
            error: null,
          }))
        : Promise.resolve({ data: [], error: null }),
      needsGroups
        ? supabase
            .from("listening_groups")
            .select(
              "id, slug, part, topic, transcript, vocabulary, format, stimulus_kind, sort_order, free_explanation, audio_asset_id, transcript_segments",
            )
            .eq("book_id", bookId)
            .eq("test_id", testId)
            .order("sort_order", { ascending: true })
        : Promise.resolve({ data: [], error: null }),
      needsSets
        ? supabase
            .from("reading_passage_sets")
            .select(
              "id, slug, part, topic, vocabulary, content_model, layout, sort_order, free_explanation",
            )
            .eq("book_id", bookId)
            .eq("test_id", testId)
            .order("sort_order", { ascending: true })
        : Promise.resolve({ data: [], error: null }),
      setIds.length > 0
        ? loadPassagesBySetIds(supabase, setIds).then((data) => ({
            data,
            error: null,
          }))
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (part1Rows.error) throw part1Rows.error;
  if (part2Rows.error) throw part2Rows.error;
  if (groupRows.error) throw groupRows.error;
  if (setRows.error) throw setRows.error;
  if (passageRows.error) throw passageRows.error;

  const assetIds = new Set<string>();
  for (const question of questions) {
    if (question.audio_asset_id) assetIds.add(question.audio_asset_id);
    if (question.stem_audio_asset_id) assetIds.add(question.stem_audio_asset_id);
    if (question.context_image_asset_id) assetIds.add(question.context_image_asset_id);
    for (const option of question.answer_options ?? []) {
      if (option.audio_asset_id) assetIds.add(option.audio_asset_id);
    }
  }
  for (const row of (part2Rows.data ?? []) as Part2ItemRow[]) {
    if (row.audio_asset_id) assetIds.add(row.audio_asset_id);
  }
  for (const row of (part1Rows.data ?? []) as Part1ItemRow[]) {
    if (row.image_asset_id) assetIds.add(row.image_asset_id);
  }
  for (const row of (groupRows.data ?? []) as ListeningGroupRow[]) {
    if (row.audio_asset_id) assetIds.add(row.audio_asset_id);
  }
  const listeningTestAudioAssetId = (
    testRow as { listening_audio_asset_id?: string | null }
  ).listening_audio_asset_id;
  if (listeningTestAudioAssetId) {
    assetIds.add(listeningTestAudioAssetId);
  }

  let mediaLookupClient = supabase;
  if (resolveMediaWithServiceRole) {
    try {
      const { createServiceRoleClient } = await import("@/lib/supabase/service");
      mediaLookupClient = createServiceRoleClient();
    } catch {
      mediaLookupClient = supabase;
    }
  }

  const mediaById = await loadMediaByIds(mediaLookupClient, [...assetIds]);
  const loadedQuestions = new Map(
    questions.map((row) => [
      row.id,
      mapQuestion(row, mediaById, explanationByQuestionId),
    ]),
  );

  const part1ByQuestion = new Map(
    ((part1Rows.data ?? []) as Part1ItemRow[]).map((row) => [row.question_id, row]),
  );
  const part2ByQuestion = new Map(
    ((part2Rows.data ?? []) as Part2ItemRow[]).map((row) => [row.question_id, row]),
  );

  const bundle: LoadedDraftBundle = {
    bookId,
    testId,
    testTitle,
    listeningTestAudioAsset: toMediaRef(listeningTestAudioAssetId, mediaById),
    partTitles,
    part1Items: [],
    part2Items: [],
    listeningGroups: [],
    readingPassageSets: [],
    standaloneQuestions: [],
  };

  for (const row of questions) {
    const question = loadedQuestions.get(row.id);
    if (!question) continue;

    if (row.part === "1") {
      const part1 = part1ByQuestion.get(row.id);
      const imageAsset = toMediaRef(part1?.image_asset_id, mediaById);
      bundle.part1Items.push({
        question,
        imageAsset,
      });
    } else if (row.part === "2") {
      const part2 = part2ByQuestion.get(row.id);
      bundle.part2Items.push({
        question,
        transcript: part2?.transcript ?? "",
        transcriptAudioAsset: toMediaRef(part2?.audio_asset_id, mediaById),
      });
    } else if (row.part === "5") {
      bundle.standaloneQuestions.push(question);
    }
  }

  const questionsByGroup = new Map<string, LoadedQuestion[]>();
  for (const row of questions) {
    if (!row.listening_group_id) continue;
    const question = loadedQuestions.get(row.id);
    if (!question) continue;
    const list = questionsByGroup.get(row.listening_group_id) ?? [];
    list.push(question);
    questionsByGroup.set(row.listening_group_id, list);
  }

  for (const groupRow of (groupRows.data ?? []) as ListeningGroupRow[]) {
    if (partFilterDb && !partFilterDb.includes(groupRow.part)) continue;

    bundle.listeningGroups.push({
      id: groupRow.id,
      slug: groupRow.slug,
      part: groupRow.part,
      topic: groupRow.topic,
      transcript: groupRow.transcript,
      vocabulary: normalizeContentVocabulary(groupRow.vocabulary),
      format: groupRow.format,
      stimulusKind: groupRow.stimulus_kind,
      sortOrder: groupRow.sort_order,
      freeExplanation: Boolean(groupRow.free_explanation),
      audioAsset: toMediaRef(groupRow.audio_asset_id, mediaById),
      transcriptSegments: normalizeTranscriptSegments(
        groupRow.transcript_segments,
      ),
      questions: (questionsByGroup.get(groupRow.id) ?? []).sort(
        (a, b) => a.globalItemNumber - b.globalItemNumber,
      ),
    });
  }

  const questionsBySet = new Map<string, LoadedQuestion[]>();
  for (const row of questions) {
    if (!row.reading_passage_set_id) continue;
    const question = loadedQuestions.get(row.id);
    if (!question) continue;
    const list = questionsBySet.get(row.reading_passage_set_id) ?? [];
    list.push(question);
    questionsBySet.set(row.reading_passage_set_id, list);
  }

  const passagesBySet = new Map<string, ReadingPassageRow[]>();
  for (const passage of (passageRows.data ?? []) as ReadingPassageRow[]) {
    const list = passagesBySet.get(passage.passage_set_id) ?? [];
    list.push(passage);
    passagesBySet.set(passage.passage_set_id, list);
  }

  for (const setRow of (setRows.data ?? []) as ReadingPassageSetRow[]) {
    if (partFilterDb && !partFilterDb.includes(setRow.part)) continue;

    const passages = (passagesBySet.get(setRow.id) ?? []).sort(
      (a, b) => a.sort_order - b.sort_order,
    );

    const loadedSet: LoadedReadingPassageSet = {
      id: setRow.id,
      slug: setRow.slug,
      part: setRow.part,
      topic: setRow.topic,
      vocabulary: normalizeContentVocabulary(setRow.vocabulary),
      contentModel: setRow.content_model,
      layout: setRow.layout,
      sortOrder: setRow.sort_order,
      freeExplanation: Boolean(setRow.free_explanation),
      passages: passages.map((passage) => ({
        id: passage.id,
        slug: passage.slug,
        title: passage.title,
        content: passage.content,
        sortOrder: passage.sort_order,
        translations: normalizeQuestionTranslations(passage.translations),
        translationHtml: normalizeTranslationHtml(passage.translation_html),
      })),
      questions: (questionsBySet.get(setRow.id) ?? []).sort(
        (a, b) => a.globalItemNumber - b.globalItemNumber,
      ),
    };

    bundle.readingPassageSets.push(loadedSet);
  }

  return {
    bundle,
    publishedAt: publishedAtForGate(
      testRow as {
        published: boolean;
        published_at: string | null;
        listening_published_at: string | null;
        reading_published_at: string | null;
      },
      publishGate === false ? "exam" : publishGate,
    ),
  };
}
