"use server";

import { updateTag } from "next/cache";
import { enrichVocabularyDeckFromTerms } from "@/lib/admin/gemini/extract-vocabulary-from-pdf";
import { isRetryableGeminiError } from "@/lib/admin/gemini/is-retryable-gemini-error";
import { importVocabularyJsonFromRaw } from "@/lib/admin/vocabulary/import-vocabulary-json";
import { copy } from "@/lib/copy/vi";
import type { ContentVocabularyWord } from "@/lib/content/content-vocabulary";
import { UserAccessError, requireUserSession } from "@/lib/learning/require-user";
import { limitVocabularyDeckRegenerateTerms } from "@/lib/vocabulary/regenerate-limits";
import type { VocabularyItemPayload } from "@/lib/vocabulary/vocabulary-item-payload";

export type UserDeckActionResult =
  | { ok: true; deckId: string }
  | { ok: false; error: string };

export type UserItemActionResult =
  | { ok: true; itemId?: string }
  | { ok: false; error: string };

function accessErrorMessage(code: string): string {
  if (code === "not_signed_in") {
    return copy.vocab.manage.errors.notSignedIn;
  }
  return copy.vocab.manage.errors.generic;
}

function revalidateUserVocabularyPaths(_deckId?: string): void {}

function revalidatePublicCatalog(): void {
  updateTag("vocabulary-catalog");
}

async function assertOwnedDeck(
  supabase: Awaited<ReturnType<typeof requireUserSession>>["supabase"],
  userId: string,
  deckId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await supabase
    .from("vocabulary_decks")
    .select("id, owner_id")
    .eq("id", deckId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!data || data.owner_id !== userId) {
    return { ok: false, error: copy.vocab.manage.errors.notOwner };
  }

  return { ok: true };
}

export async function createUserVocabularyDeck(
  name: string,
): Promise<UserDeckActionResult> {
  try {
    const { supabase, user } = await requireUserSession();
    const trimmed = name.trim();

    if (!trimmed) {
      return { ok: false, error: copy.vocab.manage.errors.nameRequired };
    }

    const { data, error } = await supabase
      .from("vocabulary_decks")
      .insert({
        name: trimmed,
        published: false,
        owner_id: user.id,
      })
      .select("id")
      .single();

    if (error) throw error;

    revalidateUserVocabularyPaths(data.id as string);
    return { ok: true, deckId: data.id as string };
  } catch (error) {
    if (error instanceof UserAccessError) {
      return { ok: false, error: accessErrorMessage(error.message) };
    }
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : copy.vocab.manage.errors.generic,
    };
  }
}

export async function renameUserVocabularyDeck(
  deckId: string,
  name: string,
): Promise<UserDeckActionResult> {
  try {
    const { supabase, user } = await requireUserSession();
    const trimmed = name.trim();

    if (!trimmed) {
      return { ok: false, error: copy.vocab.manage.errors.nameRequired };
    }

    const owned = await assertOwnedDeck(supabase, user.id, deckId);
    if (!owned.ok) return { ok: false, error: owned.error };

    const { error } = await supabase
      .from("vocabulary_decks")
      .update({ name: trimmed })
      .eq("id", deckId)
      .eq("owner_id", user.id);

    if (error) throw error;

    revalidateUserVocabularyPaths(deckId);
    revalidatePublicCatalog();
    return { ok: true, deckId };
  } catch (error) {
    if (error instanceof UserAccessError) {
      return { ok: false, error: accessErrorMessage(error.message) };
    }
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : copy.vocab.manage.errors.generic,
    };
  }
}

export async function setUserVocabularyDeckPublished(
  deckId: string,
  published: boolean,
): Promise<UserDeckActionResult> {
  try {
    const { supabase, user } = await requireUserSession();

    const owned = await assertOwnedDeck(supabase, user.id, deckId);
    if (!owned.ok) return { ok: false, error: owned.error };

    const { error } = await supabase
      .from("vocabulary_decks")
      .update({ published })
      .eq("id", deckId)
      .eq("owner_id", user.id);

    if (error) throw error;

    revalidateUserVocabularyPaths(deckId);
    revalidatePublicCatalog();
    return { ok: true, deckId };
  } catch (error) {
    if (error instanceof UserAccessError) {
      return { ok: false, error: accessErrorMessage(error.message) };
    }
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : copy.vocab.manage.errors.generic,
    };
  }
}

