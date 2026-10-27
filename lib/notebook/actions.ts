"use server";

import { copy } from "@/lib/copy/vi";
import { dictionaryLookupError } from "@/lib/dictionary/dictionary-lookup-log";
import { formatDictionaryNoteBody } from "@/lib/dictionary/format-dictionary-note-body";
import {
  getDictionaryLookupCache,
  setDictionaryLookupCache,
} from "@/lib/dictionary/dictionary-lookup-cache";
import { lookupAiDictionaryWord } from "@/lib/dictionary/lookup-ai-word";
import { normalizeLookupCacheKey } from "@/lib/dictionary/normalize-lookup-cache-key";
import {
  fetchMinhqndLookup,
  normalizeMinhqndEnglishVi,
} from "@/lib/dictionary/lookup-minhqnd";
import { isNoteBodyEmpty } from "@/lib/notebook/note-body";
import {
  fetchNotesForWord,
  fetchNotebookPageById,
  findWordEntryByNormalizedWord,
  getDefaultNotebook,
  listUserNotebooks,
} from "@/lib/notebook/fetch-notebook";
import type { NotebookListItem, NotebookNoteItem, NotebookPageData } from "@/lib/notebook/types";
import type {
  AddNotebookNotePayload,
  NotebookNoteSource,
  UpdateNotebookNotePayload,
} from "@/lib/notebook/types";
import { normalizeNotebookTags } from "@/lib/notebook/validate-tags";
import { UserAccessError, requireUserSession } from "@/lib/learning/require-user";
import type { VocabularyItemPayload } from "@/lib/vocabulary/vocabulary-item-payload";

export type NotebookActionResult =
  | { ok: true; noteId?: string }
  | { ok: false; error: string };

export type NotebookSummaryResult =
  | { ok: true; notebook: { id: string; name: string } | null }
  | { ok: false; error: string };

export type CreateNotebookResult =
  | { ok: true; notebookId: string; name: string }
  | { ok: false; error: string };

export type NotebookListResult =
  | { ok: true; notebooks: NotebookListItem[] }
  | { ok: false; error: string };

export type WordNotesResult =
  | { ok: true; notes: NotebookNoteItem[] }
  | { ok: false; error: string };

export type NotebookPageDataResult =
  | { ok: true; data: NotebookPageData }
  | { ok: false; error: string };

export type DictionaryLookupResult =
  | { ok: true; body: string }
  | { ok: false; error: string };

export type AiDictionaryLookupActionResult =
  | { ok: true; body: string; payload: VocabularyItemPayload }
  | { ok: false; error: string };

/** @deprecated Use AiDictionaryLookupActionResult */
export type GeminiDictionaryLookupActionResult = AiDictionaryLookupActionResult;

async function upsertWordEntry(
  supabase: Awaited<ReturnType<typeof requireUserSession>>["supabase"],
  notebookId: string,
  word: string,
): Promise<{ ok: true; wordEntryId: string } | { ok: false; error: string }> {
  const trimmedWord = word.trim();
  const existing = await findWordEntryByNormalizedWord(
    supabase,
    notebookId,
    trimmedWord,
  );

  if (existing) {
    const { error } = await supabase
      .from("notebook_word_entries")
      .update({ word: trimmedWord, updated_at: new Date().toISOString() })
      .eq("id", existing.id);

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true, wordEntryId: existing.id };
  }

  const { data, error } = await supabase
    .from("notebook_word_entries")
    .insert({
      notebook_id: notebookId,
      word: trimmedWord,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? copy.notebook.errors.saveFailed,
    };
  }

  return { ok: true, wordEntryId: data.id as string };
}

export async function fetchUserNotebooksList(): Promise<NotebookListResult> {
  try {
    const { supabase, user } = await requireUserSession();
    const rows = await listUserNotebooks(supabase, user.id);

    return {
      ok: true,
      notebooks: rows.map((row) => ({
        id: row.id,
        name: row.name,
        isDefault: row.is_default,
      })),
    };
  } catch (error) {
    if (error instanceof UserAccessError) {
      return { ok: false, error: copy.user.errors.notSignedIn };
    }

    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : copy.notebook.errors.saveFailed,
    };
  }
}

export async function fetchNotebookPageData(
  notebookId: string,
): Promise<NotebookPageDataResult> {
  try {
    const { supabase, user } = await requireUserSession();
    const trimmedNotebookId = notebookId.trim();

    if (!trimmedNotebookId) {
      return { ok: false, error: copy.notebook.errors.notebookRequired };
    }

    const data = await fetchNotebookPageById(
      supabase,
      user.id,
      trimmedNotebookId,
    );

    if (!data) {
      return { ok: false, error: copy.notebook.errors.saveFailed };
    }

    return { ok: true, data };
  } catch (error) {
    if (error instanceof UserAccessError) {
      return { ok: false, error: copy.user.errors.notSignedIn };
    }

    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : copy.notebook.errors.saveFailed,
    };
  }
}

