"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateAdminExamCatalogPaths } from "@/lib/admin/revalidate-admin-exam-catalog";
import { AdminAccessError, requireAdminSession } from "@/lib/admin/auth/require-admin";
import { linkMediaAssetByStoragePath } from "@/lib/admin/content/link-media-asset-by-path";
import { loadPartQuestionOrder } from "@/lib/admin/content/load-part-editor";
import { republishExamFromDraft } from "@/lib/admin/content/republish-test";
import {
  PublishValidationError,
  unpublishTest,
  validateExamTest,
} from "@/lib/content/publish-test";
import {
  type QuestionExplanation,
} from "@/lib/content/question-explanation";
import { upsertQuestionExplanation } from "@/lib/content/question-explanations-db";
import { copy } from "@/lib/copy/vi";
import { toeicPartGlobalItemRange } from "@/lib/content/toeic-global-item-number";
import { buildListeningPart1ImagePath } from "@/lib/content/listening-image-paths";
import type { OptionLabelDb, ToeicPartDb } from "@/types/content-db";

const REORDER_LOG_PREFIX = "[admin-reorder]";

function logReorderServer(message: string, details?: Record<string, unknown>) {
  if (details) {
    console.info(REORDER_LOG_PREFIX, message, details);
    return;
  }
  console.info(REORDER_LOG_PREFIX, message);
}

function serializeReorderError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (error && typeof error === "object") {
    return { ...(error as Record<string, unknown>) };
  }

  return { value: String(error) };
}

type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function accessError(code: string): string {
  if (code === "not_signed_in") return copy.admin.import.errors.notSignedIn;
  if (code === "not_admin") return copy.admin.import.errors.notAdmin;
  if (code === "reorder_unavailable") return copy.admin.cms.errors.reorderUnavailable;
  return copy.admin.cms.errors.generic;
}

function revalidatePartPaths(
  _bookId: string,
  _testId: string,
  _part: number,
) {
  revalidateAdminExamCatalogPaths();
}

function revalidateAdminPartEditorPaths(
  bookId: string,
  testId: string,
  part: number,
) {
  revalidatePartPaths(bookId, testId, part);
}

function revalidateAdminTestPaths(_bookId: string, _testId: string) {
  revalidateAdminExamCatalogPaths();
}

const OPTION_LABELS: OptionLabelDb[] = ["A", "B", "C", "D"];

function nextOptionLabel(existing: OptionLabelDb[]): OptionLabelDb | null {
  for (const label of OPTION_LABELS) {
    if (!existing.includes(label)) return label;
  }
  return null;
}

export async function updateAdminQuestion(
  bookId: string,
  testId: string,
  part: number,
  questionId: string,
  fields: { slug?: string; prompt?: string; globalItemNumber?: number; transcript?: string },
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminSession();
    const partDb = String(part) as ToeicPartDb;

    const updates: Record<string, unknown> = {};
    if (fields.slug !== undefined) updates.slug = fields.slug.trim();
    if (fields.prompt !== undefined) updates.prompt = fields.prompt;
    if (fields.globalItemNumber !== undefined) {
      updates.global_item_number = fields.globalItemNumber;
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from("questions")
        .update(updates)
        .eq("id", questionId)
        .eq("book_id", bookId)
        .eq("test_id", testId)
        .eq("part", partDb);

      if (error) throw error;
    }

    if (part === 2 && fields.transcript !== undefined) {
      const { error } = await supabase.from("listening_part2_items").upsert(
        {
          question_id: questionId,
          transcript: fields.transcript,
        },
        { onConflict: "question_id" },
      );
      if (error) throw error;
    }

    revalidatePartPaths(bookId, testId, part);
    return { ok: true };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : accessError("generic"),
    };
  }
}

