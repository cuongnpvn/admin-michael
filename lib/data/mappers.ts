import { layoutToPassageLayout } from "@/lib/content/infer-metadata";
import type { ContentVocabularyWord } from "@/lib/content/content-vocabulary";
import type { TranscriptSegment } from "@/lib/listening/transcript-segments";
import { parseQuestionExplanation } from "@/lib/content/question-explanation";
import {
  buildBilingualSentences,
  resolvePassageSetTranslations,
  splitTranslationsByPassages,
} from "@/lib/reading/passage-bilingual";
import type {
  AnswerOption,
  Question,
  QuestionTranslationEntry,
} from "@/types/ui";
import type { PartQuestionKey } from "@/lib/practice/score-part";
import type {
  AnswerOptionData,
  ListeningPartData,
  QuestionData,
  ReadingPartData,
  ReadingPassageData,
  ToeicPart,
} from "@/types/test-data";

export function toUiQuestion(
  data: QuestionData | Omit<QuestionData, "prompt">,
  options?: { part?: number },
): Question {
  const part = options?.part;
  const globalItemNumber = data.globalItemNumber;

  return {
    id: data.id,
    number: globalItemNumber,
    globalItemNumber,
    prompt: part === 1 ? "" : ("prompt" in data ? (data.prompt ?? "") : ""),
    audioUrl: data.audioUrl ?? null,
    imageUrl: data.imageUrl ?? null,
    options: data.options.map(toUiOption),
    hint: data.hint ?? null,
    explanation: parseQuestionExplanation(data.explanation),
    ...(data.freeExplanation ? { freeExplanation: true as const } : {}),
    ...(data.explanationLocked ? { explanationLocked: true as const } : {}),
    tags: data.tags && data.tags.length > 0 ? data.tags : undefined,
    translations:
      data.translations && data.translations.length > 0
        ? data.translations
        : undefined,
    vocabulary:
      data.vocabulary && data.vocabulary.length > 0
        ? data.vocabulary
        : undefined,
    translationHtml: data.translationHtml?.trim() || undefined,
  };
}

function toUiOption(option: AnswerOptionData): AnswerOption {
  return {
    id: option.id,
    label: option.label,
    text: option.text,
    audioId: option.id,
    audioUrl: option.audioUrl,
  };
}

export interface FlatListeningItem {
  question: Question;
  imageUrl?: string | null;
  audioUrl?: string | null;
  transcript?: string;
  /** Stable id for deterministic transcript cloze (part 2: question id; parts 3–4: group id). */
  transcriptSeedId?: string;
  stimulusTitle?: string;
  /** Sentence translations for the listening group (anchor question; parts 3–4). */
  groupTranslations?: QuestionTranslationEntry[];
  /** Curated vocab for the listening group (parts 3–4). */
  groupVocabulary?: ContentVocabularyWord[];
  /** Speaker-turn marks for the group conversation audio. */
  transcriptSegments?: TranscriptSegment[];
}

function toQuestionKey(
  data: Pick<QuestionData, "id" | "globalItemNumber" | "correctOptionId">,
): PartQuestionKey {
  return {
    id: data.id,
    globalItemNumber: data.globalItemNumber,
    correctOptionId: data.correctOptionId,
  };
}

export function getListeningPartQuestionKeys(
  part: ListeningPartData,
): PartQuestionKey[] {
  switch (part.part) {
    case 1:
      return part.items.map((item) => toQuestionKey(item.question));
    case 2:
      return part.items.map((item) => toQuestionKey(item.question));
    case 3:
    case 4:
      return part.groups.flatMap((group) =>
        group.questions.map((question) => toQuestionKey(question)),
      );
  }
}

export function getReadingPartQuestionKeys(
  part: ReadingPartData,
): PartQuestionKey[] {
  if (part.part === 5) {
    return part.items.map((item) => toQuestionKey(item.question));
  }

  return part.passageSets.flatMap((set) =>
    set.questions.map((question) => toQuestionKey(question)),
  );
}

