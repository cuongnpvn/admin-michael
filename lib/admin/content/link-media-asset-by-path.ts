import type { SupabaseClient } from "@supabase/supabase-js";
import { upsertMediaAssetByPath } from "@/lib/admin/content/media-asset-upsert";

/**
 * Upsert a media_assets row from admin storage-path text, or return null when cleared.
 */
export async function linkMediaAssetByStoragePath(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  kind: "audio" | "image",
  storagePathInput: string | null | undefined,
): Promise<string | null> {
  const trimmed = storagePathInput?.trim() ?? "";
  if (!trimmed) return null;

  return upsertMediaAssetByPath(supabase, bookId, testId, kind, trimmed);
}