export async function updateAdminOption(
  bookId: string,
  testId: string,
  part: number,
  optionId: string,
  fields: { slug?: string; text?: string; label?: OptionLabelDb },
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminSession();
    const updates: Record<string, unknown> = {};
    if (fields.slug !== undefined) updates.slug = fields.slug.trim();
    if (fields.text !== undefined) updates.text = fields.text;
    if (fields.label !== undefined) updates.label = fields.label;

    if (Object.keys(updates).length === 0) return { ok: true };

    const { error } = await supabase
      .from("answer_options")
      .update(updates)
      .eq("id", optionId);

    if (error) throw error;

    revalidatePartPaths(bookId, testId, part);
    return { ok: true };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : accessError("generic"),
    };
  }
}

export interface SaveAdminQuestionRowPayload {
  globalItemNumber: number;
  prompt: string;
  transcript?: string;
  hint?: string | null;
  explanation?: QuestionExplanation | null;
  freeExplanation?: boolean;
  tags?: string[];
  translations?: Array<{ english: string; vietnamese: string }>;
  correctOptionId: string | null;
  /** Listening: whole Q+A path (P1 question, P2 part2 item). */
  wholeAudioStoragePath?: string | null;
  /** Listening: question-only stem path. */
  questionAudioStoragePath?: string | null;
  options: Array<{
    id: string;
    text: string;
    audioStoragePath?: string | null;
  }>;
}

export async function saveAdminQuestionRow(
  bookId: string,
  testId: string,
  part: number,
  questionId: string,
  payload: SaveAdminQuestionRowPayload,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminSession();
    const partDb = String(part) as ToeicPartDb;

    const questionUpdates: Record<string, unknown> = {
      global_item_number: payload.globalItemNumber,
      correct_option_id: payload.correctOptionId,
    };

    questionUpdates.prompt = part === 1 ? "" : payload.prompt;

    if (payload.hint !== undefined) {
      questionUpdates.hint = payload.hint?.trim() ? payload.hint.trim() : null;
    }
    if (payload.freeExplanation !== undefined) {
      questionUpdates.free_explanation = Boolean(payload.freeExplanation);
    }
    if (payload.tags !== undefined) {
      questionUpdates.tags = payload.tags;
    }
    if (
      payload.translations !== undefined &&
      (part === 1 ||
        part === 2 ||
        part === 3 ||
        part === 4 ||
        part === 6 ||
        part === 7)
    ) {
      questionUpdates.translations = payload.translations;
    }

    const isListeningPart = part >= 1 && part <= 4;

    if (isListeningPart && payload.questionAudioStoragePath !== undefined) {
      if (part === 1) {
        questionUpdates.stem_audio_asset_id = await linkMediaAssetByStoragePath(
          supabase,
          bookId,
          testId,
          "audio",
          payload.questionAudioStoragePath,
        );
      } else {
        questionUpdates.audio_asset_id = await linkMediaAssetByStoragePath(
          supabase,
          bookId,
          testId,
          "audio",
          payload.questionAudioStoragePath,
        );
      }
    }

    if (isListeningPart && part === 1 && payload.wholeAudioStoragePath !== undefined) {
      questionUpdates.audio_asset_id = await linkMediaAssetByStoragePath(
        supabase,
        bookId,
        testId,
        "audio",
        payload.wholeAudioStoragePath,
      );
    }

    if (part === 1) {
      const imagePath = buildListeningPart1ImagePath(
        bookId,
        testId,
        payload.globalItemNumber,
      );
      const imageAssetId = await linkMediaAssetByStoragePath(
        supabase,
        bookId,
        testId,
        "image",
        imagePath,
      );
      const { error: part1Error } = await supabase
        .from("listening_part1_items")
        .upsert(
          { question_id: questionId, image_asset_id: imageAssetId },
          { onConflict: "question_id" },
        );
      if (part1Error) throw part1Error;
    }

    const { error: questionError } = await supabase
      .from("questions")
      .update(questionUpdates)
      .eq("id", questionId)
      .eq("book_id", bookId)
      .eq("test_id", testId)
      .eq("part", partDb);

    if (questionError) throw questionError;

    if (payload.explanation !== undefined) {
      await upsertQuestionExplanation(
        supabase,
        questionId,
        payload.explanation,
      );
    }

    if (
      part === 2 &&
      (payload.transcript !== undefined || payload.wholeAudioStoragePath !== undefined)
    ) {
      const part2Updates: Record<string, unknown> = {
        question_id: questionId,
      };
      if (payload.transcript !== undefined) {
        part2Updates.transcript = payload.transcript;
      }
      if (payload.wholeAudioStoragePath !== undefined) {
        part2Updates.audio_asset_id = await linkMediaAssetByStoragePath(
          supabase,
          bookId,
          testId,
          "audio",
          payload.wholeAudioStoragePath,
        );
      }
      const { error } = await supabase
        .from("listening_part2_items")
        .upsert(part2Updates, { onConflict: "question_id" });
      if (error) throw error;
    }

    for (const option of payload.options) {
      const optionUpdates: Record<string, unknown> = { text: option.text };
      if (isListeningPart && option.audioStoragePath !== undefined) {
        optionUpdates.audio_asset_id = await linkMediaAssetByStoragePath(
          supabase,
          bookId,
          testId,
          "audio",
          option.audioStoragePath,
        );
      }
      const { error: optionError } = await supabase
        .from("answer_options")
        .update(optionUpdates)
        .eq("id", option.id);

      if (optionError) throw optionError;
    }

    revalidatePartPaths(bookId, testId, part);
    return { ok: true };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : accessError("generic"),
    };
  }
}

