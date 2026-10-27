import type { SupabaseClient } from "@supabase/supabase-js";
import { loadAdminPartEditor } from "@/lib/admin/content/load-part-editor";
import type { ListeningPart3ProcessExportGroup } from "@/lib/content/listening-part3-process-import-schema";
import {
  normalizeImportOptionLabel,
  type ImportOptionLabel,
} from "@/lib/content/resolve-correct-option-label";

function toOptionLabel(label: string): ImportOptionLabel | undefined {
  return normalizeImportOptionLabel(label);
}

export async function buildListeningPart3ProcessExport(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
): Promise<ListeningPart3ProcessExportGroup[]> {
  const editorData = await loadAdminPartEditor(supabase, bookId, testId, 3);
  if (!editorData) {
    return [];
  }

  const questionsByGroupId = new Map<string, typeof editorData.questions>();
  for (const question of editorData.questions) {
    if (!question.listeningGroupId) continue;
    const current = questionsByGroupId.get(question.listeningGroupId) ?? [];
    current.push(question);
    questionsByGroupId.set(question.listeningGroupId, current);
  }

  const entries: ListeningPart3ProcessExportGroup[] = [];

  for (const [, groupQuestions] of questionsByGroupId) {
    const sorted = [...groupQuestions].sort(
      (a, b) => a.globalItemNumber - b.globalItemNumber,
    );
    const anchorQuestion = sorted[0];
    if (!anchorQuestion) continue;

    const transcript = anchorQuestion.groupTranscript?.trim();
    if (!transcript) continue;

    const questions = sorted.flatMap((question) => {
      const options = question.options
        .map((option) => {
          const label = toOptionLabel(option.label);
          if (!label) return null;
          return { label, text: option.text };
        })
        .filter((option): option is { label: ImportOptionLabel; text: string } =>
          option != null,
        );

      if (options.length !== 4) return [];

      return [
        {
          questionId: question.slug,
          globalItemNumber: question.globalItemNumber,
          prompt: question.prompt,
          options,
        },
      ];
    });

    if (questions.length === 0) continue;

    entries.push({
      questionId: anchorQuestion.slug,
      globalItemNumber: anchorQuestion.globalItemNumber,
      transcript,
      questions,
    });
  }

  return entries.sort(
    (a, b) => (a.globalItemNumber ?? 0) - (b.globalItemNumber ?? 0),
  );
}
