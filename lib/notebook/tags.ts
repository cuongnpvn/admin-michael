export const NOTEBOOK_NOTE_TAG_IDS = [
  "meaning",
  "example",
  "collocation",
  "expression",
  "grammar",
  "pronunciation",
  "usage",
  "tips",
] as const;

export type NotebookNoteTagId = (typeof NOTEBOOK_NOTE_TAG_IDS)[number];

export const NOTEBOOK_TAG_ID_SET = new Set<string>(NOTEBOOK_NOTE_TAG_IDS);

export function isNotebookTagId(value: string): value is NotebookNoteTagId {
  return NOTEBOOK_TAG_ID_SET.has(value);
}

export function formatNotebookTagDisplay(tagId: NotebookNoteTagId): string {
  return tagId;
}

export function formatNotebookTagToken(tagId: NotebookNoteTagId): string {
  return `#${tagId}`;
}