export async function fetchNotebookWordNotes(
  notebookId: string,
  word: string,
): Promise<WordNotesResult> {
  try {
    const { supabase, user } = await requireUserSession();
    const trimmedNotebookId = notebookId.trim();
    const trimmedWord = word.trim();

    if (!trimmedNotebookId || !trimmedWord) {
      return { ok: true, notes: [] };
    }

    const { data: notebook, error: notebookError } = await supabase
      .from("notebooks")
      .select("id")
      .eq("id", trimmedNotebookId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (notebookError) {
      return { ok: false, error: notebookError.message };
    }
    if (!notebook) {
      return { ok: false, error: copy.notebook.errors.notebookRequired };
    }

    const notes = await fetchNotesForWord(
      supabase,
      trimmedNotebookId,
      trimmedWord,
    );

    return { ok: true, notes };
  } catch (error) {
    if (error instanceof UserAccessError) {
      return { ok: false, error: copy.user.errors.notSignedIn };
    }

    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : copy.notebook.errors.saveFailed,
    };
  }
}

export async function fetchDefaultNotebookSummary(): Promise<NotebookSummaryResult> {
  try {
    const { supabase, user } = await requireUserSession();
    const notebook = await getDefaultNotebook(supabase, user.id);
    return {
      ok: true,
      notebook: notebook
        ? { id: notebook.id, name: notebook.name }
        : null,
    };
  } catch (error) {
    if (error instanceof UserAccessError) {
      return { ok: false, error: copy.user.errors.notSignedIn };
    }

    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : copy.notebook.errors.saveFailed,
    };
  }
}

export async function createNotebook(
  name: string,
): Promise<CreateNotebookResult> {
  try {
    const { supabase, user } = await requireUserSession();
    const trimmedName = name.trim();

    if (!trimmedName) {
      return { ok: false, error: copy.notebook.errors.nameRequired };
    }

    const { count, error: countError } = await supabase
      .from("notebooks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (countError) {
      return { ok: false, error: countError.message };
    }

    const isFirstNotebook = (count ?? 0) === 0;

    const { data, error } = await supabase
      .from("notebooks")
      .insert({
        user_id: user.id,
        name: trimmedName,
        is_default: isFirstNotebook,
      })
      .select("id, name")
      .single();

    if (error || !data) {
      return {
        ok: false,
        error: error?.message ?? copy.notebook.errors.saveFailed,
      };
    }

    return {
      ok: true,
      notebookId: data.id as string,
      name: data.name as string,
    };
  } catch (error) {
    if (error instanceof UserAccessError) {
      return { ok: false, error: copy.user.errors.notSignedIn };
    }

    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : copy.notebook.errors.saveFailed,
    };
  }
}

export async function addNotebookNote(
  payload: AddNotebookNotePayload,
): Promise<NotebookActionResult> {
  try {
    const { supabase, user } = await requireUserSession();

    const trimmedWord = payload.word.trim();

    if (!trimmedWord) {
      return { ok: false, error: copy.notebook.errors.wordRequired };
    }
    if (isNoteBodyEmpty(payload.body)) {
      return { ok: false, error: copy.notebook.errors.noteRequired };
    }

    const trimmedBody = payload.body.trim();

    const tagResult = normalizeNotebookTags(payload.tags);
    if (!tagResult.ok) {
      return { ok: false, error: tagResult.error };
    }

    const notebookId = payload.notebookId.trim();
    if (!notebookId) {
      return { ok: false, error: copy.notebook.errors.notebookRequired };
    }

    const { data: notebook, error: notebookError } = await supabase
      .from("notebooks")
      .select("id")
      .eq("id", notebookId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (notebookError) {
      return { ok: false, error: notebookError.message };
    }
    if (!notebook) {
      return { ok: false, error: copy.notebook.errors.notebookRequired };
    }

    const wordEntryResult = await upsertWordEntry(
      supabase,
      notebookId,
      trimmedWord,
    );
    if (!wordEntryResult.ok) {
      return { ok: false, error: wordEntryResult.error };
    }

    const source: NotebookNoteSource = {
      ...payload.source,
      path: payload.source.path ?? "",
    };

    const { data, error } = await supabase
      .from("notebook_notes")
      .insert({
        word_entry_id: wordEntryResult.wordEntryId,
        body: trimmedBody,
        tags: tagResult.tags,
        source,
      })
      .select("id")
      .single();

    if (error || !data) {
      return {
        ok: false,
        error: error?.message ?? copy.notebook.errors.saveFailed,
      };
    }

    return { ok: true, noteId: data.id as string };
  } catch (error) {
    if (error instanceof UserAccessError) {
      return { ok: false, error: copy.user.errors.notSignedIn };
    }

    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : copy.notebook.errors.saveFailed,
    };
  }
}

