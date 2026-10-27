import type { Editor } from "@tiptap/react";
import { extractActiveTagQuery } from "@/lib/notebook/tag-query";

export type EditorTagQuery = {
  from: number;
  to: number;
  query: string;
};

export function findActiveTagQueryInEditor(
  editor: Editor,
): EditorTagQuery | null {
  const { from: cursor, empty } = editor.state.selection;
  if (!empty) {
    return null;
  }

  const blockStart = editor.state.selection.$from.start();
  const textBefore = editor.state.doc.textBetween(blockStart, cursor);
  const active = extractActiveTagQuery(textBefore, textBefore.length);

  if (!active) {
    return null;
  }

  return {
    from: blockStart + active.start,
    to: cursor,
    query: active.query,
  };
}

export function getEditorTagQueryCoords(
  editor: Editor,
  from: number,
): { top: number; left: number } {
  const coords = editor.view.coordsAtPos(from);
  return { top: coords.bottom + 4, left: coords.left };
}
