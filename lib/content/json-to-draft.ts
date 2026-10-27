import type { MediaAssetIdLookup } from "@/lib/content/collect-import-media";
import { assetIdFromLookup } from "@/lib/content/collect-import-media";
import type {
  DraftBundle,
  DraftQuestionRow,
} from "@/lib/content/draft-types";
import {
  inferListeningStimulusKind,
  layoutFromPassageCount,
} from "@/lib/content/infer-metadata";
import { mediaStorageRef } from "@/lib/content/media-storage-paths";
import type {
  ListeningPartData,
  ReadingPartData,
} from "@/types/test-data";

function questionFromJson(
  bookId: string,
  testId: string,
  part: number,
  mediaLookup: MediaAssetIdLookup,
  question: {
    id: string;
    globalItemNumber: number;
    prompt?: string;
    vocabulary?: DraftQuestionRow["vocabulary"];
    options: Array<{
      id: string;
      label: "A" | "B" | "C" | "D";
      text: string;
      audioUrl: string | null;
    }>;
    correctOptionId: string;
    imageUrl?: string | null;
  },
): DraftQuestionRow {
  return {
    slug: question.id,
    part,
    globalItemNumber: question.globalItemNumber,
    prompt: part === 1 ? "" : (question.prompt ?? ""),
    correctOptionSlug: question.correctOptionId,
    vocabulary: question.vocabulary ?? [],
    options: question.options.map((option, index) => ({
      slug: option.id,
      label: option.label,
      text: option.text,
      sortOrder: index + 1,
      audioAssetId: assetIdFromLookup(
        mediaLookup,
        mediaStorageRef(bookId, testId, "audio", option.id, option.audioUrl),
      ),
    })),
    contextImageAssetId: question.imageUrl
      ? assetIdFromLookup(
          mediaLookup,
          mediaStorageRef(bookId, testId, "image", question.id, question.imageUrl),
        )
      : undefined,
  };
}

export function draftBundleFromPartJson(
  bookId: string,
  testId: string,
  testTitle: string,
  metaParts: Array<{ part: number; title: string }>,
  listeningParts: ListeningPartData[],
  readingParts: ReadingPartData[],
  mediaLookup: MediaAssetIdLookup,
): DraftBundle {
  const questions: DraftQuestionRow[] = [];

  const bundle: DraftBundle = {
    bookId,
    testId,
    testTitle,
    partTitles: metaParts.map((part) => ({
      part: part.part,
      title: part.title,
    })),
    part1Items: [],
    part2Items: [],
    listeningGroups: [],
    readingPassageSets: [],
    questions,
  };

  for (const partData of listeningParts) {
    if (partData.part === 1) {
      for (const item of partData.items) {
        const question = questionFromJson(
          bookId,
          testId,
          1,
          mediaLookup,
          item.question,
        );
        questions.push(question);
        bundle.part1Items.push({
          questionSlug: question.slug,
          imageAssetId: assetIdFromLookup(
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
        const question = questionFromJson(
          bookId,
          testId,
          2,
          mediaLookup,
          item.question,
        );
        questions.push(question);
        bundle.part2Items.push({
          questionSlug: question.slug,
          transcript: item.questionTranscript,
        });
      }
    } else {
      for (const group of partData.groups) {
        const questionSlugs: string[] = [];
        for (const groupQuestion of group.questions) {
          const question = questionFromJson(
            bookId,
            testId,
            partData.part,
            mediaLookup,
            groupQuestion,
          );
          question.listeningGroupSlug = group.id;
          questions.push(question);
          questionSlugs.push(question.slug);
        }

        bundle.listeningGroups.push({
          slug: group.id,
          part: partData.part,
          topic: group.topic,
          transcript: group.transcript,
          vocabulary: group.vocabulary ?? [],
          questionSlugs,
          audioAssetId: assetIdFromLookup(
            mediaLookup,
            mediaStorageRef(bookId, testId, "audio", group.id, group.audioUrl),
          ),
        });
      }
    }
  }

  for (const partData of readingParts) {
    if (partData.part === 5) {
      for (const item of partData.items) {
        const question = questionFromJson(
          bookId,
          testId,
          5,
          mediaLookup,
          item.question,
        );
        questions.push(question);
      }
    } else {
      for (const set of partData.passageSets) {
        const questionSlugs: string[] = [];
        for (const setQuestion of set.questions) {
          const question = questionFromJson(
            bookId,
            testId,
            partData.part,
            mediaLookup,
            setQuestion,
          );
          question.readingPassageSetSlug = set.id;
          questions.push(question);
          questionSlugs.push(question.slug);
        }

        bundle.readingPassageSets.push({
          slug: set.id,
          part: partData.part,
          topic: "topic" in set && typeof set.topic === "string" ? set.topic : null,
          vocabulary: set.vocabulary ?? [],
          layout: layoutFromPassageCount(set.passages.length),
          contentModel: set.contentModel ?? "comprehension",
          passages: set.passages.map((passage) => ({
            slug: passage.id,
            title: passage.title,
            content: passage.content,
          })),
          questionSlugs,
        });
      }
    }
  }

  bundle.questions = questions;
  return bundle;
}

export function inferStimulusKindForGroup(part: 3 | 4, topic?: string) {
  return inferListeningStimulusKind(part, topic);
}
