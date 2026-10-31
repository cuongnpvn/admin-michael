import type { SupabaseClient } from "@supabase/supabase-js";
import {
  unitFromLines,
  type ListeningDictationUnit,
} from "@/lib/admin/content/listening-dictation-unit";
import {
  buildListeningGroupRangeAudioPath,
  buildListeningWholeAudioPath,
  groupGlobalRange,
} from "@/lib/content/listening-audio-paths";
import { buildListeningPart1ImagePath } from "@/lib/content/listening-image-paths";
import { normalizeQuestionTranslations } from "@/lib/content/question-metadata";
import { copy } from "@/lib/copy/vi";
import {
  part1SpokenLines,
  part2SpokenLines,
  type Part12OptionLine,
} from "@/lib/listening/part12-spoken-lines";
import { resolveSpeakerTurns } from "@/lib/listening/speaker-turns";
import { resolveSpeechSentences } from "@/lib/listening/speech-sentences";
import { transcriptSegmentsMatchLines } from "@/lib/listening/transcript-segments-match";
import { normalizeTranscriptSegments } from "@/lib/listening/transcript-segments";

export interface ListeningDictationTarget {
  kind: "question" | "group";
  id: string;
  label: string;
  ready: boolean;
}

export type { ListeningDictationUnit };

interface QuestionRow {
  id: string;
  part: string;
  global_item_number: number;
  translations: unknown;
  listening_group_id: string | null;
}

interface OptionRow {
  question_id: string;
  text: string;
  sort_order: number;
}

export async function loadListeningTestDictation(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
): Promise<{
  targets: ListeningDictationTarget[];
  units: ListeningDictationUnit[];
}> {
  const { data: questionRows, error: questionError } = await supabase
    .from("questions")
    .select("id, part, global_item_number, translations, listening_group_id")
    .eq("book_id", bookId)
    .eq("test_id", testId)
    .in("part", ["1", "2", "3", "4"])
    .order("global_item_number", { ascending: true });

  if (questionError) throw questionError;

  const questions = (questionRows ?? []) as QuestionRow[];
  if (questions.length === 0) return { targets: [], units: [] };

  const shortIds = questions
    .filter((question) => question.part === "1" || question.part === "2")
    .map((question) => question.id);
  const part1Ids = questions
    .filter((question) => question.part === "1")
    .map((question) => question.id);
  const part2Ids = questions
    .filter((question) => question.part === "2")
    .map((question) => question.id);
  const groupIds = [
    ...new Set(
      questions
        .map((question) => question.listening_group_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const [optionResult, part1Result, part2Result, groupResult] = await Promise.all([
    shortIds.length > 0
      ? supabase
          .from("answer_options")
          .select("question_id, text, sort_order")
          .in("question_id", shortIds)
      : Promise.resolve({ data: [], error: null }),
    part1Ids.length > 0
      ? supabase
          .from("listening_part1_items")
          .select("question_id, transcript_segments")
          .in("question_id", part1Ids)
      : Promise.resolve({ data: [], error: null }),
    part2Ids.length > 0
      ? supabase
          .from("listening_part2_items")
          .select("question_id, transcript, transcript_segments")
          .in("question_id", part2Ids)
      : Promise.resolve({ data: [], error: null }),
    groupIds.length > 0
      ? supabase
          .from("listening_groups")
          .select("id, part, transcript, transcript_segments")
          .in("id", groupIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (optionResult.error) throw optionResult.error;
  if (part1Result.error) throw part1Result.error;
  if (part2Result.error) throw part2Result.error;
  if (groupResult.error) throw groupResult.error;

  const optionsByQuestion = new Map<string, Part12OptionLine[]>();
  for (const option of (optionResult.data ?? []) as OptionRow[]) {
    const list = optionsByQuestion.get(option.question_id) ?? [];
    list.push({ text: option.text ?? "", sortOrder: option.sort_order });
    optionsByQuestion.set(option.question_id, list);
  }

  const part1ByQuestion = new Map(
    ((part1Result.data ?? []) as Array<{
      question_id: string;
      transcript_segments: unknown;
    }>).map((row) => [row.question_id, row]),
  );
  const part2ByQuestion = new Map(
    ((part2Result.data ?? []) as Array<{
      question_id: string;
      transcript: string | null;
      transcript_segments: unknown;
    }>).map((row) => [row.question_id, row]),
  );
  const groupById = new Map(
    ((groupResult.data ?? []) as Array<{
      id: string;
      part: string;
      transcript: string | null;
      transcript_segments: unknown;
    }>).map((row) => [row.id, row]),
  );

  const targets: ListeningDictationTarget[] = [];
  const units: ListeningDictationUnit[] = [];

  for (const question of questions) {
    if (question.part !== "1" && question.part !== "2") continue;
    const options = optionsByQuestion.get(question.id) ?? [];
    const lines =
      question.part === "1"
        ? part1SpokenLines(options)
        : part2SpokenLines(part2ByQuestion.get(question.id)?.transcript ?? "", options);
    if (lines.length === 0) continue;

    const stored =
      question.part === "1"
        ? part1ByQuestion.get(question.id)?.transcript_segments
        : part2ByQuestion.get(question.id)?.transcript_segments;
    const segments = normalizeTranscriptSegments(stored);
    const ready = transcriptSegmentsMatchLines(segments, lines);
    targets.push({
      kind: "question",
      id: question.id,
      label: copy.admin.cms.questionDetailTitle(question.global_item_number),
      ready,
    });

    const unit = unitFromLines({
      part: question.part === "1" ? "1" : "2",
      audioPath: buildListeningWholeAudioPath(
        bookId,
        testId,
        question.global_item_number,
      ),
      sortOrder: question.global_item_number,
      imagePath:
        question.part === "1"
          ? buildListeningPart1ImagePath(
              bookId,
              testId,
              question.global_item_number,
            )
          : null,
      lines,
      segments,
      translations: normalizeQuestionTranslations(question.translations),
    });
    if (unit) units.push(unit);
  }

  const questionsByGroup = new Map<string, QuestionRow[]>();
  for (const question of questions) {
    if (!question.listening_group_id) continue;
    const list = questionsByGroup.get(question.listening_group_id) ?? [];
    list.push(question);
    questionsByGroup.set(question.listening_group_id, list);
  }

  for (const [groupId, groupQuestions] of questionsByGroup) {
    const group = groupById.get(groupId);
    if (!group || (group.part !== "3" && group.part !== "4")) continue;
    const lines =
      group.part === "4"
        ? resolveSpeechSentences(group.transcript ?? "")
        : resolveSpeakerTurns(group.transcript ?? "");
    if (lines.length === 0) continue;

    const range = groupGlobalRange(
      groupQuestions.map((question) => question.global_item_number),
    );
    if (!range) continue;

    const segments = normalizeTranscriptSegments(group.transcript_segments);
    const ready = transcriptSegmentsMatchLines(segments, lines);
    targets.push({
      kind: "group",
      id: groupId,
      label: copy.admin.cms.groupDetailTitle(range.start, range.end),
      ready,
    });

    const translations = groupQuestions.flatMap((question) =>
      normalizeQuestionTranslations(question.translations),
    );
    const unit = unitFromLines({
      part: group.part === "4" ? "4" : "3",
      audioPath: buildListeningGroupRangeAudioPath(
        bookId,
        testId,
        range.start,
        range.end,
      ),
      sortOrder: range.start,
      imagePath: null,
      lines,
      segments,
      translations,
    });
    if (unit) units.push(unit);
  }

  return { targets, units };
}