export function flattenListeningPart(part: ListeningPartData): FlatListeningItem[] {
  switch (part.part) {
    case 1:
      return part.items.map((item) => ({
        question: toUiQuestion(item.question, { part: 1 }),
        imageUrl: item.imageUrl,
        audioUrl: item.question.audioUrl ?? null,
      }));
    case 2:
      return part.items.map((item) => ({
        question: toUiQuestion(item.question),
        audioUrl: item.question.audioUrl ?? null,
        transcript: item.questionTranscript,
        transcriptSeedId: item.question.id,
      }));
    case 3:
    case 4:
      return part.groups.flatMap((group) => {
        const groupTranslations = getListeningGroupTranslations(
          group.questions.map((question) => toUiQuestion(question)),
        );

        return group.questions.map((question) => ({
          question: toUiQuestion(question),
          imageUrl: question.imageUrl ?? null,
          audioUrl: group.audioUrl,
          transcript: group.transcript,
          transcriptSeedId: group.id,
          stimulusTitle: group.topic ?? undefined,
          groupTranslations:
            groupTranslations.length > 0 ? groupTranslations : undefined,
          groupVocabulary:
            group.vocabulary && group.vocabulary.length > 0
              ? group.vocabulary
              : undefined,
          transcriptSegments:
            group.transcriptSegments && group.transcriptSegments.length > 0
              ? group.transcriptSegments
              : undefined,
        }));
      });
  }
}

export interface ReadingPassageSetView {
  id: string;
  topic?: string;
  vocabulary?: ContentVocabularyWord[];
  layout: "single" | "double";
  passages: ReadingPassageData[];
  questionIds: string[];
}

export interface ReadingSessionView {
  part: number;
  partTitle: string;
  questions: Question[];
  passageSets: ReadingPassageSetView[];
  questionPassageSetId: Record<string, string>;
}

export interface MergedReadingSessionView extends ReadingSessionView {
  selectedParts: Array<5 | 6 | 7>;
  questionPartById: Record<string, 5 | 6 | 7>;
}

export function mergeReadingPartsForSession(
  parts: Array<5 | 6 | 7>,
  partDataByPart: Partial<Record<5 | 6 | 7, ReadingPartData>>,
): MergedReadingSessionView | null {
  if (parts.length === 0) {
    return null;
  }

  const questions: Question[] = [];
  const passageSets: ReadingPassageSetView[] = [];
  const questionPassageSetId: Record<string, string> = {};
  const questionPartById: Record<string, 5 | 6 | 7> = {};
  const partTitles: string[] = [];

  for (const part of parts) {
    const partData = partDataByPart[part];
    if (!partData) {
      return null;
    }

    const view = toReadingSessionView(partData);
    partTitles.push(view.partTitle);

    for (const question of view.questions) {
      questions.push(question);
      questionPartById[question.id] = part;
    }

    passageSets.push(...view.passageSets);
    Object.assign(questionPassageSetId, view.questionPassageSetId);
  }

  return {
    part: parts[0],
    partTitle: partTitles.join(" · "),
    questions,
    passageSets,
    questionPassageSetId,
    selectedParts: parts,
    questionPartById,
  };
}

export function getReadingPartsQuestionKeys(
  parts: Array<5 | 6 | 7>,
  partDataByPart: Partial<Record<5 | 6 | 7, ReadingPartData>>,
): PartQuestionKey[] {
  return parts.flatMap((part) => {
    const partData = partDataByPart[part];
    return partData ? getReadingPartQuestionKeys(partData) : [];
  });
}

export function toReadingSessionView(part: ReadingPartData): ReadingSessionView {
  if (part.part === 5) {
    return {
      part: 5,
      partTitle: part.title,
      questions: part.items.map((item) => toUiQuestion(item.question, { part: 5 })),
      passageSets: [],
      questionPassageSetId: {},
    };
  }

  const questions: Question[] = [];
  const questionPassageSetId: Record<string, string> = {};
  const passageSets: ReadingPassageSetView[] = part.passageSets.map((set) => {
    for (const q of set.questions) {
      questions.push(toUiQuestion(q, { part: part.part }));
      questionPassageSetId[q.id] = set.id;
    }
    return {
      id: set.id,
      topic: set.topic,
      vocabulary:
        set.vocabulary && set.vocabulary.length > 0
          ? set.vocabulary
          : undefined,
      // Session UI only distinguishes single vs multi; collapse triple → double.
      layout: layoutToPassageLayout(set.layout),
      passages: set.passages,
      questionIds: set.questions.map((q) => q.id),
    };
  });

  return {
    part: part.part,
    partTitle: part.title,
    questions,
    passageSets,
    questionPassageSetId,
  };
}

