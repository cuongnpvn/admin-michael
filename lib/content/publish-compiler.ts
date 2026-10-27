import type { MediaAssetIdLookup } from "@/lib/content/collect-import-media";
import { assetRefFromLookup } from "@/lib/content/collect-import-media";
import {
  inferListeningStimulusKind,
  layoutToPassageLayout,
} from "@/lib/content/infer-metadata";
import {
  mediaStorageRef,
  resolvePublicAssetRef,
} from "@/lib/content/media-storage-paths";
import { groupGlobalRange } from "@/lib/content/listening-audio-paths";
import {
  resolvePracticeGroupAudioUrl,
  resolvePracticePart1ImageUrl,
  resolvePracticeWholeAudioUrl,
} from "@/lib/listening/resolve-practice-media";
import { validatePartPayload } from "@/lib/content/schemas";
import type {
  LoadedDraftBundle,
  LoadedQuestion,
} from "@/lib/content/draft-types";
import type {
  ListeningPartData,
  ReadingPartData,
  TestMeta,
} from "@/types/test-data";
import type { ListeningStimulusKind } from "@/types/content-db";

/** Supports cached bundles loaded before `listening_groups.title` → `topic`. */
function resolveListeningGroupTopic(group: {
  topic?: string | null;
  title?: string | null;
}): string | undefined {
  const value = group.topic?.trim() || group.title?.trim();
  return value || undefined;
}
function resolvePublicAssetUrl(
  asset: { storageBucket: string; storagePath: string } | null | undefined,
  supabaseUrl?: string,
): string | null {
  return resolvePublicAssetRef(asset, supabaseUrl);
}

function compileQuestion(
  question: LoadedQuestion,
  supabaseUrl?: string,
) {
  return {
    id: question.slug,
    globalItemNumber: question.globalItemNumber,
    prompt: question.prompt,
    audioUrl: resolvePublicAssetUrl(question.audioAsset, supabaseUrl),
    questionStemAudioUrl: resolvePublicAssetUrl(
      question.stemAudioAsset,
      supabaseUrl,
    ),
    imageUrl: resolvePublicAssetUrl(question.contextImageAsset, supabaseUrl),
    hint: question.hint ?? null,
    explanation: question.explanation ?? null,
    ...(question.freeExplanation ? { freeExplanation: true } : {}),
    tags: question.tags.length > 0 ? question.tags : undefined,
    translations: question.translations ?? [],
    ...(question.vocabulary?.length
      ? { vocabulary: question.vocabulary }
      : {}),
    ...(question.translationHtml
      ? { translationHtml: question.translationHtml }
      : {}),
    options: question.options.map((option) => ({
      id: option.slug,
      label: option.label,
      text: option.text,
      audioUrl: resolvePublicAssetUrl(option.audioAsset, supabaseUrl),
    })),
    correctOptionId:
      question.options.find((option) => option.id === question.correctOptionId)?.slug ??
      question.options.find((option) => option.label === "A")?.slug ??
      question.options[0]?.slug ??
      "",
  };
}

