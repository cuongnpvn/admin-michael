import type { SupabaseClient } from "@supabase/supabase-js";
import { loadAdminPartEditor } from "@/lib/admin/content/load-part-editor";
import type { ListeningPart12TranslationExportEntry } from "@/lib/content/listening-part12-translation-export-schema";

function exportTextsForPart1(
  options: Array<{ text: string }>,
): Array<{ english: string }> | null {
  if (options.length !== 4) return null;
  const texts = options.map((option) => option.text.trim());
  if (texts.some((text) => text.length === 0)) return null;
  return texts.map((english) => ({ english }));
}

function exportTextsForPart2(
  prompt: string,
  options: Array<{ text: string }>,
): Array<{ english: string }> | null {
  const trimmedPrompt = prompt.trim();
  if (!trimmedPrompt || options.length !== 3) return null;
  const optionTexts = options.map((option) => option.text.trim());
  if (optionTexts.some((text) => text.length === 0)) return null;
  return [{ english: trimmedPrompt }, ...optionTexts.map((english) => ({ english }))];
}

export async function buildListeningPart12TranslationExport(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
): Promise<ListeningPart12TranslationExportEntry[]> {
  const entries: ListeningPart12TranslationExportEntry[] = [];

  for (const part of [1, 2] as const) {
    const editorData = await loadAdminPartEditor(supabase, bookId, testId, part);
    if (!editorData) continue;

    for (const question of editorData.questions) {
      const sortedOptions = [...question.options].sort(
        (a, b) => a.sortOrder - b.sortOrder,
      );

      const texts =
        part === 1
          ? exportTextsForPart1(sortedOptions)
          : exportTextsForPart2(question.prompt, sortedOptions);

      if (!texts) continue;

      entries.push({
        questionId: question.slug,
        part,
        texts,
      });
    }
  }

  return entries.sort((a, b) => {
    if (a.part !== b.part) return a.part - b.part;
    return a.questionId.localeCompare(b.questionId);
  });
}
