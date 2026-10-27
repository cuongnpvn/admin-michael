import type { SupabaseClient } from "@supabase/supabase-js";
import { loadAdminPartEditor } from "@/lib/admin/content/load-part-editor";
import type { PassageTranslationExportEntry } from "@/lib/content/passage-translation-import-schema";
import {
	buildClozeAnswersForPassageContent,
	type PassageClozeAnswerSource,
} from "@/lib/reading/passage-cloze-review";
import { fillClozeMarkers } from "@/lib/reading/passage-cloze-markers";

function toPassageClozeAnswerSources(
	setQuestions: Array<{
		globalItemNumber: number;
		correctOptionId: string | null;
		options: Array<{ id: string; text: string }>;
	}>,
): PassageClozeAnswerSource[] {
	return setQuestions.flatMap((question) => {
		if (!question.correctOptionId) {
			return [];
		}

		return [
			{
				globalItemNumber: question.globalItemNumber,
				correctOptionId: question.correctOptionId,
				options: question.options,
			},
		];
	});
}

export async function buildPassageTranslationExport(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  part: 6 | 7,
): Promise<PassageTranslationExportEntry[]> {
  const editorData = await loadAdminPartEditor(supabase, bookId, testId, part);
  if (!editorData) {
    return [];
  }
  const questionById = new Map(
    editorData.questions.map((question) => [question.id, question]),
  );

  return editorData.passageSets.map((set) => {
    const setQuestions = set.questionIds
      .map((id) => questionById.get(id))
      .filter((question): question is NonNullable<typeof question> => question != null)
      .sort((a, b) => a.globalItemNumber - b.globalItemNumber);

    const anchorQuestion = setQuestions[0];
    if (!anchorQuestion) {
      throw new Error(`Passage set ${set.id} has no questions`);
    }

    const passages =
      part === 7
        ? set.passages.map((passage) => ({
            passageSlug: passage.slug,
            title: passage.title,
            content: passage.content,
          }))
        : set.passages.map((passage) => ({
            title: passage.title,
            content: passage.content,
          }));

    const entry: PassageTranslationExportEntry = {
      questionId: anchorQuestion.slug,
      globalItemNumber: anchorQuestion.globalItemNumber,
      passages,
    };

    if (part === 7) {
      entry.questions = setQuestions.map((question) => ({
        questionId: question.slug,
        globalItemNumber: question.globalItemNumber,
        prompt: question.prompt,
        options: question.options.map((option) => ({
          label: option.label,
          text: option.text,
        })),
      }));
    }

    if (part === 6) {
      const combinedContent = passages.map((passage) => passage.content).join("\n");
      const clozeSources = toPassageClozeAnswerSources(setQuestions);
      const answersByNumber = buildClozeAnswersForPassageContent(
        combinedContent,
        clozeSources,
      );

      if (answersByNumber.size > 0) {
        entry.clozeAnswers = [...answersByNumber.entries()]
          .map(([globalItemNumber, answer]) => ({ globalItemNumber, answer }))
          .sort((left, right) => left.globalItemNumber - right.globalItemNumber);
        entry.filledPassages = passages.map((passage) => ({
          title: passage.title,
          content: fillClozeMarkers(passage.content, answersByNumber),
        }));
      }
    }

    return entry;
  });
}
