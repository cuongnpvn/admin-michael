import { copy } from "@/lib/copy/vi";
import {
  isNotebookTagId,
  type NotebookNoteTagId,
} from "@/lib/notebook/tags";
import { NOTEBOOK_MAX_TAGS_PER_NOTE } from "@/lib/notebook/types";

export function normalizeNotebookTags(
  tags: string[],
): { ok: true; tags: NotebookNoteTagId[] } | { ok: false; error: string } {
  const unique: NotebookNoteTagId[] = [];

  for (const tag of tags) {
    if (!isNotebookTagId(tag)) {
      return { ok: false, error: copy.notebook.errors.saveFailed };
    }
    if (!unique.includes(tag)) {
      unique.push(tag);
    }
  }

  if (unique.length > NOTEBOOK_MAX_TAGS_PER_NOTE) {
    return { ok: false, error: copy.notebook.errors.tooManyTags };
  }

  return { ok: true, tags: unique };
}