export function compileListeningPart(
  bundle: LoadedDraftBundle,
  part: 1 | 2 | 3 | 4,
  supabaseUrl?: string,
): ListeningPartData {
  const title = bundle.partTitles[part] ?? `Part ${part}`;

  if (part === 1) {
    const payload = {
      part: 1 as const,
      title,
      items: bundle.part1Items.map((item) => {
        const { prompt: _prompt, ...question } = compileQuestion(
          item.question,
          supabaseUrl,
        );
        const globalNumber = question.globalItemNumber;
        return {
          question: {
            ...question,
            audioUrl: resolvePracticeWholeAudioUrl(
              bundle.bookId,
              bundle.testId,
              globalNumber,
            ),
          },
          imageUrl: resolvePracticePart1ImageUrl(
            bundle.bookId,
            bundle.testId,
            globalNumber,
          ),
        };
      }),
    };
    return validatePartPayload(1, payload) as ListeningPartData;
  }

  if (part === 2) {
    const payload = {
      part: 2 as const,
      title,
      items: bundle.part2Items.map((item) => {
        const compiled = compileQuestion(item.question, supabaseUrl);
        const globalNumber = compiled.globalItemNumber;
        const wholeAudioUrl = resolvePracticeWholeAudioUrl(
          bundle.bookId,
          bundle.testId,
          globalNumber,
        );
        return {
          question: {
            ...compiled,
            audioUrl: wholeAudioUrl,
            questionStemAudioUrl: wholeAudioUrl ?? compiled.questionStemAudioUrl,
          },
          questionTranscript: item.transcript,
          questionTranscriptAudioUrl: wholeAudioUrl,
        };
      }),
    };
    return validatePartPayload(2, payload) as ListeningPartData;
  }

  const groups = bundle.listeningGroups
    .filter((group) => group.part === String(part))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((group) => {
      const questions = group.questions
        .sort((a, b) => a.globalItemNumber - b.globalItemNumber)
        .map((question) => {
          const compiled = compileQuestion(question, supabaseUrl);
          if (group.freeExplanation || question.freeExplanation) {
            return { ...compiled, freeExplanation: true as const };
          }
          return compiled;
        });
      const globalNumbers = questions.map(
        (question) => question.globalItemNumber,
      );
      const range = groupGlobalRange(globalNumbers);
      const audioUrl = range
        ? resolvePracticeGroupAudioUrl(
            bundle.bookId,
            bundle.testId,
            range.start,
            range.end,
          )
        : null;

      return {
        id: group.slug,
        topic: resolveListeningGroupTopic(group),
        transcript: group.transcript,
        ...(group.vocabulary?.length
          ? { vocabulary: group.vocabulary }
          : {}),
        format: group.format,
        audioUrl,
        stimulusKind: group.stimulusKind as ListeningStimulusKind,
        ...(group.freeExplanation ? { freeExplanation: true } : {}),
        ...(group.transcriptSegments && group.transcriptSegments.length > 0
          ? { transcriptSegments: group.transcriptSegments }
          : {}),
        questions,
      };
    });

  const payload =
    part === 3
      ? { part: 3 as const, title, groups }
      : { part: 4 as const, title, groups };

  return validatePartPayload(part, payload) as ListeningPartData;
}

export function compileReadingPart(
  bundle: LoadedDraftBundle,
  part: 5 | 6 | 7,
  supabaseUrl?: string,
): ReadingPartData {
  const title = bundle.partTitles[part] ?? `Part ${part}`;

  if (part === 5) {
    const payload = {
      part: 5 as const,
      title,
      items: bundle.standaloneQuestions
        .filter((question) => question.part === "5")
        .sort((a, b) => a.globalItemNumber - b.globalItemNumber)
        .map((question) => ({ question: compileQuestion(question, supabaseUrl) })),
    };
    return validatePartPayload(5, payload) as ReadingPartData;
  }

  const passageSets = bundle.readingPassageSets
    .filter((set) => set.part === String(part))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((set) => ({
      id: set.slug,
      topic: set.topic ?? undefined,
      ...(set.vocabulary?.length ? { vocabulary: set.vocabulary } : {}),
      layout: layoutToPassageLayout(set.layout),
      contentModel: set.contentModel,
      ...(set.freeExplanation ? { freeExplanation: true } : {}),
      passages: set.passages
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((passage) => ({
          id: passage.slug,
          title: passage.title,
          content: passage.content,
          ...(passage.translations.length > 0
            ? { translations: passage.translations }
            : {}),
          ...(passage.translationHtml
            ? { translationHtml: passage.translationHtml }
            : {}),
        })),
      questions: set.questions
        .sort((a, b) => a.globalItemNumber - b.globalItemNumber)
        .map((question) => {
          const compiled = compileQuestion(question, supabaseUrl);
          if (set.freeExplanation || question.freeExplanation) {
            return { ...compiled, freeExplanation: true as const };
          }
          return compiled;
        }),
    }));

  const payload =
    part === 6
      ? { part: 6 as const, title, passageSets }
      : { part: 7 as const, title, passageSets };

  return validatePartPayload(part, payload) as ReadingPartData;
}