export interface SaveAdminPassageSetPayload {
  topic?: string | null;
  freeExplanation?: boolean;
  passages: Array<{
    id: string;
    title: string;
    content: string;
    translations?: Array<{ english: string; vietnamese: string }>;
    translationHtml?: string;
  }>;
  /** Part 6 anchor-question translations (flat list for the passage set). */
  translations: Array<{ english: string; vietnamese: string }>;
  /** Part 6 HTML passage translation on the anchor question. */
  translationHtml?: string;
}

export async function saveAdminPassageSet(
  bookId: string,
  testId: string,
  part: number,
  setId: string,
  payload: SaveAdminPassageSetPayload,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminSession();
    const partDb = String(part) as ToeicPartDb;

    if (part !== 6 && part !== 7) {
      return { ok: false, error: copy.admin.cms.errors.generic };
    }

    const topicValue = payload.topic?.trim() ? payload.topic.trim() : null;
    const setUpdates: Record<string, unknown> = { topic: topicValue };
    if (payload.freeExplanation !== undefined) {
      setUpdates.free_explanation = Boolean(payload.freeExplanation);
    }
    const { error: topicError } = await supabase
      .from("reading_passage_sets")
      .update(setUpdates)
      .eq("id", setId);

    if (topicError) throw topicError;

    for (const passage of payload.passages) {
      const passageUpdate: {
        title: string;
        content: string;
        translations?: Array<{ english: string; vietnamese: string }>;
        translation_html?: string | null;
      } = {
        title: passage.title.trim(),
        content: passage.content,
      };

      if (part === 7 && passage.translations) {
        passageUpdate.translations = passage.translations.filter(
          (row) => row.english.trim() || row.vietnamese.trim(),
        );
      }

      if (part === 7) {
        const html = passage.translationHtml?.trim();
        passageUpdate.translation_html = html ? html : null;
      }

      const { error } = await supabase
        .from("reading_passages")
        .update(passageUpdate)
        .eq("id", passage.id);

      if (error) throw error;
    }

    if (part === 6) {
      const { data: setQuestions, error: listError } = await supabase
        .from("questions")
        .select("id, global_item_number")
        .eq("book_id", bookId)
        .eq("test_id", testId)
        .eq("part", partDb)
        .eq("reading_passage_set_id", setId)
        .order("global_item_number", { ascending: true });

      if (listError) throw listError;

      const firstQuestionId = setQuestions?.[0]?.id;
      if (firstQuestionId) {
        const translationHtml = payload.translationHtml?.trim();
        const { error: translationError } = await supabase
          .from("questions")
          .update({
            translations: payload.translations.filter(
              (row) => row.english.trim() || row.vietnamese.trim(),
            ),
            translation_html: translationHtml ? translationHtml : null,
          })
          .eq("id", firstQuestionId);

        if (translationError) throw translationError;
      }
    }

    revalidatePartPaths(bookId, testId, part);
    return { ok: true };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : accessError("generic"),
    };
  }
}

