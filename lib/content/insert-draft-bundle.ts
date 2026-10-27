import type { SupabaseClient } from "@supabase/supabase-js";
import { importError, importLog } from "@/lib/admin/import/exam-import-log";
import type {
  DraftBundle,
  DraftQuestionRow,
} from "@/lib/content/draft-types";
import { upsertQuestionExplanation } from "@/lib/content/question-explanations-db";
import {
  inferStimulusKindForGroup,
} from "@/lib/content/json-to-draft";

type InsertMaps = {
  groupIdBySlug: Map<string, string>;
  setIdBySlug: Map<string, string>;
  questionIdBySlug: Map<string, string>;
  optionIdBySlug: Map<string, string>;
};

async function insertQuestionRow(
  supabase: SupabaseClient,
  bundle: DraftBundle,
  question: DraftQuestionRow,
  maps: InsertMaps,
): Promise<void> {
  const { data, error } = await supabase
    .from("questions")
    .insert({
      book_id: bundle.bookId,
      test_id: bundle.testId,
      part: String(question.part),
      slug: question.slug,
      global_item_number: question.globalItemNumber,
      prompt: question.prompt,
      hint: question.hint ?? null,
      tags: question.tags ?? [],
      translations: question.translations ?? [],
      vocabulary: question.vocabulary ?? [],
      listening_group_id: question.listeningGroupSlug
        ? maps.groupIdBySlug.get(question.listeningGroupSlug)
        : null,
      reading_passage_set_id: question.readingPassageSetSlug
        ? maps.setIdBySlug.get(question.readingPassageSetSlug)
        : null,
      context_image_asset_id: question.contextImageAssetId ?? null,
      audio_asset_id: question.audioAssetId ?? null,
      stem_audio_asset_id: question.stemAudioAssetId ?? null,
    })
    .select("id, slug")
    .single();

  if (error || !data) {
    throw error ?? new Error(`Failed question ${question.slug}`);
  }
  maps.questionIdBySlug.set(data.slug, data.id);
  await upsertQuestionExplanation(supabase, data.id, question.explanation);

  for (const option of question.options) {
    const { data: optionRow, error: optionError } = await supabase
      .from("answer_options")
      .insert({
        question_id: data.id,
        slug: option.slug,
        label: option.label,
        text: option.text,
        sort_order: option.sortOrder,
        audio_asset_id: option.audioAssetId ?? null,
      })
      .select("id, slug")
      .single();

    if (optionError || !optionRow) {
      throw optionError ?? new Error(`Failed option ${option.slug}`);
    }

    maps.optionIdBySlug.set(optionRow.slug, optionRow.id);
  }

  const correctOptionId = maps.optionIdBySlug.get(question.correctOptionSlug);
  if (correctOptionId) {
    const { error: updateError } = await supabase
      .from("questions")
      .update({ correct_option_id: correctOptionId })
      .eq("id", data.id);

    if (updateError) throw updateError;
  }
}

