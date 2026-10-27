import {
  mediaAssetLookupKey,
  mediaStorageRef,
  type ImportMediaKind,
  type MediaStorageRef,
} from "@/lib/content/media-storage-paths";
import type { TestImportFile } from "@/lib/content/schemas";

export interface ImportMediaAssetSpec {
  kind: ImportMediaKind;
  storageBucket: string;
  storagePath: string;
  mimeType: string;
}

function specKey(spec: ImportMediaAssetSpec): string {
  return mediaAssetLookupKey(spec.storageBucket, spec.storagePath);
}

function addSpec(
  specs: Map<string, ImportMediaAssetSpec>,
  ref: MediaStorageRef,
  kind: ImportMediaKind,
) {
  const storagePath = ref.storagePath;
  const key = mediaAssetLookupKey(ref.storageBucket, storagePath);
  if (specs.has(key)) return;

  specs.set(key, {
    kind,
    storageBucket: ref.storageBucket,
    storagePath,
    mimeType: kind === "image" ? "image/jpeg" : "audio/mpeg",
  });
}

export function collectImportMediaSpecs(
  file: TestImportFile,
): ImportMediaAssetSpec[] {
  const { bookId, testId } = file.meta;
  const specs = new Map<string, ImportMediaAssetSpec>();

  for (const item of file.listening.part1.items) {
    addSpec(
      specs,
      mediaStorageRef(bookId, testId, "image", item.question.id, item.imageUrl),
      "image",
    );

    for (const option of item.question.options) {
      addSpec(
        specs,
        mediaStorageRef(bookId, testId, "audio", option.id, option.audioUrl),
        "audio",
      );
    }
  }

  for (const item of file.listening.part2.items) {
    for (const option of item.question.options) {
      addSpec(
        specs,
        mediaStorageRef(bookId, testId, "audio", option.id, option.audioUrl),
        "audio",
      );
    }
  }

  for (const part of [file.listening.part3, file.listening.part4] as const) {
    for (const group of part.groups) {
      addSpec(
        specs,
        mediaStorageRef(bookId, testId, "audio", group.id, group.audioUrl),
        "audio",
      );

      for (const question of group.questions) {
        for (const option of question.options) {
          addSpec(
            specs,
            mediaStorageRef(bookId, testId, "audio", option.id, option.audioUrl),
            "audio",
          );
        }
      }
    }
  }

  return [...specs.values()];
}

export type MediaAssetIdLookup = Map<string, string>;

export async function upsertImportMediaAssets(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  bookId: string,
  testId: string,
  specs: ImportMediaAssetSpec[],
): Promise<MediaAssetIdLookup> {
  const lookup: MediaAssetIdLookup = new Map();

  if (specs.length === 0) return lookup;

  const rows = specs.map((spec) => ({
    book_id: bookId,
    test_id: testId,
    kind: spec.kind,
    storage_bucket: spec.storageBucket,
    storage_path: spec.storagePath,
    mime_type: spec.mimeType,
  }));

  const { data, error } = await supabase
    .from("media_assets")
    .upsert(rows, { onConflict: "storage_bucket,storage_path" })
    .select("id, storage_bucket, storage_path");

  if (error) throw error;

  for (const row of data ?? []) {
    lookup.set(
      mediaAssetLookupKey(row.storage_bucket, row.storage_path),
      row.id,
    );
  }

  return lookup;
}

export function assetIdFromLookup(
  lookup: MediaAssetIdLookup,
  ref: MediaStorageRef,
): string | null {
  return lookup.get(mediaAssetLookupKey(ref.storageBucket, ref.storagePath)) ?? null;
}

export function assetRefFromLookup(
  lookup: MediaAssetIdLookup,
  ref: MediaStorageRef,
): MediaStorageRef | null {
  if (!lookup.has(mediaAssetLookupKey(ref.storageBucket, ref.storagePath))) {
    return null;
  }
  return ref;
}