export async function setAdminCorrectOption(
  bookId: string,
  testId: string,
  part: number,
  questionId: string,
  optionId: string,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminSession();

    const { error } = await supabase
      .from("questions")
      .update({ correct_option_id: optionId })
      .eq("id", questionId)
      .eq("book_id", bookId)
      .eq("test_id", testId);

    if (error) throw error;

    revalidatePartPaths(bookId, testId, part);
    return { ok: true };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : accessError("generic"),
    };
  }
}

export interface SaveAdminListeningGroupPayload {
  transcript: string;
  groupTopic?: string | null;
  freeExplanation?: boolean;
  groupAudioStoragePath?: string | null;
  anchorTranslations?: Array<{ english: string; vietnamese: string }>;
  questions: Array<{
    questionId: string;
    globalItemNumber: number;
    prompt: string;
    correctOptionId: string | null;
    questionAudioStoragePath?: string | null;
    options: SaveAdminQuestionRowPayload["options"];
    hint?: string | null;
    explanation?: QuestionExplanation | null;
    tags?: string[];
  }>;
}

export async function saveAdminListeningGroup(
  bookId: string,
  testId: string,
  part: number,
  groupId: string,
  payload: SaveAdminListeningGroupPayload,
): Promise<ActionResult> {
  if (part !== 3 && part !== 4) {
    return { ok: false, error: copy.admin.cms.errors.generic };
  }

  try {
    const { supabase } = await requireAdminSession();

    const groupUpdates: Record<string, unknown> = {
      transcript: payload.transcript,
    };
    if (payload.groupTopic !== undefined) {
      groupUpdates.topic = payload.groupTopic?.trim()
        ? payload.groupTopic.trim()
        : null;
    }
    if (payload.freeExplanation !== undefined) {
      groupUpdates.free_explanation = Boolean(payload.freeExplanation);
    }
    if (payload.groupAudioStoragePath !== undefined) {
      groupUpdates.audio_asset_id = await linkMediaAssetByStoragePath(
        supabase,
        bookId,
        testId,
        "audio",
        payload.groupAudioStoragePath,
      );
    }

    const { error: groupError } = await supabase
      .from("listening_groups")
      .update(groupUpdates)
      .eq("id", groupId)
      .eq("book_id", bookId)
      .eq("test_id", testId);

    if (groupError) throw groupError;

    for (const [index, question] of payload.questions.entries()) {
      const result = await saveAdminQuestionRow(
        bookId,
        testId,
        part,
        question.questionId,
        {
          globalItemNumber: question.globalItemNumber,
          prompt: question.prompt,
          correctOptionId: question.correctOptionId,
          questionAudioStoragePath: question.questionAudioStoragePath,
          options: question.options,
          hint: question.hint,
          explanation: question.explanation,
          tags: question.tags,
          ...(index === 0 && payload.anchorTranslations !== undefined
            ? { translations: payload.anchorTranslations }
            : {}),
        },
      );
      if (!result.ok) return result;
    }

    revalidatePartPaths(bookId, testId, part);
    return { ok: true };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : accessError("generic"),
    };
  }
}

function isMissingReorderRpcError(error: { code?: string; message?: string }): boolean {
  if (error.code === "42883" || error.code === "PGRST202") {
    return true;
  }

  const message = error.message?.toLowerCase() ?? "";
  return (
    message.includes("could not find the function") &&
    message.includes("reorder_part_questions")
  );
}