export async function deleteUserVocabularyDeck(
  deckId: string,
): Promise<UserDeckActionResult> {
  try {
    const { supabase, user } = await requireUserSession();

    const owned = await assertOwnedDeck(supabase, user.id, deckId);
    if (!owned.ok) return { ok: false, error: owned.error };

    const { data: existing } = await supabase
      .from("vocabulary_decks")
      .select("published")
      .eq("id", deckId)
      .maybeSingle();

    const { error } = await supabase
      .from("vocabulary_decks")
      .delete()
      .eq("id", deckId)
      .eq("owner_id", user.id);

    if (error) throw error;

    revalidateUserVocabularyPaths();
    if (existing?.published) {
      revalidatePublicCatalog();
    }
    return { ok: true, deckId };
  } catch (error) {
    if (error instanceof UserAccessError) {
      return { ok: false, error: accessErrorMessage(error.message) };
    }
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : copy.vocab.manage.errors.generic,
    };
  }
}

export async function createUserVocabularyItem(
  deckId: string,
  payload: VocabularyItemPayload,
): Promise<UserItemActionResult> {
  try {
    const { supabase, user } = await requireUserSession();
    const term = payload.term.trim();

    if (!term) {
      return { ok: false, error: copy.vocab.manage.errors.termRequired };
    }

    const owned = await assertOwnedDeck(supabase, user.id, deckId);
    if (!owned.ok) return { ok: false, error: owned.error };

    const { data, error } = await supabase
      .from("vocabulary_items")
      .insert({
        deck_id: deckId,
        term,
        lemma: payload.lemma?.trim() || null,
        meaning_vi: payload.meaningVi?.trim() || null,
        definition_en: payload.definitionEn?.trim() || null,
        ipa_us: payload.ipaUs?.trim() || null,
        ipa_uk: payload.ipaUk?.trim() || null,
        word_types: payload.wordTypes,
        synonyms: payload.synonyms,
        collocations: payload.collocations,
        example: payload.example?.trim() || null,
        level: payload.level,
      })
      .select("id")
      .single();

    if (error) throw error;

    revalidateUserVocabularyPaths(deckId);
    revalidatePublicCatalog();
    return { ok: true, itemId: data.id as string };
  } catch (error) {
    if (error instanceof UserAccessError) {
      return { ok: false, error: accessErrorMessage(error.message) };
    }
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : copy.vocab.manage.errors.generic,
    };
  }
}

export async function updateUserVocabularyItem(
  itemId: string,
  deckId: string,
  payload: VocabularyItemPayload,
): Promise<UserItemActionResult> {
  try {
    const { supabase, user } = await requireUserSession();
    const term = payload.term.trim();

    if (!term) {
      return { ok: false, error: copy.vocab.manage.errors.termRequired };
    }

    const owned = await assertOwnedDeck(supabase, user.id, deckId);
    if (!owned.ok) return { ok: false, error: owned.error };

    const { error } = await supabase
      .from("vocabulary_items")
      .update({
        term,
        lemma: payload.lemma?.trim() || null,
        meaning_vi: payload.meaningVi?.trim() || null,
        definition_en: payload.definitionEn?.trim() || null,
        ipa_us: payload.ipaUs?.trim() || null,
        ipa_uk: payload.ipaUk?.trim() || null,
        word_types: payload.wordTypes,
        synonyms: payload.synonyms,
        collocations: payload.collocations,
        example: payload.example?.trim() || null,
        level: payload.level,
      })
      .eq("id", itemId)
      .eq("deck_id", deckId);

    if (error) throw error;

    revalidateUserVocabularyPaths(deckId);
    return { ok: true, itemId };
  } catch (error) {
    if (error instanceof UserAccessError) {
      return { ok: false, error: accessErrorMessage(error.message) };
    }
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : copy.vocab.manage.errors.generic,
    };
  }
}

export async function deleteUserVocabularyItem(
  itemId: string,
  deckId: string,
): Promise<UserItemActionResult> {
  try {
    const { supabase, user } = await requireUserSession();

    const owned = await assertOwnedDeck(supabase, user.id, deckId);
    if (!owned.ok) return { ok: false, error: owned.error };

    const { error } = await supabase
      .from("vocabulary_items")
      .delete()
      .eq("id", itemId)
      .eq("deck_id", deckId);

    if (error) throw error;

    revalidateUserVocabularyPaths(deckId);
    revalidatePublicCatalog();
    return { ok: true };
  } catch (error) {
    if (error instanceof UserAccessError) {
      return { ok: false, error: accessErrorMessage(error.message) };
    }
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : copy.vocab.manage.errors.generic,
    };
  }
}

