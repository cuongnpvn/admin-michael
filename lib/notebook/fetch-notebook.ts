import type { SupabaseClient } from "@supabase/supabase-js";
import { copy } from "@/lib/copy/vi";
import { isNotebookTagId } from "@/lib/notebook/tags";
import type {
  NotebookNoteItem,
  NotebookNoteSource,
  NotebookPageData,
  NotebookWordEntry,
} from "@/lib/notebook/types";

interface NotebookRow {
  id: string;
  name: string;
}

interface WordEntryRow {
  id: string;
  word: string;
  updated_at: string;
}

interface NoteRow {
  id: string;
  word_entry_id: string;
  body: string;
  source: Record<string, unknown>;
  tags: string[] | null;
  created_at: string;
}

function mapSource(raw: Record<string, unknown>): NotebookNoteSource {
  return {
    path: typeof raw.path === "string" ? raw.path : "",
    bookId: typeof raw.bookId === "string" ? raw.bookId : undefined,
    testId: typeof raw.testId === "string" ? raw.testId : undefined,
    section:
      raw.section === "reading" ||
      raw.section === "listening" ||
      raw.section === "vocabulary" ||
      raw.section === "exam" ||
      raw.section === "other"
        ? raw.section
        : undefined,
    part: typeof raw.part === "number" ? raw.part : undefined,
    setId: typeof raw.setId === "string" ? raw.setId : undefined,
    groupId: typeof raw.groupId === "string" ? raw.groupId : undefined,
    questionNumber:
      typeof raw.questionNumber === "number" ? raw.questionNumber : undefined,
    label: typeof raw.label === "string" ? raw.label : undefined,
  };
}

function mapNote(row: NoteRow): NotebookNoteItem {
  return {
    id: row.id,
    body: row.body,
    tags: (row.tags ?? []).filter(isNotebookTagId),
    source: mapSource(row.source ?? {}),
    createdAt: row.created_at,
  };
}

interface NotebookListRow {
  id: string;
  name: string;
  is_default: boolean;
}

export async function listUserNotebooks(
  supabase: SupabaseClient,
  userId: string,
): Promise<NotebookListRow[]> {
  const { data, error } = await supabase
    .from("notebooks")
    .select("id, name, is_default")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("name", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as NotebookListRow[];
}

export async function getDefaultNotebook(
  supabase: SupabaseClient,
  userId: string,
): Promise<NotebookRow | null> {
  const { data, error } = await supabase
    .from("notebooks")
    .select("id, name")
    .eq("user_id", userId)
    .eq("is_default", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

async function fetchNotebookEntriesForNotebook(
  supabase: SupabaseClient,
  notebook: NotebookRow,
): Promise<NotebookPageData> {
  const { data: wordRows, error: wordError } = await supabase
    .from("notebook_word_entries")
    .select("id, word, updated_at")
    .eq("notebook_id", notebook.id)
    .order("updated_at", { ascending: false });

  if (wordError) {
    throw new Error(wordError.message);
  }

  const entries = (wordRows ?? []) as WordEntryRow[];
  if (entries.length === 0) {
    return {
      notebookId: notebook.id,
      notebookName: notebook.name,
      entries: [],
    };
  }

  const wordEntryIds = entries.map((entry) => entry.id);
  const { data: noteRows, error: noteError } = await supabase
    .from("notebook_notes")
    .select("id, word_entry_id, body, source, tags, created_at")
    .in("word_entry_id", wordEntryIds)
    .order("created_at", { ascending: false });

  if (noteError) {
    throw new Error(noteError.message);
  }

  const notesByWordId = new Map<string, NotebookNoteItem[]>();
  for (const row of (noteRows ?? []) as NoteRow[]) {
    const list = notesByWordId.get(row.word_entry_id) ?? [];
    list.push(mapNote(row));
    notesByWordId.set(row.word_entry_id, list);
  }

  const mappedEntries: NotebookWordEntry[] = entries.map((entry) => ({
    id: entry.id,
    word: entry.word,
    notes: notesByWordId.get(entry.id) ?? [],
    updatedAt: entry.updated_at,
  }));

  mappedEntries.sort((a, b) => {
    const aLatest = a.notes[0]?.createdAt ?? a.updatedAt;
    const bLatest = b.notes[0]?.createdAt ?? b.updatedAt;
    return bLatest.localeCompare(aLatest);
  });

  return {
    notebookId: notebook.id,
    notebookName: notebook.name,
    entries: mappedEntries,
  };
}

export async function fetchNotebookPageById(
  supabase: SupabaseClient,
  userId: string,
  notebookId: string,
): Promise<NotebookPageData | null> {
  const { data, error } = await supabase
    .from("notebooks")
    .select("id, name")
    .eq("id", notebookId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return fetchNotebookEntriesForNotebook(supabase, data);
}

export async function fetchNotebookPage(
  supabase: SupabaseClient,
  userId: string,
): Promise<NotebookPageData | null> {
  const notebook = await getDefaultNotebook(supabase, userId);
  if (!notebook) {
    return null;
  }

  return fetchNotebookEntriesForNotebook(supabase, notebook);
}

export async function ensureDefaultNotebookRecord(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ ok: true; notebookId: string } | { ok: false; error: string }> {
  const existing = await getDefaultNotebook(supabase, userId);
  if (existing) {
    return { ok: true, notebookId: existing.id };
  }

  const { data, error } = await supabase
    .from("notebooks")
    .insert({
      user_id: userId,
      name: copy.notebook.defaultName,
      is_default: true,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? copy.notebook.errors.saveFailed,
    };
  }

  return { ok: true, notebookId: data.id as string };
}

export async function findWordEntryByNormalizedWord(
  supabase: SupabaseClient,
  notebookId: string,
  word: string,
): Promise<{ id: string } | null> {
  const normalized = word.trim().toLowerCase();
  const { data: rows, error } = await supabase
    .from("notebook_word_entries")
    .select("id, word")
    .eq("notebook_id", notebookId);

  if (error || !rows) {
    return null;
  }

  const match = rows.find(
    (row) => row.word.trim().toLowerCase() === normalized,
  );
  return match ? { id: match.id } : null;
}

export async function fetchNotesForWord(
  supabase: SupabaseClient,
  notebookId: string,
  word: string,
): Promise<NotebookNoteItem[]> {
  const entry = await findWordEntryByNormalizedWord(
    supabase,
    notebookId,
    word,
  );
  if (!entry) {
    return [];
  }

  const { data, error } = await supabase
    .from("notebook_notes")
    .select("id, word_entry_id, body, source, tags, created_at")
    .eq("word_entry_id", entry.id)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return (data as NoteRow[]).map(mapNote);
}