async function findTempGlobalItemNumbers(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  count: number,
): Promise<number[]> {
  const { data: allQuestions, error } = await supabase
    .from("questions")
    .select("id, global_item_number")
    .eq("book_id", bookId)
    .eq("test_id", testId);

  if (error) throw error;

  const occupiedGlobals = new Set(
    (allQuestions ?? []).map((question) => question.global_item_number),
  );
  const tempGlobals: number[] = [];

  for (let globalItemNumber = 200; globalItemNumber >= 1; globalItemNumber--) {
    if (occupiedGlobals.has(globalItemNumber)) {
      continue;
    }
    tempGlobals.push(globalItemNumber);
    if (tempGlobals.length === count) {
      break;
    }
  }

  tempGlobals.reverse();

  if (tempGlobals.length < count) {
    throw new AdminAccessError("reorder_unavailable");
  }

  return tempGlobals;
}

async function reorderQuestionsWithTempGlobals(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  part: number,
  partDb: ToeicPartDb,
  orderedQuestionIds: string[],
): Promise<void> {
  const range = toeicPartGlobalItemRange(part);
  const targetGlobals = orderedQuestionIds.map(
    (_, index) => range.first + index,
  );
  const tempGlobals = await findTempGlobalItemNumbers(
    supabase,
    bookId,
    testId,
    orderedQuestionIds.length,
  );

  for (const [index, questionId] of orderedQuestionIds.entries()) {
    const { error: tempGlobalError } = await supabase
      .from("questions")
      .update({ global_item_number: tempGlobals[index] })
      .eq("id", questionId)
      .eq("book_id", bookId)
      .eq("test_id", testId)
      .eq("part", partDb);

    if (tempGlobalError) throw tempGlobalError;
  }

  for (const [index, questionId] of orderedQuestionIds.entries()) {
    const { error: finalError } = await supabase
      .from("questions")
      .update({
        global_item_number: targetGlobals[index],
      })
      .eq("id", questionId)
      .eq("book_id", bookId)
      .eq("test_id", testId)
      .eq("part", partDb);

    if (finalError) throw finalError;
  }
}

async function swapTwoAdminQuestions(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  part: number,
  partDb: ToeicPartDb,
  sourceQuestionId: string,
  targetQuestionId: string,
): Promise<void> {
  const questions = await loadPartQuestionOrder(supabase, bookId, testId, part);
  const source = questions.find((question) => question.id === sourceQuestionId);
  const target = questions.find((question) => question.id === targetQuestionId);

  if (!source || !target) {
    throw new AdminAccessError("not_found");
  }

  if (source.id === target.id) {
    return;
  }

  const sourceGlobal = source.globalItemNumber;
  const targetGlobal = target.globalItemNumber;
  const [tempGlobal] = await findTempGlobalItemNumbers(supabase, bookId, testId, 1);

  logReorderServer("swapTwoAdminQuestions", {
    sourceQuestionId,
    targetQuestionId,
    sourceGlobalItemNumber: source.globalItemNumber,
    targetGlobalItemNumber: target.globalItemNumber,
    sourceGlobal,
    targetGlobal,
    tempGlobal,
  });

  const { error: sourceTempError } = await supabase
    .from("questions")
    .update({
      global_item_number: tempGlobal,
    })
    .eq("id", source.id)
    .eq("book_id", bookId)
    .eq("test_id", testId)
    .eq("part", partDb);

  if (sourceTempError) throw sourceTempError;

  const { error: targetError } = await supabase
    .from("questions")
    .update({
      global_item_number: sourceGlobal,
    })
    .eq("id", target.id)
    .eq("book_id", bookId)
    .eq("test_id", testId)
    .eq("part", partDb);

  if (targetError) throw targetError;

  const { error: sourceFinalError } = await supabase
    .from("questions")
    .update({
      global_item_number: targetGlobal,
    })
    .eq("id", source.id)
    .eq("book_id", bookId)
    .eq("test_id", testId)
    .eq("part", partDb);

  if (sourceFinalError) throw sourceFinalError;
}

