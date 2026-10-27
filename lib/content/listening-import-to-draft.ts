import {
  assetIdFromLookup,
  type MediaAssetIdLookup,
} from "@/lib/content/collect-listening-import-media";
import type { DraftBundle, DraftQuestionRow } from "@/lib/content/draft-types";
import type {
  ListeningImportFile,
  ListeningImportQuestion,
} from "@/lib/content/listening-import-schema";
import {
  buildListeningGroupRangeAudioPath,
  buildListeningOptionAudioPath,
  buildListeningQuestionStemAudioPath,
  buildListeningWholeAudioPath,
  groupGlobalRange,
} from "@/lib/content/listening-audio-paths";
import {
  listeningGroupUsesStimulusImage,
  resolveListeningGroupStimulusImagePath,
  resolveListeningPart1ImagePath,
} from "@/lib/content/listening-image-paths";
import {
  mediaStorageRef,
  AUDIOS_BUCKET,
  IMAGES_BUCKET,
} from "@/lib/content/media-storage-paths";
import { resolveImportCorrectOptionLabel } from "@/lib/content/resolve-correct-option-label";
import { validateQuestionTags } from "@/lib/content/toeic-tags";
import { validateImportQuestionNumber } from "@/lib/content/validate-import-question-numbers";

function padGlobalNumber(value: number): string {
  return String(value).padStart(3, "0");
}

function questionSlug(testId: string, part: number, globalItemNumber: number): string {
  return `${testId}-p${part}-q${padGlobalNumber(globalItemNumber)}`;
}

function optionSlug(questionSlugValue: string, label: string): string {
  return `${questionSlugValue}-${label.toLowerCase()}`;
}

function audioRefFromPath(storagePath: string) {
  return { storageBucket: AUDIOS_BUCKET, storagePath };
}

function imageRefFromPath(storagePath: string) {
  return { storageBucket: IMAGES_BUCKET, storagePath };
}

function draftQuestionFromImport(
  bookId: string,
  testId: string,
  part: number,
  question: Omit<ListeningImportQuestion, "prompt"> & { prompt?: string },
  mediaLookup: MediaAssetIdLookup,
  links?: { listeningGroupSlug?: string },
): DraftQuestionRow {
  const globalItemNumber = validateImportQuestionNumber({
    part,
    globalItemNumber: question.globalItemNumber,
    label: `${testId}-p${part}`,
    bookId,
  });
  const slug = questionSlug(testId, part, globalItemNumber);

  const options = question.options.map((option, index) => ({
    slug: optionSlug(slug, option.label),
    label: option.label,
    text: option.text,
    sortOrder: index + 1,
    audioAssetId: assetIdFromLookup(
      mediaLookup,
      audioRefFromPath(
        buildListeningOptionAudioPath(
          bookId,
          testId,
          globalItemNumber,
          option.label,
        ),
      ),
    ),
  }));

  const correctOptionLabel = resolveImportCorrectOptionLabel({
    correctOptionLabel: question.correctOptionLabel,
    explanation: question.explanation,
    options: question.options,
  });
  const correctOptionSlug = correctOptionLabel
    ? optionSlug(slug, correctOptionLabel)
    : "";

  const contextImageAssetId = question.imageUrl
    ? assetIdFromLookup(
        mediaLookup,
        mediaStorageRef(bookId, testId, "image", slug, question.imageUrl),
      )
    : undefined;

  const stemAudioAssetId = assetIdFromLookup(
    mediaLookup,
    audioRefFromPath(
      buildListeningQuestionStemAudioPath(bookId, testId, globalItemNumber),
    ),
  );

  const wholeAudioAssetId = assetIdFromLookup(
    mediaLookup,
    audioRefFromPath(
      buildListeningWholeAudioPath(bookId, testId, globalItemNumber),
    ),
  );

  if (part === 1) {
    return {
      slug,
      part,
      globalItemNumber,
      prompt: "",
      correctOptionSlug,
      hint: question.hint ?? null,
      explanation: question.explanation ?? null,
      tags: validateQuestionTags(question.tags),
      translations: [],
      vocabulary: question.vocabulary ?? [],
      options,
      contextImageAssetId,
      audioAssetId: wholeAudioAssetId,
      stemAudioAssetId,
    };
  }

  return {
    slug,
    part,
    globalItemNumber,
    prompt: question.prompt ?? "",
    correctOptionSlug,
    hint: question.hint ?? null,
    explanation: question.explanation ?? null,
    tags: validateQuestionTags(question.tags),
    translations: [],
    vocabulary: question.vocabulary ?? [],
    options,
    listeningGroupSlug: links?.listeningGroupSlug,
    contextImageAssetId,
    audioAssetId: stemAudioAssetId,
  };
}

