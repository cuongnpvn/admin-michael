"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TextSelectionMenuState } from "@/components/notebook/text-selection-menu";
import { NOTEBOOK_SELECTABLE_ATTR } from "@/lib/notebook/types";
import { normalizePassageReferenceText } from "@/lib/reading/passage-highlight-dom";

const DRAG_THRESHOLD_PX = 4;

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

function isNotebookBlocked(): boolean {
  const tool = document.documentElement.getAttribute("data-passage-annotator-tool");
  return tool === "pen" || tool === "text" || tool === "eraser";
}

export function findSelectableRoot(node: EventTarget | null): HTMLElement | null {
  if (!(node instanceof Node)) return null;
  const element =
    node instanceof HTMLElement ? node : node.parentElement;
  return element?.closest(`[${NOTEBOOK_SELECTABLE_ATTR}]`) ?? null;
}

function isWordChar(char: string): boolean {
  return /[\p{L}\p{N}'-]/u.test(char);
}

function expandRangeToWord(range: Range): void {
  if (range.startContainer !== range.endContainer) {
    return;
  }

  if (range.startContainer.nodeType !== Node.TEXT_NODE) {
    return;
  }

  const textNode = range.startContainer as Text;
  const text = textNode.textContent ?? "";
  let start = range.startOffset;
  let end = range.endOffset;

  while (start > 0 && isWordChar(text[start - 1]!)) {
    start -= 1;
  }
  while (end < text.length && isWordChar(text[end]!)) {
    end += 1;
  }

  if (start === end) {
    return;
  }

  range.setStart(textNode, start);
  range.setEnd(textNode, end);
}

function caretRangeFromPoint(clientX: number, clientY: number): Range | null {
  if (document.caretRangeFromPoint) {
    return document.caretRangeFromPoint(clientX, clientY);
  }

  const caretPosition = document.caretPositionFromPoint?.(clientX, clientY);
  if (!caretPosition) {
    return null;
  }

  const range = document.createRange();
  range.setStart(caretPosition.offsetNode, caretPosition.offset);
  range.collapse(true);
  return range;
}

function selectWordAtPoint(
  root: HTMLElement,
  clientX: number,
  clientY: number,
): { text: string; rect: DOMRect } | null {
  const range = caretRangeFromPoint(clientX, clientY);
  if (!range || !root.contains(range.startContainer)) {
    return null;
  }

  expandRangeToWord(range);

  const text = normalizePassageReferenceText(range.toString().trim());
  if (!text) {
    return null;
  }

  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);

  const rect = range.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    return null;
  }

  return { text, rect };
}

export function getSelectionInSelectableRoot(): {
  text: string;
  rect: DOMRect;
} | null {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const root =
    findSelectableRoot(range.commonAncestorContainer) ??
    findSelectableRoot(selection.anchorNode);

  if (!root) {
    return null;
  }

  const text = normalizePassageReferenceText(selection.toString().trim());
  if (!text) {
    return null;
  }

  const rect = range.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    return null;
  }

  return { text, rect };
}

interface UseTextSelectionOptions {
  enabled?: boolean;
  onSelection: (state: TextSelectionMenuState) => void;
}

export function useTextSelection({
  enabled = true,
  onSelection,
}: UseTextSelectionOptions) {
  const [menu, setMenu] = useState<TextSelectionMenuState>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    didDrag: boolean;
    root: HTMLElement | null;
  } | null>(null);

  const dismiss = useCallback(() => {
    setMenu(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  const notifySelection = useCallback(
    (state: TextSelectionMenuState) => {
      setMenu(state);
      onSelection(state);
    },
    [onSelection],
  );

  const showSelectionMenu = useCallback(
    (result: { text: string; rect: DOMRect } | null) => {
      if (result) {
        notifySelection(result);
      }
    },
    [notifySelection],
  );

  useEffect(() => {
    if (!enabled) {
      setMenu(null);
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || isEditableTarget(event.target)) {
        dragRef.current = null;
        return;
      }

      if (isNotebookBlocked()) {
        dragRef.current = null;
        return;
      }

      const root = findSelectableRoot(event.target);
      if (!root) {
        dragRef.current = null;
        return;
      }

      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        didDrag: false,
        root,
      };
    };

    const handlePointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId || drag.didDrag) {
        return;
      }

      const deltaX = Math.abs(event.clientX - drag.startX);
      const deltaY = Math.abs(event.clientY - drag.startY);
      if (deltaX >= DRAG_THRESHOLD_PX || deltaY >= DRAG_THRESHOLD_PX) {
        drag.didDrag = true;
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }

      dragRef.current = null;

      if (isEditableTarget(event.target) || isNotebookBlocked()) {
        return;
      }

      if (!drag.didDrag) {
        return;
      }

      window.requestAnimationFrame(() => {
        showSelectionMenu(getSelectionInSelectableRoot());
      });
    };

    const handleDoubleClick = (event: MouseEvent) => {
      if (isEditableTarget(event.target) || isNotebookBlocked()) {
        return;
      }

      const root = findSelectableRoot(event.target);
      if (!root) {
        return;
      }

      dragRef.current = null;

      window.requestAnimationFrame(() => {
        const fromSelection = getSelectionInSelectableRoot();
        if (fromSelection) {
          showSelectionMenu(fromSelection);
          return;
        }

        showSelectionMenu(selectWordAtPoint(root, event.clientX, event.clientY));
      });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dismiss();
      }
    };

    const handleScroll = () => {
      dismiss();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("dblclick", handleDoubleClick);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("dblclick", handleDoubleClick);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [dismiss, enabled, showSelectionMenu]);

  return { menu, dismiss };
}
