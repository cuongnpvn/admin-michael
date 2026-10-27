import type { SupabaseClient } from "@supabase/supabase-js";
import {
  mediaBucketForKind,
  normalizeMediaStorageInput,
} from "@/lib/content/media-storage-paths";
import type { MediaKind } from "@/types/content-db";

export function normalizeStoragePathInput(
  value: string,
  kind?: MediaKind,
): string | null {
  return normalizeMediaStorageInput(
    value,
    kind === "image" ? "image" : "audio",
  )?.storagePath ?? null;
}

export async function upsertMediaAssetByPath(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  kind: MediaKind,
  storagePathInput: string | null,
  mimeTypeOverride?: string | null,
): Promise<string | null> {
  const importKind = kind === "image" ? "image" : "audio";
  const resolved = storagePathInput
    ? normalizeMediaStorageInput(storagePathInput, importKind)
    : null;

  if (!resolved) return null;

  const mimeType =
    mimeTypeOverride?.trim() ||
    (kind === "image" ? "image/jpeg" : "audio/mpeg");

  const { data, error } = await supabase
    .from("media_assets")
    .upsert(
      {
        book_id: bookId,
        test_id: testId,
        kind,
        storage_bucket: resolved.storageBucket || mediaBucketForKind(importKind),
        storage_path: resolved.storagePath,
        mime_type: mimeType,
      },
      { onConflict: "storage_bucket,storage_path" },
    )
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}