export async function exportVocabularyDeck(
  sourceDeckId: string,
  newName?: string,
): Promise<UserDeckActionResult> {
  try {
    const { supabase, user } = await requireUserSession();

    const { data: source, error: sourceError } = await supabase
      .from("vocabulary_decks")
      .select("id, owner_id, published")
      .eq("id", sourceDeckId)
      .maybeSingle();

    if (sourceError) throw sourceError;

    if (
      !source ||
      source.owner_id == null ||
      source.owner_id === user.id ||
      !source.published
    ) {
      return {
        ok: false,
        error: copy.vocab.manage.errors.exportNotAllowed,
      };
    }

    const { data, error } = await supabase.rpc("export_vocabulary_deck", {
      p_source_deck_id: sourceDeckId,
      p_new_name: newName?.trim() || null,
    });

    if (error) throw error;

    const deckId = data as string;
    revalidateUserVocabularyPaths(deckId);
    return { ok: true, deckId };
  } catch (error) {
    if (error instanceof UserAccessError) {
      return { ok: false, error: accessErrorMessage(error.message) };
    }
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : copy.vocab.manage.errors.exportFailed,
    };
  }
}

export interface MyVocabularyDeckOption {
  id: string;
  name: string;
}

export type ListMyVocabularyDecksResult =
  | { ok: true; decks: MyVocabularyDeckOption[] }
  | { ok: false; error: string };

export type AddContentWordResult =
  | { ok: true; itemId?: string; alreadyExists?: boolean; deckId: string }
  | { ok: false; error: string };

function contentWordToPayload(
  word: ContentVocabularyWord,
): VocabularyItemPayload {
  const wordType = word.wordType.trim();
  return {
    term: word.term,
    lemma: null,
    meaningVi: word.meaningVi.trim() || null,
    definitionEn: word.definitionEn.trim() || null,
    ipaUs: word.ipa[0]?.trim() || null,
    ipaUk: word.ipa[1]?.trim() || null,
    wordTypes: wordType ? [wordType] : [],
    synonyms: [],
    collocations: [],
    example: word.example.trim() || null,
    level: word.level,
  };
}

function isUniqueTermConflict(error: { code?: string; message?: string }): boolean {
  if (error.code === "23505") return true;
  const message = error.message?.toLowerCase() ?? "";
  return message.includes("vocabulary_items_deck_term_key");
}

export async function listMyVocabularyDecks(): Promise<ListMyVocabularyDecksResult> {
  try {
    const { supabase, user } = await requireUserSession();

    const { data, error } = await supabase
      .from("vocabulary_decks")
      .select("id, name")
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    return {
      ok: true,
      decks: (data ?? []).map((deck) => ({
        id: deck.id as string,
        name: deck.name as string,
      })),
    };
  } catch (error) {
    if (error instanceof UserAccessError) {
      return { ok: false, error: accessErrorMessage(error.message) };
    }
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : copy.vocab.manage.errors.generic,
    };
  }
}

export async function addVocabularyPayloadToUserDeck(
  deckId: string,
  payload: VocabularyItemPayload,
): Promise<AddContentWordResult> {
  try {
    const { supabase, user } = await requireUserSession();
    const term = payload.term.trim();

    if (!term) {
      return { ok: false, error: copy.vocab.manage.errors.termRequired };
    }

    const owned = await assertOwnedDeck(supabase, user.id, deckId);
    if (!owned.ok) return { ok: false, error: owned.error };

    const { data: existing, error: existingError } = await supabase
      .from("vocabulary_items")
      .select("id")
      .eq("deck_id", deckId)
      .ilike("term", term)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing?.id) {
      return {
        ok: true,
        alreadyExists: true,
        itemId: existing.id as string,
        deckId,
      };
    }

    const { data, error } = await supabase
      .from("vocabulary_items")
      .insert({
        deck_id: deckId,
        term,
        lemma: payload.lemma?.trim() || null,
        meaning_vi: payload.meaningVi?.trim() || null,
        definition_en: payload.definitionEn?.trim() || null,
        ipa_us: payload.ipaUs?.trim() || null,
        ipa_uk: payload.ipaUk?.trim() || null,
        word_types: payload.wordTypes,
        synonyms: payload.synonyms,
        collocations: payload.collocations,
        example: payload.example?.trim() || null,
        level: payload.level,
      })
      .select("id")
      .single();

    if (error) {
      if (isUniqueTermConflict(error)) {
        return { ok: true, alreadyExists: true, deckId };
      }
      throw error;
    }

    revalidateUserVocabularyPaths(deckId);
    revalidatePublicCatalog();
    return { ok: true, itemId: data.id as string, deckId };
  } catch (error) {
    if (error instanceof UserAccessError) {
      return { ok: false, error: accessErrorMessage(error.message) };
    }
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : copy.vocab.quickAdd.errors.generic,
    };
  }
}

export async function addContentWordToUserDeck(
  deckId: string,
  word: ContentVocabularyWord,
): Promise<AddContentWordResult> {
  return addVocabularyPayloadToUserDeck(deckId, contentWordToPayload(word));
}

