import type { SupabaseClient } from "@supabase/supabase-js";
import { loadAdminPartEditor } from "@/lib/admin/content/load-part-editor";
import type { GroupedTagPart } from "@/lib/admin/content/map-question-tag-updates";
import { stripPassageHtml } from "@/lib/reading/passage-html-text";
import type {
  AdminPartEditorData,
  AdminPartQuestionRow,
  AdminPassageSetRow,
} from "@/types/admin-part-editor";

export interface GroupedTagOption {
  label: string;
  text: string;
}

export interface GroupedTagQuestion {
  id: string;
  globalItemNumber: number;
  prompt: string;
  options: GroupedTagOption[];
}

export interface GroupedListeningTagUnit {
  transcript: string;
  questions: GroupedTagQuestion[];
}

export interface GroupedReadingTagUnit {
  passageCount: number;
  passages: Array<{ title: string; text: string }>;
  questions: GroupedTagQuestion[];
}

export type GroupedTagUnit = GroupedListeningTagUnit | GroupedReadingTagUnit;

function toQuestion(question: AdminPartQuestionRow): GroupedTagQuestion {
  return {
    id: question.id,
    globalItemNumber: question.globalItemNumber,
    prompt: question.prompt,
    options: [...question.options]
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((option) => ({
        label: option.label,
        text: option.text,
      }))
      .filter((option) => option.label && option.text),
  };
}

function byItemNumber(left: GroupedTagQuestion, right: GroupedTagQuestion): number {
  return left.globalItemNumber - right.globalItemNumber;
}

export function buildListeningTagUnits(
  questions: AdminPartQuestionRow[],
): GroupedListeningTagUnit[] {
  const byGroup = new Map<string, AdminPartQuestionRow[]>();
  const orphans: AdminPartQuestionRow[] = [];

  for (const question of questions) {
    if (!question.listeningGroupId) {
      orphans.push(question);
      continue;
    }
    const current = byGroup.get(question.listeningGroupId) ?? [];
    current.push(question);
    byGroup.set(question.listeningGroupId, current);
  }

  const units: GroupedListeningTagUnit[] = [];

  for (const groupQuestions of byGroup.values()) {
    const sorted = [...groupQuestions].sort(
      (left, right) => left.globalItemNumber - right.globalItemNumber,
    );
    const anchor = sorted[0];
    if (!anchor) continue;
    units.push({
      transcript: anchor.groupTranscript?.trim() ?? "",
      questions: sorted.map(toQuestion),
    });
  }

  for (const question of orphans) {
    units.push({
      transcript: question.transcript?.trim() ?? "",
      questions: [toQuestion(question)],
    });
  }

  return units
    .filter((unit) => unit.questions.length > 0)
    .sort(
      (left, right) =>
        (left.questions[0]?.globalItemNumber ?? 0) -
        (right.questions[0]?.globalItemNumber ?? 0),
    );
}

export function buildReadingTagUnits(
  editorData: AdminPartEditorData,
): GroupedReadingTagUnit[] {
  const questionById = new Map(
    editorData.questions.map((question) => [question.id, question]),
  );
  const usedIds = new Set<string>();
  const units: GroupedReadingTagUnit[] = [];

  for (const set of editorData.passageSets) {
    const unit = passageSetUnit(set, questionById);
    if (!unit) continue;
    for (const question of unit.questions) usedIds.add(question.id);
    units.push(unit);
  }

  for (const question of editorData.questions) {
    if (usedIds.has(question.id)) continue;
    units.push({
      passageCount: 0,
      passages: [],
      questions: [toQuestion(question)],
    });
  }

  return units.sort(
    (left, right) =>
      (left.questions[0]?.globalItemNumber ?? 0) -
      (right.questions[0]?.globalItemNumber ?? 0),
  );
}

function passageSetUnit(
  set: AdminPassageSetRow,
  questionById: Map<string, AdminPartQuestionRow>,
): GroupedReadingTagUnit | null {
  const questions = set.questionIds
    .map((id) => questionById.get(id))
    .filter((question): question is AdminPartQuestionRow => question != null)
    .map(toQuestion)
    .sort(byItemNumber);

  if (questions.length === 0) return null;

  const passages = set.passages.map((passage) => ({
    title: passage.title.trim(),
    text: stripPassageHtml(passage.content).trim(),
  }));

  return {
    passageCount: passages.length,
    passages,
    questions,
  };
}

export function groupedTagQuestionCount(units: GroupedTagUnit[]): number {
  return units.reduce((sum, unit) => sum + unit.questions.length, 0);
}

export async function buildGroupedQuestionTagExport(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  part: GroupedTagPart,
): Promise<GroupedTagUnit[]> {
  const editorData = await loadAdminPartEditor(supabase, bookId, testId, part);
  if (!editorData || editorData.questions.length === 0) return [];

  if (part === 3 || part === 4) {
    return buildListeningTagUnits(editorData.questions);
  }

  return buildReadingTagUnits(editorData);
}
