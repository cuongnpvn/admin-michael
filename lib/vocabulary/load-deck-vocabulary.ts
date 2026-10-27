import type { SupabaseClient } from "@supabase/supabase-js";
import {
  IMAGES_BUCKET,
  buildPublicAssetUrlForBucket,
} from "@/lib/content/media-storage-paths";
import {
  parseVocabularyCefrLevel,
  type VocabularyCefrLevel,
} from "@/lib/vocabulary/cefr-level";

export interface LoadedVocabularyItem {
  id: string;
  term: string;
  lemma: string | null;
  meaningVi: string | null;
  definitionEn: string | null;
  ipaUs: string | null;
  ipaUk: string | null;
  wordTypes: string[];
  synonyms: string[];
  collocations: string[];
  example: string | null;
  level: VocabularyCefrLevel | null;
  imageUrl: string | null;
}

export interface VocabularySummaryItem {
  id: string;
  term: string;
  lemma: string | null;
  meaningVi: string | null;
  definitionEn: string | null;
  ipaUs: string | null;
  ipaUk: string | null;
  wordTypes: string[];
  synonyms: string[];
  collocations: string[];
  example: string | null;
  level: VocabularyCefrLevel | null;
  imageUrl: string | null;
}

interface ItemRow {
  id: string;
  term: string;
  lemma: string | null;
  meaning_vi: string | null;
  definition_en: string | null;
  ipa_us: string | null;
  ipa_uk: string | null;
  word_types: string[];
  synonyms: string[];
  collocations: string[];
  example: string | null;
  level: string | null;
  image_path: string | null;
}

const ITEM_SELECT = `
  id,
  term,
  lemma,
  meaning_vi,
  definition_en,
  ipa_us,
  ipa_uk,
  word_types,
  synonyms,
  collocations,
  example,
  level,
  image_path
`;

function mapSummaryRow(row: ItemRow): VocabularySummaryItem {
  return {
    id: row.id,
    term: row.term,
    lemma: row.lemma,
    meaningVi: row.meaning_vi,
    definitionEn: row.definition_en,
    ipaUs: row.ipa_us,
    ipaUk: row.ipa_uk,
    wordTypes: row.word_types ?? [],
    synonyms: row.synonyms ?? [],
    collocations: row.collocations ?? [],
    example: row.example,
    level: parseVocabularyCefrLevel(row.level),
    imageUrl: row.image_path
      ? buildPublicAssetUrlForBucket(IMAGES_BUCKET, row.image_path)
      : null,
  };
}

