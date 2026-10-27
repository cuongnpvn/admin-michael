"use client";

import type { Editor } from "@tiptap/react";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NotebookRichTextField } from "@/components/notebook/notebook-rich-text-field";
import { NotebookTagPill } from "@/components/notebook/notebook-tag-pill";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { copy } from "@/lib/copy/vi";
import { getNotebookTagColor } from "@/lib/notebook/tag-colors";
import {
  getEditorTagQueryCoords,
  type EditorTagQuery,
} from "@/lib/notebook/tiptap-tag-query";
import { NOTEBOOK_NOTE_TAG_IDS, type NotebookNoteTagId } from "@/lib/notebook/tags";
import { NOTEBOOK_MAX_TAGS_PER_NOTE } from "@/lib/notebook/types";
import { cn } from "@/lib/utils";

interface NotebookNoteEditorProps {
  body: string;
  tags: NotebookNoteTagId[];
  onBodyChange: (body: string) => void;
  onTagsChange: (tags: NotebookNoteTagId[]) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function NotebookNoteEditor({
  body,
  tags,
  onBodyChange,
  onTagsChange,
  disabled = false,
  id = "notebook-body",
  className,
}: NotebookNoteEditorProps) {
  const editorRef = useRef<Editor | null>(null);
  const [tagQuery, setTagQuery] = useState<EditorTagQuery | null>(null);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
  const [highlightIndex, setHighlightIndex] = useState(0);

  const availableTags = useMemo(
    () => NOTEBOOK_NOTE_TAG_IDS.filter((tagId) => !tags.includes(tagId)),
    [tags],
  );

  const canAddTag =
    !disabled &&
    tags.length < NOTEBOOK_MAX_TAGS_PER_NOTE &&
    availableTags.length > 0;

  const suggestions = useMemo(() => {
    if (!tagQuery) {
      return [];
    }

    const normalizedQuery = tagQuery.query.trim().toLowerCase();
    return availableTags.filter((tagId) => {
      if (!normalizedQuery) return true;
      return tagId.includes(normalizedQuery);
    });
  }, [availableTags, tagQuery]);

  const pickerOpen =
    Boolean(tagQuery) &&
    canAddTag &&
    suggestions.length > 0 &&
    !disabled;

  const handleEditorReady = useCallback((editor: Editor) => {
    editorRef.current = editor;
  }, []);

  const handleTagQueryChange = useCallback(
    (query: EditorTagQuery | null) => {
      setTagQuery(query);
      if (!query || !editorRef.current || !canAddTag) {
        return;
      }

      setPickerPosition(getEditorTagQueryCoords(editorRef.current, query.from));
    },
    [canAddTag],
  );

  const addTag = useCallback(
    (tagId: NotebookNoteTagId) => {
      if (tags.includes(tagId) || tags.length >= NOTEBOOK_MAX_TAGS_PER_NOTE) {
        return;
      }

      onTagsChange([...tags, tagId]);
    },
    [onTagsChange, tags],
  );

  const insertTagFromQuery = useCallback(
    (tagId: NotebookNoteTagId) => {
      const editor = editorRef.current;
      if (!editor || !tagQuery || tags.includes(tagId)) {
        return;
      }

      editor
        .chain()
        .focus()
        .deleteRange({ from: tagQuery.from, to: tagQuery.to })
        .run();

      onBodyChange(editor.getHTML());
      addTag(tagId);
      setTagQuery(null);
    },
    [addTag, onBodyChange, tagQuery, tags],
  );

  const removeTag = useCallback(
    (tagId: NotebookNoteTagId) => {
      onTagsChange(tags.filter((current) => current !== tagId));
    },
    [onTagsChange, tags],
  );

  const handleTagPickerKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!pickerOpen) {
        return false;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlightIndex((index) => (index + 1) % suggestions.length);
        return true;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlightIndex(
          (index) => (index - 1 + suggestions.length) % suggestions.length,
        );
        return true;
      }

      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        insertTagFromQuery(suggestions[highlightIndex]!);
        return true;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setTagQuery(null);
        return true;
      }

      return false;
    },
    [highlightIndex, insertTagFromQuery, pickerOpen, suggestions],
  );

  useEffect(() => {
    setHighlightIndex(0);
  }, [tagQuery?.query]);

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "overflow-hidden rounded-[10px] border border-border bg-surface shadow-sm transition-calm focus-within:ring-2 focus-within:ring-ring",
          disabled && "opacity-50",
        )}
      >
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border/60 px-3 pb-2 pt-2">
          {tags.map((tagId) => (
            <NotebookTagPill
              key={tagId}
              tagId={tagId}
              onRemove={disabled ? undefined : () => removeTag(tagId)}
              removeLabel={copy.notebook.removeTag}
            />
          ))}

          {canAddTag ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 border-dashed px-2 text-xs"
                >
                  <Plus className="size-3" />
                  {copy.notebook.addTag}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-44 p-1">
                <div className="flex flex-col gap-0.5">
                  {availableTags.map((tagId) => (
                    <button
                      key={tagId}
                      type="button"
                      className="rounded-md px-2 py-1.5 text-left transition-calm hover:bg-muted"
                      onClick={() => addTag(tagId)}
                    >
                      <NotebookTagPill tagId={tagId} />
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          ) : null}
        </div>

        <NotebookRichTextField
          id={id}
          value={body}
          onChange={onBodyChange}
          placeholder={copy.notebook.notePlaceholder}
          disabled={disabled}
          tagQueryEnabled={canAddTag}
          onEditorReady={handleEditorReady}
          onTagQueryChange={handleTagQueryChange}
          onTagPickerKeyDown={handleTagPickerKeyDown}
        />
      </div>

      {pickerOpen ? (
        <ul
          className="fixed z-[70] max-h-48 min-w-[10rem] overflow-y-auto rounded-[10px] border border-border bg-surface py-1 shadow-card"
          style={{
            top: pickerPosition.top,
            left: pickerPosition.left,
          }}
          role="listbox"
        >
          {suggestions.map((tagId, index) => {
            const colors = getNotebookTagColor(tagId);
            return (
              <li key={tagId}>
                <button
                  type="button"
                  role="option"
                  aria-selected={index === highlightIndex}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-calm",
                    index === highlightIndex
                      ? colors.pickerBg
                      : "hover:bg-muted",
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => insertTagFromQuery(tagId)}
                >
                  <NotebookTagPill tagId={tagId} />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