export function scopeReadingSessionToPassageSet(
  view: ReadingSessionView,
  passageSetId: string,
): ReadingSessionView | null {
  const set = view.passageSets.find((entry) => entry.id === passageSetId);
  if (!set) return null;

  const questions = getQuestionsForPassageSet(view, passageSetId);
  const questionPassageSetId = Object.fromEntries(
    questions.map((question) => [question.id, passageSetId]),
  );

  return {
    ...view,
    questions,
    passageSets: [set],
    questionPassageSetId,
  };
}

function resolvePassageSetForQuestion(
  view: ReadingSessionView,
  questionId: string,
): ReadingPassageSetView | undefined {
  const setId = view.questionPassageSetId[questionId];
  if (!setId) return undefined;

  return (
    view.passageSets.find(
      (set) => set.id === setId && set.questionIds.includes(questionId),
    ) ?? view.passageSets.find((set) => set.id === setId)
  );
}

export function getPassagesForQuestion(
  view: ReadingSessionView,
  questionId: string,
): ReadingPassageData[] {
  return resolvePassageSetForQuestion(view, questionId)?.passages ?? [];
}

export function getPassageLayoutForQuestion(
  view: ReadingSessionView,
  questionId: string,
): "single" | "double" | null {
  return resolvePassageSetForQuestion(view, questionId)?.layout ?? null;
}

export function getPassageSetForQuestion(
  view: ReadingSessionView,
  questionId: string,
): ReadingPassageSetView | undefined {
  return resolvePassageSetForQuestion(view, questionId);
}

export function getQuestionsForPassageSet(
  view: ReadingSessionView,
  setId: string,
  anchorQuestionId?: string,
): Question[] {
  const set = anchorQuestionId
    ? (view.passageSets.find(
        (entry) =>
          entry.id === setId && entry.questionIds.includes(anchorQuestionId),
      ) ?? view.passageSets.find((entry) => entry.id === setId))
    : view.passageSets.find((entry) => entry.id === setId);
  if (!set) return [];

  const byId = new Map(view.questions.map((question) => [question.id, question]));
  return set.questionIds
    .map((id) => byId.get(id))
    .filter((question): question is Question => question != null);
}

export function getQuestionsForQuestionPassageSet(
  view: ReadingSessionView,
  questionId: string,
): Question[] {
  const set = resolvePassageSetForQuestion(view, questionId);
  if (!set) return [];

  const byId = new Map(view.questions.map((question) => [question.id, question]));
  return set.questionIds
    .map((id) => byId.get(id))
    .filter((question): question is Question => question != null);
}

export function getPassageTranslations(
  passage: ReadingPassageData,
): QuestionTranslationEntry[] {
  return passage.translations ?? [];
}

export function getPassageTranslationHtml(
  passage: ReadingPassageData,
): string | undefined {
  return passage.translationHtml?.trim() || undefined;
}

/** Per-passage HTML translation slices with Part 6 anchor-question fallback. */
export function resolvePassageSetTranslationHtmlSlices(
  passages: ReadingPassageData[],
  legacyQuestionHtml?: string,
): (string | undefined)[] {
  const perPassage = passages.map((passage) =>
    getPassageTranslationHtml(passage),
  );
  if (perPassage.some(Boolean)) {
    return perPassage;
  }

  const legacy = legacyQuestionHtml?.trim();
  if (!legacy) {
    return passages.map(() => undefined);
  }

  if (passages.length <= 1) {
    return [legacy];
  }

  return [legacy, ...passages.slice(1).map(() => undefined)];
}