export async function insertDraftBundle(
  supabase: SupabaseClient,
  bundle: DraftBundle,
) {
  const maps: InsertMaps = {
    groupIdBySlug: new Map<string, string>(),
    setIdBySlug: new Map<string, string>(),
    questionIdBySlug: new Map<string, string>(),
    optionIdBySlug: new Map<string, string>(),
  };

  for (const [index, group] of bundle.listeningGroups.entries()) {
    importLog("listening_group_insert_start", {
      index: index + 1,
      total: bundle.listeningGroups.length,
      slug: group.slug,
      part: group.part,
    });

    const { data, error } = await supabase
      .from("listening_groups")
      .insert({
        book_id: bundle.bookId,
        test_id: bundle.testId,
        part: String(group.part),
        slug: group.slug,
        topic: group.topic ?? null,
        transcript: group.transcript,
        vocabulary: group.vocabulary ?? [],
        format: group.part === 3 ? "dialogue" : "monologue",
        stimulus_kind: inferStimulusKindForGroup(group.part, group.topic ?? undefined),
        audio_asset_id: group.audioAssetId ?? null,
        sort_order: index + 1,
      })
      .select("id, slug")
      .single();

    if (error || !data) throw error ?? new Error(`Failed group ${group.slug}`);
    maps.groupIdBySlug.set(data.slug, data.id);
  }

  const questionsBySetSlug = new Map<string, DraftQuestionRow[]>();
  const standaloneQuestions: DraftQuestionRow[] = [];

  for (const question of bundle.questions) {
    if (question.readingPassageSetSlug) {
      const existing = questionsBySetSlug.get(question.readingPassageSetSlug) ?? [];
      existing.push(question);
      questionsBySetSlug.set(question.readingPassageSetSlug, existing);
      continue;
    }
    standaloneQuestions.push(question);
  }

  for (const [index, set] of bundle.readingPassageSets.entries()) {
    importLog("reading_passage_set_insert_start", {
      index: index + 1,
      total: bundle.readingPassageSets.length,
      slug: set.slug,
      part: set.part,
      topic: set.topic,
      passageCount: set.passages.length,
      questionCount: set.questionSlugs.length,
    });

    try {
      const { data, error } = await supabase
        .from("reading_passage_sets")
        .insert({
          book_id: bundle.bookId,
          test_id: bundle.testId,
          part: String(set.part),
          slug: set.slug,
          topic: set.topic ?? null,
          vocabulary: set.vocabulary ?? [],
          content_model: set.contentModel,
          layout: set.layout,
          sort_order: index + 1,
        })
        .select("id, slug")
        .single();

      if (error || !data) {
        throw error ?? new Error(`Failed set ${set.slug}`);
      }
      maps.setIdBySlug.set(data.slug, data.id);

      for (const [passageIndex, passage] of set.passages.entries()) {
        importLog("reading_passage_insert_start", {
          setSlug: set.slug,
          passageIndex: passageIndex + 1,
          passageSlug: passage.slug,
          title: passage.title,
        });

        const { error: passageError } = await supabase
          .from("reading_passages")
          .insert({
            passage_set_id: data.id,
            slug: passage.slug,
            title: passage.title,
            content: passage.content,
            sort_order: passageIndex + 1,
            translations: passage.translations ?? [],
          });

        if (passageError) throw passageError;
      }

      const setQuestions = questionsBySetSlug.get(set.slug) ?? [];
      for (const [questionIndex, question] of setQuestions.entries()) {
        importLog("reading_passage_set_question_insert_start", {
          setSlug: set.slug,
          questionIndex: questionIndex + 1,
          questionCount: setQuestions.length,
          questionSlug: question.slug,
          globalItemNumber: question.globalItemNumber,
        });
        await insertQuestionRow(supabase, bundle, question, maps);
      }

      importLog("reading_passage_set_insert_done", {
        slug: set.slug,
        questionCount: setQuestions.length,
      });
    } catch (error) {
      importError(
        "reading_passage_set_insert_failed",
        {
          index: index + 1,
          slug: set.slug,
          part: set.part,
          topic: set.topic,
        },
        error,
      );
      throw error;
    }
  }

  for (const question of standaloneQuestions) {
    importLog("reading_standalone_question_insert_start", {
      questionSlug: question.slug,
      part: question.part,
      globalItemNumber: question.globalItemNumber,
    });
    await insertQuestionRow(supabase, bundle, question, maps);
  }

  for (const item of bundle.part1Items) {
    const questionId = maps.questionIdBySlug.get(item.questionSlug);
    if (!questionId) continue;

    const { error } = await supabase.from("listening_part1_items").insert({
      question_id: questionId,
      image_asset_id: item.imageAssetId ?? null,
    });

    if (error) throw error;
  }

  for (const item of bundle.part2Items) {
    const questionId = maps.questionIdBySlug.get(item.questionSlug);
    if (!questionId) continue;

    const { error } = await supabase.from("listening_part2_items").insert({
      question_id: questionId,
      transcript: item.transcript,
      audio_asset_id: item.audioAssetId ?? null,
    });

    if (error) throw error;
  }
}
