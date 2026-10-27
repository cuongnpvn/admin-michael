import type { SupabaseClient } from "@supabase/supabase-js";
import { loadAdminPartEditor } from "@/lib/admin/content/load-part-editor";
import type { ListeningTranscriptTranslationExportEntry } from "@/lib/content/listening-transcript-translation-import-schema";

export async function buildListeningTranslationExport(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  part: 3 | 4,
): Promise<ListeningTranscriptTranslationExportEntry[]> {
  const editorData = await loadAdminPartEditor(supabase, bookId, testId, part);
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

  const entries: ListeningTranscriptTranslationExportEntry[] = [];

  for (const [, groupQuestions] of questionsByGroupId) {
    const sorted = [...groupQuestions].sort(
      (a, b) => a.globalItemNumber - b.globalItemNumber,
    );
    const anchorQuestion = sorted[0];
    if (!anchorQuestion) continue;

    const transcript = anchorQuestion.groupTranscript?.trim();
    if (!transcript) continue;

    entries.push({
      questionId: anchorQuestion.slug,
      globalItemNumber: anchorQuestion.globalItemNumber,
      transcript,
    });
  }

  return entries.sort(
    (a, b) => (a.globalItemNumber ?? 0) - (b.globalItemNumber ?? 0),
  );
}