export async function swapAdminQuestions(
  bookId: string,
  testId: string,
  part: number,
  sourceQuestionId: string,
  targetQuestionId: string,
): Promise<ActionResult> {
  logReorderServer("swapAdminQuestions:start", {
    bookId,
    testId,
    part,
    sourceQuestionId,
    targetQuestionId,
  });

  try {
    const { supabase } = await requireAdminSession();
    const partDb = String(part) as ToeicPartDb;

    await swapTwoAdminQuestions(
      supabase,
      bookId,
      testId,
      part,
      partDb,
      sourceQuestionId,
      targetQuestionId,
    );

    revalidateAdminPartEditorPaths(bookId, testId, part);
    logReorderServer("swapAdminQuestions:success");
    return { ok: true };
  } catch (error) {
    logReorderServer("swapAdminQuestions:catch", serializeReorderError(error));
    if (error instanceof AdminAccessError) {
      if (error.message === "not_found") {
        return { ok: false, error: copy.admin.cms.errors.notFound };
      }
      return { ok: false, error: accessError(error.message) };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : accessError("generic"),
    };
  }
}

export async function reorderAdminQuestions(
  bookId: string,
  testId: string,
  part: number,
  orderedQuestionIds: string[],
): Promise<ActionResult> {
  logReorderServer("reorderAdminQuestions:start", {
    bookId,
    testId,
    part,
    orderedCount: orderedQuestionIds.length,
    orderedQuestionIds,
  });

  try {
    const { supabase } = await requireAdminSession();
    const partDb = String(part) as ToeicPartDb;

    const questions = await loadPartQuestionOrder(supabase, bookId, testId, part);
    logReorderServer("reorderAdminQuestions:loaded", {
      dbCount: questions.length,
      dbQuestionIds: questions.map((question) => question.id),
      dbNumbers: questions.map((question) => question.globalItemNumber),
    });

    const existingIds = new Set(questions.map((q) => q.id));
    if (
      orderedQuestionIds.length !== questions.length ||
      !orderedQuestionIds.every((id) => existingIds.has(id))
    ) {
      const missingIds = orderedQuestionIds.filter((id) => !existingIds.has(id));
      const extraIds = questions
        .map((question) => question.id)
        .filter((id) => !orderedQuestionIds.includes(id));
      logReorderServer("reorderAdminQuestions:validationFailed", {
        orderedCount: orderedQuestionIds.length,
        dbCount: questions.length,
        missingIds,
        extraIds,
      });
      return { ok: false, error: copy.admin.cms.errors.notFound };
    }

    const currentOrder = questions.map((q) => q.id).join(",");
    const nextOrder = orderedQuestionIds.join(",");
    if (currentOrder === nextOrder) {
      logReorderServer("reorderAdminQuestions:noop", { currentOrder });
      return { ok: true };
    }

    logReorderServer("reorderAdminQuestions:rpcCall", {
      currentOrder,
      nextOrder,
    });

    const { error: rpcError } = await supabase.rpc("reorder_part_questions", {
      p_book_id: bookId,
      p_test_id: testId,
      p_part: partDb,
      p_ordered_question_ids: orderedQuestionIds,
    });

    if (rpcError) {
      logReorderServer("reorderAdminQuestions:rpcError", {
        code: rpcError.code,
        message: rpcError.message,
        details: rpcError.details,
        hint: rpcError.hint,
        isMissingRpc: isMissingReorderRpcError(rpcError),
      });

      if (!isMissingReorderRpcError(rpcError)) {
        throw rpcError;
      }

      logReorderServer("reorderAdminQuestions:fallbackTempGlobals");
      await reorderQuestionsWithTempGlobals(
        supabase,
        bookId,
        testId,
        part,
        partDb,
        orderedQuestionIds,
      );
    } else {
      logReorderServer("reorderAdminQuestions:rpcSuccess");
    }

    revalidateAdminPartEditorPaths(bookId, testId, part);
    logReorderServer("reorderAdminQuestions:success");
    return { ok: true };
  } catch (error) {
    logReorderServer("reorderAdminQuestions:catch", serializeReorderError(error));
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : accessError("generic"),
    };
  }
}