export function compileTestMeta(
  bundle: LoadedDraftBundle,
  partPayloads: Array<ListeningPartData | ReadingPartData>,
  supabaseUrl?: string,
): TestMeta {
  return {
    bookId: bundle.bookId as TestMeta["bookId"],
    testId: bundle.testId,
    title: bundle.testTitle,
    listeningTestAudioUrl: null,
    parts: partPayloads.map((partData) => {
      const part = partData.part;
      let questionCount = 0;

      if ("items" in partData) {
        questionCount = partData.items.length;
      } else if ("groups" in partData) {
        questionCount = partData.groups.reduce(
          (sum, group) => sum + group.questions.length,
          0,
        );
      } else if ("passageSets" in partData) {
        questionCount = partData.passageSets.reduce(
          (sum, set) => sum + set.questions.length,
          0,
        );
      }

      return {
        part,
        title: partData.title,
        questionCount,
      };
    }),
  };
}

export interface CompiledTestPublish {
  meta: TestMeta;
  parts: Record<number, ListeningPartData | ReadingPartData>;
}

export function compileFullTestPublish(
  bundle: LoadedDraftBundle,
  supabaseUrl?: string,
): CompiledTestPublish {
  const parts: Record<number, ListeningPartData | ReadingPartData> = {
    1: compileListeningPart(bundle, 1, supabaseUrl),
    2: compileListeningPart(bundle, 2, supabaseUrl),
    3: compileListeningPart(bundle, 3, supabaseUrl),
    4: compileListeningPart(bundle, 4, supabaseUrl),
    5: compileReadingPart(bundle, 5, supabaseUrl),
    6: compileReadingPart(bundle, 6, supabaseUrl),
    7: compileReadingPart(bundle, 7, supabaseUrl),
  };

  const orderedParts = [1, 2, 3, 4, 5, 6, 7].map(
    (part) => parts[part] as ListeningPartData | ReadingPartData,
  );

  return {
    meta: compileTestMeta(bundle, orderedParts, supabaseUrl),
    parts,
  };
}

