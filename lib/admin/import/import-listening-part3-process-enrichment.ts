import type { SupabaseClient } from "@supabase/supabase-js";
import type { PassageTranslationQuestionIndex } from "@/lib/admin/import/passage-translation-question-index";
import { resolveQuestionIdFromIndex } from "@/lib/admin/import/passage-translation-question-index";
import type {
  ListeningPart3ProcessImportGroup,
  ListeningPart3ProcessImportQuestion,
} from "@/lib/content/listening-part3-process-import-schema";
import { copy } from "@/lib/copy/vi";
import { parseQuestionExplanation } from "@/lib/content/question-explanation";
import { upsertQuestionExplanation } from "@/lib/content/question-explanations-db";
import {
  normalizeImportOptionLabel,
  type ImportOptionLabel,
} from "@/lib/content/resolve-correct-option-label";

function flattenProcessQuestionTags(
  question: ListeningPart3ProcessImportQuestion,
): string[] {
  const tags: string[] = [];

  if (question.topic?.trim()) {
    tags.push(question.topic.trim());
  }

  for (const skill of question.skills ?? []) {
    if (skill.trim()) {
      tags.push(skill.trim());
    }
  }

  if (question.focus?.trim()) {
    tags.push(question.focus.trim());
  }

  return tags;
}

async function resolveCorrectOptionId(
  supabase: SupabaseClient,
  questionDbId: string,
  label: ImportOptionLabel,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("answer_options")
    .select("id, label")
    .eq("question_id", questionDbId);

  if (error) throw error;

  const match = (data ?? []).find(
    (option) => normalizeImportOptionLabel(option.label) === label,
  );

  return match?.id ?? null;
}

function resolveListeningGroupId(
  questionIndex: PassageTranslationQuestionIndex,
  questionId: string,
): string | null {
  const resolved = resolveQuestionIdFromIndex(questionIndex, questionId);
  if (!resolved) return null;
  const row = questionIndex.rows.find((entry) => entry.id === resolved.dbId);
  return row?.listeningGroupId ?? null;
}

export async function importListeningPart3ProcessEnrichment(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  entries: ListeningPart3ProcessImportGroup[],
  questionIndex: PassageTranslationQuestionIndex,
): Promise<{
  questionsUpdated: number;
  groupsTopicUpdated: number;
  notFoundQuestionIds: string[];
}> {
  const notFoundQuestionIds: string[] = [];
  let questionsUpdated = 0;
  let groupsTopicUpdated = 0;

  for (const entry of entries) {
    if (!entry.questions || entry.questions.length === 0) {
      throw new Error(
        copy.admin.exams.create.listeningPart3ProcessMissingGroup(
          entry.questionId,
        ),
      );
    }

    const listeningGroupId = resolveListeningGroupId(
      questionIndex,
      entry.questionId,
    );

    if (listeningGroupId && entry.topic?.trim()) {
      const { error: topicError } = await supabase
        .from("listening_groups")
        .update({
          topic: entry.topic.trim(),
          ...(entry.vocabulary && entry.vocabulary.length > 0
            ? { vocabulary: entry.vocabulary }
            : {}),
        })
        .eq("id", listeningGroupId);

      if (topicError) throw topicError;
      groupsTopicUpdated += 1;
    } else if (
      listeningGroupId &&
      entry.vocabulary &&
      entry.vocabulary.length > 0
    ) {
      const { error: vocabError } = await supabase
        .from("listening_groups")
        .update({ vocabulary: entry.vocabulary })
        .eq("id", listeningGroupId);

      if (vocabError) throw vocabError;
    }

    for (const question of entry.questions) {
      const resolved = resolveQuestionIdFromIndex(
        questionIndex,
        question.questionId,
      );
      if (!resolved) {
        throw new Error(
          copy.admin.exams.create.listeningPart3ProcessMissingQuestion(
            question.questionId,
          ),
        );
      }

      const correctLabel = normalizeImportOptionLabel(
        question.correctOptionLabel,
      );
      if (!correctLabel) {
        throw new Error(
          copy.admin.exams.create.listeningPart3ProcessMissingAnswer(
            question.questionId,
          ),
        );
      }

      const correctOptionId = await resolveCorrectOptionId(
        supabase,
        resolved.dbId,
        correctLabel,
      );

      const explanation = parseQuestionExplanation(question.explanation);
      if (!explanation) {
        throw new Error(
          copy.admin.exams.create.listeningPart3ProcessMissingExplanation(
            question.questionId,
          ),
        );
      }

      const { error: updateError } = await supabase
        .from("questions")
        .update({
          correct_option_id: correctOptionId,
          hint: question.hint.trim(),
          tags: flattenProcessQuestionTags(question),
        })
        .eq("id", resolved.dbId)
        .eq("book_id", bookId)
        .eq("test_id", testId);

      if (updateError) throw updateError;

      await upsertQuestionExplanation(supabase, resolved.dbId, explanation);

      questionsUpdated += 1;
    }
  }

  return {
    questionsUpdated,
    groupsTopicUpdated,
    notFoundQuestionIds,
  };
}