export async function updateNotebookNote(
  payload: UpdateNotebookNotePayload,
): Promise<NotebookActionResult> {
  try {
    const { supabase } = await requireUserSession();

    const trimmedBody = payload.body.trim();
    if (isNoteBodyEmpty(trimmedBody)) {
      return { ok: false, error: copy.notebook.errors.noteRequired };
    }

    const tagResult = normalizeNotebookTags(payload.tags);
    if (!tagResult.ok) {
      return { ok: false, error: tagResult.error };
    }

    const { error } = await supabase
      .from("notebook_notes")
      .update({
        body: trimmedBody,
        tags: tagResult.tags,
      })
      .eq("id", payload.noteId);

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true, noteId: payload.noteId };
  } catch (error) {
    if (error instanceof UserAccessError) {
      return { ok: false, error: copy.user.errors.notSignedIn };
    }

    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : copy.notebook.errors.saveFailed,
    };
  }
}

export async function deleteNotebookNote(
  noteId: string,
): Promise<NotebookActionResult> {
  try {
    const { supabase } = await requireUserSession();

    const { data: note, error: fetchError } = await supabase
      .from("notebook_notes")
      .select("id, word_entry_id")
      .eq("id", noteId)
      .maybeSingle();

    if (fetchError) {
      return { ok: false, error: fetchError.message };
    }
    if (!note) {
      return { ok: true };
    }

    const noteRow = note as { id: string; word_entry_id: string };

    const { error: deleteError } = await supabase
      .from("notebook_notes")
      .delete()
      .eq("id", noteId);

    if (deleteError) {
      return { ok: false, error: deleteError.message };
    }

    const { count, error: countError } = await supabase
      .from("notebook_notes")
      .select("id", { count: "exact", head: true })
      .eq("word_entry_id", noteRow.word_entry_id);

    if (countError) {
      return { ok: false, error: countError.message };
    }

    if (count === 0) {
      const { error: wordDeleteError } = await supabase
        .from("notebook_word_entries")
        .delete()
        .eq("id", noteRow.word_entry_id);

      if (wordDeleteError) {
        return { ok: false, error: wordDeleteError.message };
      }
    }

    return { ok: true };
  } catch (error) {
    if (error instanceof UserAccessError) {
      return { ok: false, error: copy.user.errors.notSignedIn };
    }

    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : copy.notebook.errors.deleteFailed,
    };
  }
}

export async function lookupDictionaryWord(
  word: string,
): Promise<DictionaryLookupResult> {
  try {
    await requireUserSession();

    const trimmedWord = word.trim();
    if (!trimmedWord) {
      return { ok: false, error: copy.notebook.errors.wordRequired };
    }

    const response = await fetchMinhqndLookup(trimmedWord);
    const entry = normalizeMinhqndEnglishVi(response);

    if (!entry) {
      return { ok: false, error: copy.notebook.errors.lookupNotFound };
    }

    return {
      ok: true,
      body: formatDictionaryNoteBody(entry),
    };
  } catch (error) {
    if (error instanceof UserAccessError) {
      return { ok: false, error: copy.user.errors.notSignedIn };
    }

    return { ok: false, error: copy.notebook.errors.lookupFailed };
  }
}

/**
 * AI Tra cứu path (TRANSLATION_PROVIDER). Does not call MinhQND — client owns fallback.
 * Provider/API failures always map to a generic user-facing message (details stay in server logs).
 */
export async function lookupDictionaryWordWithAi(
  word: string,
  sentenceContext?: string | null,
): Promise<AiDictionaryLookupActionResult> {
  try {
    await requireUserSession();

    const trimmedWord = word.trim();
    if (!trimmedWord) {
      return { ok: false, error: copy.notebook.errors.wordRequired };
    }

    const cached = await getDictionaryLookupCache(trimmedWord, sentenceContext);
    if (cached) {
      return { ok: true, body: cached.body, payload: cached.payload };
    }

    const key = normalizeLookupCacheKey(trimmedWord, sentenceContext);
    const sentenceForAi = key?.sentence || null;
    const result = await lookupAiDictionaryWord(trimmedWord, sentenceForAi);
    await setDictionaryLookupCache(trimmedWord, sentenceContext, result.payload);
    return { ok: true, body: result.body, payload: result.payload };
  } catch (error) {
    if (error instanceof UserAccessError) {
      return { ok: false, error: copy.user.errors.notSignedIn };
    }

    dictionaryLookupError(
      "action_failed",
      { word: word.trim() },
      error,
    );

    // Do not return error.message — may contain provider/API details.
    return { ok: false, error: copy.notebook.errors.lookupFailed };
  }
}

/** @deprecated Use lookupDictionaryWordWithAi */
export const lookupDictionaryWordWithGemini = lookupDictionaryWordWithAi;