/** Per-passage translation slices with legacy flat-list fallback. */
export function resolvePassageSetTranslationSlices(
  passages: ReadingPassageData[],
  legacyFlatTranslations: QuestionTranslationEntry[],
): QuestionTranslationEntry[][] {
  const perPassage = passages.map((passage) => getPassageTranslations(passage));
  if (perPassage.some((slice) => slice.length > 0)) {
    return perPassage;
  }

  if (passages.length <= 1) {
    return [legacyFlatTranslations];
  }

  return splitTranslationsByPassages(passages, legacyFlatTranslations);
}

export function hasPassageSetBilingualContent(
  passages: ReadingPassageData[],
  legacyFlatTranslations: QuestionTranslationEntry[],
  legacyQuestionHtml?: string,
): boolean {
  const hasSentences = resolvePassageSetTranslationSlices(
    passages,
    legacyFlatTranslations,
  ).some((slice) => buildBilingualSentences(slice).length > 0);

  const hasHtml = resolvePassageSetTranslationHtmlSlices(
    passages,
    legacyQuestionHtml,
  ).some((slice) => Boolean(slice?.trim()));

  return hasSentences || hasHtml;
}

export function getPassageSetTranslations(
  view: ReadingSessionView,
  setId: string,
  anchorQuestionId?: string,
) {
  const questions = getQuestionsForPassageSet(view, setId, anchorQuestionId);
  for (const question of questions) {
    if (question.translations?.length) {
      return question.translations;
    }
  }
  return [];
}

/** Resolve HTML translation slices using any question in the passage set (Part 6 anchor). */
export function resolvePassageSetTranslationHtmlFromQuestions(
  passages: ReadingPassageData[],
  questions: Array<{ translationHtml?: string | null }>,
): (string | undefined)[] {
  const legacy = questions
    .map((question) => question.translationHtml?.trim())
    .find(Boolean);

  return resolvePassageSetTranslationHtmlSlices(passages, legacy);
}

export function getPassageSetTranslationHtml(
  view: ReadingSessionView,
  setId: string,
  anchorQuestionId?: string,
): string | undefined {
  const questions = getQuestionsForPassageSet(view, setId, anchorQuestionId);
  for (const question of questions) {
    const html = question.translationHtml?.trim();
    if (html) {
      return html;
    }
  }
  return undefined;
}

export function getListeningGroupTranslations(
  questions: Question[],
): QuestionTranslationEntry[] {
  return resolvePassageSetTranslations(questions);
}

export interface ExamQuestionItem {
  globalNumber: number;
  part: ToeicPart;
  question: Question;
  imageUrl?: string | null;
  audioUrl?: string | null;
  audioTranscript?: string;
  groupId?: string;
  stimulusTitle?: string;
  /** Curated vocab for listening groups (parts 3–4). */
  groupVocabulary?: ContentVocabularyWord[];
  passageSetId?: string;
  passages?: ReadingPassageData[];
  layout?: "single" | "double" | "triple";
  passageSetTranslations?: QuestionTranslationEntry[];
  /** Curated vocab for reading passage sets (parts 6–7). */
  passageSetVocabulary?: ContentVocabularyWord[];
}

/** Learner-facing TOEIC item number (official test booklet number). */
export function getExamQuestionDisplayNumber(item: ExamQuestionItem): number {
  return item.question.globalItemNumber;
}

export interface ExamPartBoundary {
  part: ToeicPart;
  startGlobal: number;
  endGlobal: number;
}

export interface FlattenFullExamResult {
  listening: ExamQuestionItem[];
  reading: ExamQuestionItem[];
  listeningKeys: PartQuestionKey[];
  readingKeys: PartQuestionKey[];
  listeningPartBoundaries: ExamPartBoundary[];
  readingPartBoundaries: ExamPartBoundary[];
}

