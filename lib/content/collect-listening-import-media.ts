import {
  mediaAssetLookupKey,
  mediaStorageRef,
  AUDIOS_BUCKET,
  IMAGES_BUCKET,
  type ImportMediaKind,
  type MediaStorageRef,
} from "@/lib/content/media-storage-paths";
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
import type { ListeningImportFile } from "@/lib/content/listening-import-schema";
import { validateImportQuestionNumber } from "@/lib/content/validate-import-question-numbers";

export interface ImportMediaAssetSpec {
  kind: ImportMediaKind;
  storageBucket: string;
  storagePath: string;
  mimeType: string;
}

function addSpec(
  specs: Map<string, ImportMediaAssetSpec>,
  ref: MediaStorageRef,
  kind: ImportMediaKind,
) {
  const key = mediaAssetLookupKey(ref.storageBucket, ref.storagePath);
  if (specs.has(key)) return;

  specs.set(key, {
    kind,
    storageBucket: ref.storageBucket,
    storagePath: ref.storagePath,
    mimeType: kind === "image" ? "image/jpeg" : "audio/mpeg",
  });
}

function addAudioPathSpec(
  specs: Map<string, ImportMediaAssetSpec>,
  storagePath: string,
) {
  addSpec(
    specs,
    { storageBucket: AUDIOS_BUCKET, storagePath },
    "audio",
  );
}

function addImagePathSpec(
  specs: Map<string, ImportMediaAssetSpec>,
  storagePath: string,
) {
  addSpec(
    specs,
    { storageBucket: IMAGES_BUCKET, storagePath },
    "image",
  );
}

function addQuestionListeningAudioSpecs(
  specs: Map<string, ImportMediaAssetSpec>,
  bookId: string,
  testId: string,
  part: number,
  globalItemNumber: number,
  options: Array<{ label: string }>,
  includeWhole: boolean,
) {
  const global = validateImportQuestionNumber({
    part,
    globalItemNumber,
    label: "import",
    bookId,
  });

  if (includeWhole) {
    addAudioPathSpec(
      specs,
      buildListeningWholeAudioPath(bookId, testId, global),
    );
  }

  addAudioPathSpec(
    specs,
    buildListeningQuestionStemAudioPath(bookId, testId, global),
  );

  for (const option of options) {
    addAudioPathSpec(
      specs,
      buildListeningOptionAudioPath(bookId, testId, global, option.label),
    );
  }
}

export function collectListeningImportMediaSpecs(
  file: ListeningImportFile,
): ImportMediaAssetSpec[] {
  const { bookId, testId } = file;
  const specs = new Map<string, ImportMediaAssetSpec>();

  for (const partData of file.parts) {
    if (partData.part === 1) {
      for (const item of partData.items) {
        const global = validateImportQuestionNumber({
          part: 1,
          globalItemNumber: item.question.globalItemNumber,
          label: "import",
          bookId,
        });
        addImagePathSpec(
          specs,
          resolveListeningPart1ImagePath(
            bookId,
            testId,
            global,
            item.imageUrl,
          ),
        );
        addQuestionListeningAudioSpecs(
          specs,
          bookId,
          testId,
          1,
          global,
          item.question.options,
          true,
        );
      }
    } else if (partData.part === 2) {
      for (const item of partData.items) {
        addQuestionListeningAudioSpecs(
          specs,
          bookId,
          testId,
          2,
          item.question.globalItemNumber,
          item.question.options,
          true,
        );
      }
    } else {
      for (const group of partData.groups) {
        const globalNumbers = group.questions.map((question) =>
          validateImportQuestionNumber({
            part: partData.part,
            globalItemNumber: question.globalItemNumber,
            label: "import",
            bookId,
          }),
        );
        const range = groupGlobalRange(globalNumbers);
        if (range) {
          const groupPath =
            group.audioUrl ??
            buildListeningGroupRangeAudioPath(
              bookId,
              testId,
              range.start,
              range.end,
            );
          addSpec(
            specs,
            mediaStorageRef(
              bookId,
              testId,
              "audio",
              `${range.start}-${range.end}`,
              groupPath,
            ),
            "audio",
          );

          const anchorQuestion = [...group.questions].sort(
            (a, b) => a.globalItemNumber - b.globalItemNumber,
          )[0];
          if (
            listeningGroupUsesStimulusImage(
              bookId,
              partData.part,
              range.start,
              anchorQuestion?.imageUrl,
            )
          ) {
            addImagePathSpec(
              specs,
              resolveListeningGroupStimulusImagePath(
                bookId,
                testId,
                range.start,
                anchorQuestion?.imageUrl,
              ),
            );
          }
        }

        for (const question of group.questions) {
          const questionSlug = `${file.testId}-p${partData.part}-q${String(question.globalItemNumber).padStart(3, "0")}`;
          addSpec(
            specs,
            mediaStorageRef(
              bookId,
              testId,
              "image",
              questionSlug,
              question.imageUrl ?? null,
            ),
            "image",
          );
          addQuestionListeningAudioSpecs(
            specs,
            bookId,
            testId,
            partData.part,
            question.globalItemNumber,
            question.options,
            false,
          );
        }
      }
    }
  }

  return [...specs.values()];
}

export type MediaAssetIdLookup = Map<string, string>;

export { assetIdFromLookup, upsertImportMediaAssets } from "@/lib/content/collect-import-media";