export async function createDeckAndAddVocabularyPayload(
  name: string,
  payload: VocabularyItemPayload,
): Promise<AddContentWordResult> {
  const createResult = await createUserVocabularyDeck(name);
  if (!createResult.ok) {
    return { ok: false, error: createResult.error };
  }

  return addVocabularyPayloadToUserDeck(createResult.deckId, payload);
}

export async function createDeckAndAddContentWord(
  name: string,
  word: ContentVocabularyWord,
): Promise<AddContentWordResult> {
  return createDeckAndAddVocabularyPayload(name, contentWordToPayload(word));
}

export type RegenerateUserVocabularyDeckResult =
  | { ok: true; wordCount: number }
  | { ok: false; error: string };

function mapRegenerateError(error: unknown): string {
  if (error instanceof UserAccessError) {
    return accessErrorMessage(error.message);
  }

  const message = error instanceof Error ? error.message : String(error);
  if (message === "empty_deck") {
    return copy.vocab.manage.errors.emptyDeck;
  }
  if (/GEMINI_API_KEY/i.test(message)) {
    return copy.vocab.manage.errors.geminiMissingApiKey;
  }
  if (isRetryableGeminiError(error)) {
    return copy.vocab.manage.errors.geminiRateLimited;
  }
  return copy.vocab.manage.errors.generic;
}

export type ExtractUserVocabularyDeckTermsResult =
  | { ok: true; deckId: string; deckName: string; terms: string[] }
  | { ok: false; error: string };

export async function extractUserVocabularyDeckTerms(
  deckId: string,
): Promise<ExtractUserVocabularyDeckTermsResult> {
  try {
    const { supabase, user } = await requireUserSession();

    const { data: deck, error: deckError } = await supabase
      .from("vocabulary_decks")
      .select("id, name, owner_id")
      .eq("id", deckId)
      .maybeSingle();

    if (deckError) throw deckError;
    if (!deck || deck.owner_id !== user.id) {
      return { ok: false, error: copy.vocab.manage.errors.notOwner };
    }

    const { data, error } = await supabase
      .from("vocabulary_items")
      .select("term")
      .eq("deck_id", deckId)
      .order("term", { ascending: true });

    if (error) throw error;

    const terms = limitVocabularyDeckRegenerateTerms(
      (data ?? [])
        .map((row) => (typeof row.term === "string" ? row.term.trim() : ""))
        .filter(Boolean),
    );

    if (terms.length === 0) {
      return { ok: false, error: copy.vocab.manage.errors.emptyDeck };
    }

    return {
      ok: true,
      deckId: deck.id as string,
      deckName: deck.name as string,
      terms,
    };
  } catch (error) {
    return { ok: false, error: mapRegenerateError(error) };
  }
}

export type EnrichUserVocabularyDeckTermsResult =
  | { ok: true; vocabularyJson: string }
  | { ok: false; error: string };

export async function enrichUserVocabularyDeckTerms(
  deckName: string,
  terms: string[],
): Promise<EnrichUserVocabularyDeckTermsResult> {
  try {
    await requireUserSession();
    const vocabularyJson = await enrichVocabularyDeckFromTerms(
      deckName,
      limitVocabularyDeckRegenerateTerms(terms),
    );
    return { ok: true, vocabularyJson };
  } catch (error) {
    return { ok: false, error: mapRegenerateError(error) };
  }
}

export type ImportUserVocabularyDeckJsonResult =
  | { ok: true; wordCount: number }
  | { ok: false; error: string };

export async function importUserVocabularyDeckJson(
  deckId: string,
  deckName: string,
  vocabularyJson: string,
): Promise<ImportUserVocabularyDeckJsonResult> {
  try {
    const { supabase, user } = await requireUserSession();

    const owned = await assertOwnedDeck(supabase, user.id, deckId);
    if (!owned.ok) return { ok: false, error: owned.error };

    const summary = await importVocabularyJsonFromRaw(
      supabase,
      deckId,
      deckName,
      vocabularyJson,
    );

    revalidateUserVocabularyPaths(deckId);
    revalidatePublicCatalog();

    return { ok: true, wordCount: summary.wordCount };
  } catch (error) {
    return { ok: false, error: mapRegenerateError(error) };
  }
}

export async function regenerateUserVocabularyDeck(
  deckId: string,
): Promise<RegenerateUserVocabularyDeckResult> {
  try {
    const extracted = await extractUserVocabularyDeckTerms(deckId);
    if (!extracted.ok) return extracted;

    const enriched = await enrichUserVocabularyDeckTerms(
      extracted.deckName,
      extracted.terms,
    );
    if (!enriched.ok) return enriched;

    return importUserVocabularyDeckJson(
      extracted.deckId,
      extracted.deckName,
      enriched.vocabularyJson,
    );
  } catch (error) {
    return { ok: false, error: mapRegenerateError(error) };
  }
}
