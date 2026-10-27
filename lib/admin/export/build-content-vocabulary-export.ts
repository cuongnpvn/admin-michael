import type { SupabaseClient } from "@supabase/supabase-js";
import { loadAdminPartEditor } from "@/lib/admin/content/load-part-editor";
import type {
  ContentVocabularyExportUnit,
  ContentVocabularyPart,
} from "@/lib/content/content-vocabulary-export-schema";
import type { AdminPartQuestionRow } from "@/types/admin-part-editor";

function sortedOptions(question: AdminPartQuestionRow) {
  return [...question.options]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((option) => ({
      label: option.label,
      text: option.text,
    }));
}

function correctOptionLabel(question: AdminPartQuestionRow): string | undefined {
  if (!question.correctOptionId) return undefined;
  const match = question.options.find(
    (option) => option.id === question.correctOptionId,
  );
  return match?.label;
}

function buildQuestionUnit(
  part: 1 | 2 | 5,
  question: AdminPartQuestionRow,
): ContentVocabularyExportUnit {
  const unit: ContentVocabularyExportUnit = {
    part,
    questionId: question.slug,
    globalItemNumber: question.globalItemNumber,
    prompt: question.prompt,
    options: sortedOptions(question),
  };

  const transcript =
    question.transcript?.trim() || question.groupTranscript?.trim();
  if (transcript) {
    unit.transcript = transcript;
  }

  const answerLabel = correctOptionLabel(question);
  if (answerLabel) {
    unit.correctOptionLabel = answerLabel;
  }

  return unit;
}

function buildListeningGroupUnits(
  part: 3 | 4,
  questions: AdminPartQuestionRow[],
): ContentVocabularyExportUnit[] {
  const byGroup = new Map<string, AdminPartQuestionRow[]>();

  for (const question of questions) {
    if (!question.listeningGroupId) continue;
    const current = byGroup.get(question.listeningGroupId) ?? [];
    current.push(question);
    byGroup.set(question.listeningGroupId, current);
  }

  const units: ContentVocabularyExportUnit[] = [];

  for (const [groupId, groupQuestions] of byGroup) {
    const sorted = [...groupQuestions].sort(
      (a, b) => a.globalItemNumber - b.globalItemNumber,
    );
    const anchor = sorted[0];
    if (!anchor) continue;

    const transcript = anchor.groupTranscript?.trim() ?? "";
    units.push({
      part,
      groupId: anchor.listeningGroupSlug ?? groupId,
      questionId: anchor.slug,
      globalItemNumber: anchor.globalItemNumber,
      transcript,
      questions: sorted.map((question) => ({
        questionId: question.slug,
        globalItemNumber: question.globalItemNumber,
        prompt: question.prompt,
        options: sortedOptions(question),
        correctOptionLabel: correctOptionLabel(question),
      })),
    });
  }

  return units.sort(
    (a, b) => (a.globalItemNumber ?? 0) - (b.globalItemNumber ?? 0),
  );
}

function buildPassageSetUnits(
  part: 6 | 7,
  editorData: NonNullable<Awaited<ReturnType<typeof loadAdminPartEditor>>>,
): ContentVocabularyExportUnit[] {
  const questionById = new Map(
    editorData.questions.map((question) => [question.id, question]),
  );

  return editorData.passageSets.map((set) => {
    const setQuestions = set.questionIds
      .map((id) => questionById.get(id))
      .filter(
        (question): question is AdminPartQuestionRow => question != null,
      )
      .sort((a, b) => a.globalItemNumber - b.globalItemNumber);

    const anchor = setQuestions[0];
    if (!anchor) {
      throw new Error(`Passage set ${set.id} has no questions`);
    }

    return {
      part,
      questionId: anchor.slug,
      globalItemNumber: anchor.globalItemNumber,
      passages: set.passages.map((passage) => ({
        title: passage.title,
        content: passage.content,
      })),
      questions: setQuestions.map((question) => ({
        questionId: question.slug,
        globalItemNumber: question.globalItemNumber,
        prompt: question.prompt,
        options: sortedOptions(question),
        correctOptionLabel: correctOptionLabel(question),
      })),
    };
  });
}

export async function buildContentVocabularyExport(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  part: ContentVocabularyPart,
): Promise<ContentVocabularyExportUnit[]> {
  if (part === 1 || part === 2) {
    const editorData = await loadAdminPartEditor(supabase, bookId, testId, part);
    if (!editorData) return [];
    return editorData.questions
      .slice()
      .sort((a, b) => a.globalItemNumber - b.globalItemNumber)
      .map((question) => buildQuestionUnit(part, question));
  }

  if (part === 3 || part === 4) {
    const editorData = await loadAdminPartEditor(supabase, bookId, testId, part);
    if (!editorData) return [];
    return buildListeningGroupUnits(part, editorData.questions);
  }

  if (part === 5) {
    const editorData = await loadAdminPartEditor(supabase, bookId, testId, 5);
    if (!editorData) return [];
    return editorData.questions
      .slice()
      .sort((a, b) => a.globalItemNumber - b.globalItemNumber)
      .map((question) => buildQuestionUnit(5, question));
  }

  const editorData = await loadAdminPartEditor(supabase, bookId, testId, part);
  if (!editorData) return [];
  return buildPassageSetUnits(part, editorData);
}