export function flattenFullExam(
  listeningParts: ListeningPartData[],
  readingParts: ReadingPartData[],
  questionKeysByPart: Map<number, PartQuestionKey[]>,
): FlattenFullExamResult {
  const listening: ExamQuestionItem[] = [];
  const reading: ExamQuestionItem[] = [];
  const listeningKeys: PartQuestionKey[] = [];
  const readingKeys: PartQuestionKey[] = [];
  const listeningPartBoundaries: ExamPartBoundary[] = [];
  const readingPartBoundaries: ExamPartBoundary[] = [];

  let globalListening = 1;

  for (const partData of listeningParts) {
    const startGlobal = globalListening;
    const flat = flattenListeningPart(partData);
    const keys = questionKeysByPart.get(partData.part) ?? [];

    const groupTranslationsById = new Map<string, QuestionTranslationEntry[]>();
    const groupVocabularyById = new Map<string, ContentVocabularyWord[]>();
    if (partData.part === 3 || partData.part === 4) {
      for (const group of partData.groups) {
        const translations = getListeningGroupTranslations(
          group.questions.map((question) => toUiQuestion(question)),
        );
        if (translations.length > 0) {
          groupTranslationsById.set(group.id, translations);
        }
        if (group.vocabulary && group.vocabulary.length > 0) {
          groupVocabularyById.set(group.id, group.vocabulary);
        }
      }
    }

    flat.forEach((item, index) => {
      const globalNumber = globalListening + index;
      const groupId = item.transcriptSeedId;
      listening.push({
        globalNumber,
        part: partData.part,
        question: {
          ...item.question,
          number: item.question.globalItemNumber,
        },
        imageUrl: item.imageUrl,
        audioUrl: item.audioUrl,
        audioTranscript: item.transcript,
        groupId,
        stimulusTitle: item.stimulusTitle,
        groupVocabulary:
          item.groupVocabulary ??
          (groupId ? groupVocabularyById.get(groupId) : undefined),
        passageSetTranslations:
          groupId && groupTranslationsById.has(groupId)
            ? groupTranslationsById.get(groupId)
            : undefined,
      });
    });

    listeningKeys.push(...keys);
    const endGlobal = globalListening + flat.length - 1;
    listeningPartBoundaries.push({
      part: partData.part,
      startGlobal,
      endGlobal,
    });
    globalListening += flat.length;
  }

  let globalReading = 101;

  for (const partData of readingParts) {
    const startGlobal = globalReading;
    const view = toReadingSessionView(partData);
    const keys = questionKeysByPart.get(partData.part) ?? [];

    view.questions.forEach((question, index) => {
      const globalNumber = globalReading + index;
      const passages = getPassagesForQuestion(view, question.id);
      const layout = getPassageLayoutForQuestion(view, question.id);
      const passageSetId = view.questionPassageSetId[question.id];
      const passageSet = passageSetId
        ? view.passageSets.find((set) => set.id === passageSetId)
        : undefined;
      const passageSetTranslationHtml = passageSetId
        ? getPassageSetTranslationHtml(view, passageSetId)
        : undefined;
      reading.push({
        globalNumber,
        part: partData.part,
        question: {
          ...question,
          number: question.globalItemNumber,
          translationHtml:
            question.translationHtml ?? passageSetTranslationHtml,
        },
        passageSetId,
        passages,
        layout: layout ?? undefined,
        passageSetTranslations: passageSetId
          ? getPassageSetTranslations(view, passageSetId)
          : [],
        passageSetVocabulary: passageSet?.vocabulary,
      });
    });

    readingKeys.push(...keys);
    readingPartBoundaries.push({
      part: partData.part,
      startGlobal,
      endGlobal: globalReading + view.questions.length - 1,
    });
    globalReading += view.questions.length;
  }

  return {
    listening,
    reading,
    listeningKeys,
    readingKeys,
    listeningPartBoundaries,
    readingPartBoundaries,
  };
}

export function getPartForListeningIndex(
  boundaries: ExamPartBoundary[],
  globalNumber: number,
): ToeicPart {
  const found = boundaries.find(
    (b) => globalNumber >= b.startGlobal && globalNumber <= b.endGlobal,
  );
  return found?.part ?? 1;
}

export function getPartForReadingIndex(
  boundaries: ExamPartBoundary[],
  globalNumber: number,
): ToeicPart {
  const found = boundaries.find(
    (b) => globalNumber >= b.startGlobal && globalNumber <= b.endGlobal,
  );
  return found?.part ?? 5;
}