export async function reorderAdminQuestion(
  bookId: string,
  testId: string,
  part: number,
  questionId: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminSession();
    const partDb = String(part) as ToeicPartDb;

    const questions = await loadPartQuestionOrder(supabase, bookId, testId, part);

    const index = questions.findIndex((q) => q.id === questionId);
    if (index === -1) return { ok: false, error: copy.admin.cms.errors.notFound };

    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= questions.length) {
      return { ok: true };
    }

    await swapTwoAdminQuestions(
      supabase,
      bookId,
      testId,
      part,
      partDb,
      questions[index].id,
      questions[swapIndex].id,
    );

    revalidateAdminPartEditorPaths(bookId, testId, part);
    return { ok: true };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : accessError("generic"),
    };
  }
}

export async function addAdminOption(
  bookId: string,
  testId: string,
  part: number,
  questionId: string,
): Promise<ActionResult<{ optionId: string }>> {
  try {
    const { supabase } = await requireAdminSession();

    const { data: existing, error: listError } = await supabase
      .from("answer_options")
      .select("label, sort_order")
      .eq("question_id", questionId)
      .order("sort_order", { ascending: true });

    if (listError) throw listError;

    const labels = (existing ?? []).map((row) => row.label as OptionLabelDb);
    const label = nextOptionLabel(labels);
    if (!label) {
      return { ok: false, error: copy.admin.cms.errors.maxOptions };
    }

    const maxSort = (existing ?? []).reduce(
      (max, row) => Math.max(max, Number(row.sort_order)),
      0,
    );
    const question = await supabase
      .from("questions")
      .select("slug")
      .eq("id", questionId)
      .maybeSingle();

    if (question.error || !question.data) {
      return { ok: false, error: copy.admin.cms.errors.notFound };
    }

    const slug = `${question.data.slug}-${label.toLowerCase()}`;

    const { data, error } = await supabase
      .from("answer_options")
      .insert({
        question_id: questionId,
        slug,
        label,
        text: "",
        sort_order: maxSort + 1,
      })
      .select("id")
      .single();

    if (error || !data) throw error ?? new Error("Failed to create option");

    revalidatePartPaths(bookId, testId, part);
    return { ok: true, data: { optionId: String(data.id) } };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : accessError("generic"),
    };
  }
}

export async function deleteAdminOption(
  bookId: string,
  testId: string,
  part: number,
  questionId: string,
  optionId: string,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminSession();

    const { data: question, error: questionError } = await supabase
      .from("questions")
      .select("correct_option_id")
      .eq("id", questionId)
      .maybeSingle();

    if (questionError) throw questionError;

    const { error } = await supabase
      .from("answer_options")
      .delete()
      .eq("id", optionId);

    if (error) throw error;

    if (question?.correct_option_id === optionId) {
      await supabase
        .from("questions")
        .update({ correct_option_id: null })
        .eq("id", questionId);
    }

    revalidatePartPaths(bookId, testId, part);
    return { ok: true };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : accessError("generic"),
    };
  }
}