export function bundleFromPartJson(
  bookId: string,
  testId: string,
  testTitle: string,
  partTitles: Record<number, string>,
  listeningParts: ListeningPartData[],
  readingParts: ReadingPartData[],
  mediaLookup: MediaAssetIdLookup = new Map(),
): LoadedDraftBundle {
  const bundle: LoadedDraftBundle = {
    bookId,
    testId,
    testTitle,
    listeningTestAudioAsset: null,
    partTitles,
    part1Items: [],
    part2Items: [],
    listeningGroups: [],
    readingPassageSets: [],
    standaloneQuestions: [],
  };

  for (const partData of listeningParts) {
    if (partData.part === 1) {
      for (const item of partData.items) {
        bundle.part1Items.push({
          question: jsonQuestionToLoaded(
            bookId,
            testId,
            mediaLookup,
            item.question,
            "1",
          ),
          imageAsset: assetRefFromLookup(
            mediaLookup,
            mediaStorageRef(
              bookId,
              testId,
              "image",
              item.question.id,
              item.imageUrl,
            ),
          ),
        });
      }
    } else if (partData.part === 2) {
      for (const item of partData.items) {
        bundle.part2Items.push({
          question: jsonQuestionToLoaded(
            bookId,
            testId,
            mediaLookup,
            item.question,
            "2",
          ),
          transcript: item.questionTranscript,
          transcriptAudioAsset: assetRefFromLookup(
            mediaLookup,
            mediaStorageRef(
              bookId,
              testId,
              "audio",
              item.question.id,
              item.questionTranscriptAudioUrl ?? item.question.audioUrl,
            ),
          ),
        });
      }
    } else {
      let sortOrder = 0;
      for (const group of partData.groups) {
        sortOrder += 1;
        bundle.listeningGroups.push({
          id: group.id,
          slug: group.id,
          part: String(partData.part) as "3" | "4",
          topic: group.topic ?? null,
          transcript: group.transcript,
          vocabulary: group.vocabulary ?? [],
          format: partData.part === 3 ? "dialogue" : "monologue",
          stimulusKind:
            group.stimulusKind ??
            inferListeningStimulusKind(partData.part, group.topic),
          sortOrder,
          freeExplanation: Boolean(group.freeExplanation),
          transcriptSegments: group.transcriptSegments,
          audioAsset: assetRefFromLookup(
            mediaLookup,
            mediaStorageRef(bookId, testId, "audio", group.id, group.audioUrl),
          ),
          questions: group.questions.map((question) =>
            jsonQuestionToLoaded(
              bookId,
              testId,
              mediaLookup,
              question,
              String(partData.part),
            ),
          ),
        });
      }
    }
  }

  for (const partData of readingParts) {
    if (partData.part === 5) {
      for (const item of partData.items) {
        bundle.standaloneQuestions.push(
          jsonQuestionToLoaded(
            bookId,
            testId,
            mediaLookup,
            item.question,
            "5",
          ),
        );
      }
    } else {
      let sortOrder = 0;
      for (const set of partData.passageSets) {
        sortOrder += 1;
        const layout =
          set.layout === "single"
            ? "single"
            : set.passages.length >= 3
              ? "triple"
              : "double";

        bundle.readingPassageSets.push({
          id: set.id,
          slug: set.id,
          part: String(partData.part) as "6" | "7",
          topic: set.topic ?? null,
          vocabulary: set.vocabulary ?? [],
          contentModel: set.contentModel ?? "comprehension",
          layout,
          sortOrder,
          freeExplanation: Boolean(set.freeExplanation),
          passages: set.passages.map((passage, index) => ({
            id: passage.id,
            slug: passage.id,
            title: passage.title,
            content: passage.content,
            sortOrder: index + 1,
            translations: passage.translations ?? [],
            ...(passage.translationHtml
              ? { translationHtml: passage.translationHtml }
              : {}),
          })),
          questions: set.questions.map((question) =>
            jsonQuestionToLoaded(
              bookId,
              testId,
              mediaLookup,
              question,
              String(partData.part),
            ),
          ),
        });
      }
    }
  }

  return bundle;
}

function jsonQuestionToLoaded(
  bookId: string,
  testId: string,
  mediaLookup: MediaAssetIdLookup,
  question: {
    id: string;
    globalItemNumber: number;
    prompt?: string;
    audioUrl?: string | null;
    imageUrl?: string | null;
    translations?: Array<{ english: string; vietnamese: string }>;
    vocabulary?: LoadedQuestion["vocabulary"];
    options: Array<{
      id: string;
      label: "A" | "B" | "C" | "D";
      text: string;
      audioUrl: string | null;
    }>;
    correctOptionId: string;
  },
  part: string,
): LoadedQuestion {
  return {
    id: question.id,
    slug: question.id,
    part: part as LoadedQuestion["part"],
    globalItemNumber: question.globalItemNumber,
    prompt: question.prompt ?? "",
    hint: null,
    explanation: null,
    freeExplanation: false,
    tags: [],
    translations: question.translations ?? [],
    vocabulary: question.vocabulary ?? [],
    correctOptionId: question.correctOptionId,
    audioAsset: assetRefFromLookup(
      mediaLookup,
      mediaStorageRef(bookId, testId, "audio", question.id, question.audioUrl),
    ),
    contextImageAsset: assetRefFromLookup(
      mediaLookup,
      mediaStorageRef(bookId, testId, "image", question.id, question.imageUrl ?? null),
    ),
    options: question.options.map((option, index) => ({
      id: option.id,
      slug: option.id,
      label: option.label,
      text: option.text,
      sortOrder: index + 1,
      audioAsset: assetRefFromLookup(
        mediaLookup,
        mediaStorageRef(bookId, testId, "audio", option.id, option.audioUrl),
      ),
    })),
  };
}