export function draftBundleFromListeningImport(
  file: ListeningImportFile,
  mediaLookup: MediaAssetIdLookup = new Map(),
): DraftBundle {
  const questions: DraftQuestionRow[] = [];
  const partTitles: DraftBundle["partTitles"] = [];
  const listeningGroups: DraftBundle["listeningGroups"] = [];
  const part1Items: DraftBundle["part1Items"] = [];
  const part2Items: DraftBundle["part2Items"] = [];

  for (const partData of file.parts) {
    partTitles.push({ part: partData.part, title: partData.title });

    if (partData.part === 1) {
      for (const item of partData.items) {
        const row = draftQuestionFromImport(
          file.bookId,
          file.testId,
          1,
          item.question,
          mediaLookup,
        );
        questions.push(row);
        part1Items.push({
          questionSlug: row.slug,
          imageAssetId: assetIdFromLookup(
            mediaLookup,
            imageRefFromPath(
              resolveListeningPart1ImagePath(
                file.bookId,
                file.testId,
                row.globalItemNumber,
                item.imageUrl,
              ),
            ),
          ),
        });
      }
      continue;
    }

    if (partData.part === 2) {
      for (const item of partData.items) {
        const row = draftQuestionFromImport(
          file.bookId,
          file.testId,
          2,
          item.question,
          mediaLookup,
        );
        questions.push(row);
        part2Items.push({
          questionSlug: row.slug,
          transcript: item.questionTranscript,
          audioAssetId: assetIdFromLookup(
            mediaLookup,
            audioRefFromPath(
              buildListeningWholeAudioPath(
                file.bookId,
                file.testId,
                row.globalItemNumber,
              ),
            ),
          ),
        });
      }
      continue;
    }

    partData.groups.forEach((group, groupIndex) => {
      const groupSlug =
        group.id ??
        `${file.testId}-p${partData.part}-g${String(groupIndex + 1).padStart(2, "0")}`;
      const questionSlugs: string[] = [];
      const globalNumbers: number[] = [];
      const groupTranslations = group.translations ?? [];

      const sortedGroupQuestions = [...group.questions].sort(
        (a, b) => a.globalItemNumber - b.globalItemNumber,
      );

      for (const [questionIndex, groupQuestion] of sortedGroupQuestions.entries()) {
        const row = draftQuestionFromImport(
          file.bookId,
          file.testId,
          partData.part,
          groupQuestion,
          mediaLookup,
          { listeningGroupSlug: groupSlug },
        );
        if (questionIndex === 0 && groupTranslations.length > 0) {
          row.translations = groupTranslations;
        }
        if (
          questionIndex === 0 &&
          listeningGroupUsesStimulusImage(
            file.bookId,
            partData.part,
            row.globalItemNumber,
            groupQuestion.imageUrl,
          )
        ) {
          row.contextImageAssetId = assetIdFromLookup(
            mediaLookup,
            imageRefFromPath(
              resolveListeningGroupStimulusImagePath(
                file.bookId,
                file.testId,
                row.globalItemNumber,
                groupQuestion.imageUrl,
              ),
            ),
          );
        }
        questions.push(row);
        questionSlugs.push(row.slug);
        globalNumbers.push(row.globalItemNumber);
      }

      const range = groupGlobalRange(globalNumbers);
      const groupAudioPath = range
        ? buildListeningGroupRangeAudioPath(
            file.bookId,
            file.testId,
            range.start,
            range.end,
          )
        : null;

      listeningGroups.push({
        slug: groupSlug,
        part: partData.part,
        topic: group.topic,
        transcript: group.transcript,
        vocabulary: group.vocabulary ?? [],
        questionSlugs,
        audioAssetId: groupAudioPath
          ? assetIdFromLookup(
              mediaLookup,
              mediaStorageRef(
                file.bookId,
                file.testId,
                "audio",
                `${range!.start}-${range!.end}`,
                group.audioUrl ?? groupAudioPath,
              ),
            )
          : undefined,
      });
    });
  }

  return {
    bookId: file.bookId,
    testId: file.testId,
    testTitle: file.title,
    partTitles,
    part1Items,
    part2Items,
    listeningGroups,
    readingPassageSets: [],
    questions,
  };
}

export function listeningImportMetaParts(file: ListeningImportFile) {
  return file.parts.map((part) => ({
    bookId: file.bookId,
    testId: file.testId,
    part: part.part,
    title: part.title,
    questionCount:
      part.part === 1 || part.part === 2
        ? part.items.length
        : part.groups.reduce((sum, group) => sum + group.questions.length, 0),
  }));
}