export async function addAdminQuestion(
  bookId: string,
  testId: string,
  part: number,
): Promise<ActionResult<{ questionId: string }>> {
  try {
    const { supabase } = await requireAdminSession();
    const partDb = String(part) as ToeicPartDb;
    const partNum = part;

    const { data: maxRow, error: maxError } = await supabase
      .from("questions")
      .select("global_item_number")
      .eq("book_id", bookId)
      .eq("test_id", testId)
      .eq("part", partDb)
      .order("global_item_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (maxError) throw maxError;

    const range = toeicPartGlobalItemRange(partNum);
    const globalItemNumber = maxRow?.global_item_number
      ? Number(maxRow.global_item_number) + 1
      : range.first;
    if (globalItemNumber > range.last) {
      return { ok: false, error: copy.admin.cms.errors.generic };
    }

    const slug = `${testId}-p${part}-q${String(globalItemNumber).padStart(3, "0")}`;

    const { data: questionRow, error: insertError } = await supabase
      .from("questions")
      .insert({
        book_id: bookId,
        test_id: testId,
        part: partDb,
        slug,
        global_item_number: globalItemNumber,
        prompt: "",
      })
      .select("id")
      .single();

    if (insertError || !questionRow) throw insertError ?? new Error("Failed to create question");
    const newQuestionId = String(questionRow.id);

    const optionCount = partNum === 2 ? 3 : 4;
    const labels = partNum === 2 ? (["A", "B", "C"] as const) : (["A", "B", "C", "D"] as const);

    for (const [index, label] of labels.entries()) {
      const { error: optionError } = await supabase.from("answer_options").insert({
        question_id: newQuestionId,
        slug: `${slug}-${label.toLowerCase()}`,
        label,
        text: "",
        sort_order: index + 1,
      });
      if (optionError) throw optionError;
    }

    if (partNum === 1) {
      await supabase.from("listening_part1_items").insert({
        question_id: newQuestionId,
      });
    }

    if (partNum === 2) {
      await supabase.from("listening_part2_items").insert({
        question_id: newQuestionId,
        transcript: "",
      });
    }

    const { data: firstOption } = await supabase
      .from("answer_options")
      .select("id")
      .eq("question_id", newQuestionId)
      .eq("label", "A")
      .maybeSingle();

    if (firstOption) {
      await supabase
        .from("questions")
        .update({ correct_option_id: firstOption.id })
        .eq("id", newQuestionId);
    }

    revalidatePartPaths(bookId, testId, part);
    return { ok: true, data: { questionId: newQuestionId } };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : accessError("generic"),
    };
  }
}

export async function deleteAdminQuestion(
  bookId: string,
  testId: string,
  part: number,
  questionId: string,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminSession();

    const { error } = await supabase
      .from("questions")
      .delete()
      .eq("id", questionId)
      .eq("book_id", bookId)
      .eq("test_id", testId);

    if (error) throw error;

    revalidatePartPaths(bookId, testId, part);
    return { ok: true };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : accessError("generic"),
    };
  }
}

export async function validateAdminExamTest(
  bookId: string,
  testId: string,
): Promise<
  ActionResult<{
    valid: boolean;
    issues: Array<{ code: string; message: string }>;
  }>
> {
  try {
    const { supabase } = await requireAdminSession();
    const validation = await validateExamTest(supabase, { bookId, testId });
    return { ok: true, data: validation };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : accessError("generic"),
    };
  }
}

export async function publishAdminExam(
  bookId: string,
  testId: string,
): Promise<
  | { ok: true; data: { publishedAt: string } }
  | {
      ok: false;
      error: string;
      issues?: Array<{ code: string; message: string }>;
    }
> {
  try {
    const { supabase } = await requireAdminSession();
    const publishedAt = await republishExamFromDraft(supabase, bookId, testId);
    revalidateAdminTestPaths(bookId, testId);
    return { ok: true, data: { publishedAt } };
  } catch (error) {
    if (error instanceof PublishValidationError) {
      return {
        ok: false,
        error: error.message,
        issues: error.validation.issues,
      };
    }
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : accessError("generic"),
    };
  }
}

export async function unpublishAdminExam(
  bookId: string,
  testId: string,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminSession();
    await unpublishTest(supabase, { bookId, testId });
    revalidateAdminTestPaths(bookId, testId);
    return { ok: true };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : accessError("generic"),
    };
  }
}
