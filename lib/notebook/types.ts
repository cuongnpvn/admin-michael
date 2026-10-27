import type { NotebookNoteTagId } from "@/lib/notebook/tags";

export type NotebookNoteSourceSection =
  | "reading"
  | "listening"
  | "vocabulary"
  | "exam"
  | "other";

export type NotebookNoteSource = {
  path: string;
  bookId?: string;
  testId?: string;
  bookName?: string;
  testLabel?: string;
  section?: NotebookNoteSourceSection;
  part?: number;
  setId?: string;
  groupId?: string;
  questionNumber?: number;
  vocabularyItemId?: string;
  deckId?: string;
  deckName?: string;
  label?: string;
};

export type NotebookNoteItem = {
  id: string;
  body: string;
  tags: NotebookNoteTagId[];
  source: NotebookNoteSource;
  createdAt: string;
};

export type NotebookWordEntry = {
  id: string;
  word: string;
  notes: NotebookNoteItem[];
  updatedAt: string;
};

export type NotebookPageData = {
  notebookId: string;
  notebookName: string;
  entries: NotebookWordEntry[];
};

export type NotebookListItem = {
  id: string;
  name: string;
  isDefault: boolean;
};

export type AddNotebookNotePayload = {
  notebookId: string;
  word: string;
  body: string;
  tags: NotebookNoteTagId[];
  source: NotebookNoteSource;
};

export type UpdateNotebookNotePayload = {
  noteId: string;
  body: string;
  tags: NotebookNoteTagId[];
};

export const NOTEBOOK_MAX_TAGS_PER_NOTE = 2;

export const NOTEBOOK_SELECTABLE_ATTR = "data-notebook-selectable";