function mapLoadedRow(row: ItemRow): LoadedVocabularyItem {
  return mapSummaryRow(row);
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

async function loadItemRowsByIds(
  supabase: SupabaseClient,
  deckId: string,
  itemIds: string[],
): Promise<ItemRow[]> {
  if (itemIds.length === 0) return [];

  const { data, error } = await supabase
    .from("vocabulary_items")
    .select(ITEM_SELECT)
    .eq("deck_id", deckId)
    .in("id", itemIds)
    .order("term", { ascending: true });

  if (error) throw error;

  const rows = (data ?? []) as ItemRow[];
  const rowById = new Map(rows.map((row) => [row.id, row]));

  return itemIds
    .map((id) => rowById.get(id))
    .filter((row): row is ItemRow => row != null);
}

export async function loadDeckVocabularySummary(
  supabase: SupabaseClient,
  deckId: string,
): Promise<VocabularySummaryItem[]> {
  const { data, error } = await supabase
    .from("vocabulary_items")
    .select(ITEM_SELECT)
    .eq("deck_id", deckId)
    .order("term", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as ItemRow[]).map(mapSummaryRow);
}

export async function countDeckVocabulary(
  supabase: SupabaseClient,
  deckId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("vocabulary_items")
    .select("id", { count: "exact", head: true })
    .eq("deck_id", deckId);

  if (error) throw error;
  return count ?? 0;
}

export async function loadDeckVocabularySession(
  supabase: SupabaseClient,
  deckId: string,
  sessionCount: number,
  userId?: string | null,
): Promise<LoadedVocabularyItem[]> {
  const selectedIds = await selectDeckVocabularySessionIds(
    supabase,
    deckId,
    sessionCount,
    userId,
  );

  return loadDeckVocabularyByIds(supabase, deckId, selectedIds);
}

export async function loadDeckVocabularyByIds(
  supabase: SupabaseClient,
  deckId: string,
  ids: string[],
): Promise<LoadedVocabularyItem[]> {
  const rows = await loadItemRowsByIds(supabase, deckId, ids);
  return rows.map(mapLoadedRow);
}

interface CardProgressDueRow {
  vocabulary_item_id: string;
  due_at: string;
}

/**
 * Item IDs in a deck that are due for review (matches learning-reminder rules:
 * previously reviewed, not "new", due_at <= now).
 */
export async function loadDueVocabularyItemIds(
  supabase: SupabaseClient,
  deckId: string,
  userId: string,
): Promise<string[]> {
  const { data: items, error: itemsError } = await supabase
    .from("vocabulary_items")
    .select("id")
    .eq("deck_id", deckId);

  if (itemsError) throw itemsError;

  const allIds = (items ?? []).map((row) => row.id as string);
  if (allIds.length === 0) return [];

  const nowIso = new Date().toISOString();
  const { data: progressRows, error: progressError } = await supabase
    .from("vocabulary_card_progress")
    .select("vocabulary_item_id")
    .eq("user_id", userId)
    .in("vocabulary_item_id", allIds)
    .not("last_reviewed_at", "is", null)
    .neq("status", "new")
    .lte("due_at", nowIso);

  if (progressError) throw progressError;

  return (progressRows ?? []).map((row) => row.vocabulary_item_id as string);
}

export async function selectDeckVocabularySessionIds(
  supabase: SupabaseClient,
  deckId: string,
  sessionCount: number,
  userId?: string | null,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("vocabulary_items")
    .select("id")
    .eq("deck_id", deckId);

  if (error) throw error;

  const allIds = (data ?? []).map((row) => row.id as string);
  if (allIds.length === 0) return [];

  const limit = Math.min(sessionCount, allIds.length);

  if (!userId) {
    return shuffle(allIds).slice(0, limit);
  }

  const { data: progressRows, error: progressError } = await supabase
    .from("vocabulary_card_progress")
    .select("vocabulary_item_id, due_at")
    .eq("user_id", userId)
    .in("vocabulary_item_id", allIds);

  if (progressError) throw progressError;

  const dueAtByItemId = new Map<string, string>();
  for (const row of (progressRows ?? []) as CardProgressDueRow[]) {
    dueAtByItemId.set(row.vocabulary_item_id, row.due_at);
  }

  const now = Date.now();
  const dueIds: string[] = [];
  const notDueIds: { id: string; dueAt: number }[] = [];

  for (const id of allIds) {
    const dueAt = dueAtByItemId.get(id);
    if (!dueAt || Date.parse(dueAt) <= now) {
      dueIds.push(id);
      continue;
    }

    notDueIds.push({ id, dueAt: Date.parse(dueAt) });
  }

  const selected = shuffle(dueIds).slice(0, limit);

  if (selected.length >= limit) {
    return selected;
  }

  notDueIds.sort((a, b) => a.dueAt - b.dueAt);
  for (const entry of notDueIds) {
    if (selected.length >= limit) break;
    selected.push(entry.id);
  }

  return selected;
}

export async function loadDeckVocabulary(
  supabase: SupabaseClient,
  deckId: string,
): Promise<LoadedVocabularyItem[]> {
  const { data, error } = await supabase
    .from("vocabulary_items")
    .select(ITEM_SELECT)
    .eq("deck_id", deckId)
    .order("term", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as ItemRow[]).map(mapLoadedRow);
}

export interface LoadedVocabularyDeck {
  id: string;
  name: string;
  published: boolean;
  ownerId: string | null;
}

export function canAccessVocabularyDeck(
  deck: LoadedVocabularyDeck,
  userId?: string | null,
): boolean {
  if (deck.published) return true;
  if (userId != null && deck.ownerId === userId) return true;
  return false;
}

export function isOwnedVocabularyDeck(
  deck: LoadedVocabularyDeck,
  userId?: string | null,
): boolean {
  return userId != null && deck.ownerId === userId;
}

export async function loadDeckById(
  supabase: SupabaseClient,
  deckId: string,
): Promise<LoadedVocabularyDeck | null> {
  const { data, error } = await supabase
    .from("vocabulary_decks")
    .select("id, name, published, owner_id")
    .eq("id", deckId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id as string,
    name: data.name as string,
    published: data.published as boolean,
    ownerId: (data.owner_id as string | null) ?? null,
  };
}
