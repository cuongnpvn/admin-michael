import type { SupabaseClient } from "@supabase/supabase-js";
import {
  VOCABULARY_IMAGE_MIME_TYPES,
} from "@/lib/admin/vocabulary/constants";
import {
  IMAGES_BUCKET,
  type ImageExtension,
  extensionFromMime,
} from "@/lib/content/media-storage-paths";

const ITEM_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isVocabularyItemId(value: string): boolean {
  return ITEM_ID_RE.test(value);
}

export function extensionFromVocabImageFile(file: File): ImageExtension | null {
  if (file.type && VOCABULARY_IMAGE_MIME_TYPES.has(file.type)) {
    return extensionFromMime(file.type);
  }

  const name = file.name.toLowerCase();
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "jpg";
  if (name.endsWith(".png")) return "png";
  if (name.endsWith(".webp")) return "webp";
  return null;
}

export async function assertAdminOwnedDeck(
  supabase: SupabaseClient,
  deckId: string,
): Promise<{ ok: true } | { ok: false; reason: "missing" | "not_common" }> {
  const { data, error } = await supabase
    .from("vocabulary_decks")
    .select("id, owner_id")
    .eq("id", deckId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { ok: false, reason: "missing" };
  if (data.owner_id != null) return { ok: false, reason: "not_common" };
  return { ok: true };
}

export async function listItemImagePath(
  supabase: SupabaseClient,
  itemId: string,
  deckId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("vocabulary_items")
    .select("image_path")
    .eq("id", itemId)
    .eq("deck_id", deckId)
    .maybeSingle();

  if (error) throw error;
  const path = (data?.image_path as string | null | undefined)?.trim();
  return path || null;
}

export async function listDeckImagePaths(
  supabase: SupabaseClient,
  deckId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("vocabulary_items")
    .select("image_path")
    .eq("deck_id", deckId)
    .not("image_path", "is", null);

  if (error) throw error;

  return (data ?? [])
    .map((row) => (row.image_path as string | null)?.trim())
    .filter((path): path is string => Boolean(path));
}

export async function removeVocabImageObjects(
  supabase: SupabaseClient,
  paths: string[],
): Promise<void> {
  const unique = [
    ...new Set(paths.map((path) => path.trim()).filter(Boolean)),
  ];
  if (unique.length === 0) return;

  const { error } = await supabase.storage.from(IMAGES_BUCKET).remove(unique);
  if (error) throw error;
}
