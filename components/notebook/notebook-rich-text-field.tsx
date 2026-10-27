"use client";

import Placeholder from "@tiptap/extension-placeholder";
import type { Editor } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
} from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toEditorHtml } from "@/lib/notebook/note-body";
import {
  findActiveTagQueryInEditor,
  type EditorTagQuery,
} from "@/lib/notebook/tiptap-tag-query";
import { cn } from "@/lib/utils";

interface NotebookRichTextFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  tagQueryEnabled?: boolean;
  onEditorReady?: (editor: Editor) => void;
  onTagQueryChange?: (query: EditorTagQuery | null) => void;
  onTagPickerKeyDown?: (event: KeyboardEvent) => boolean;
}

const editorClassName = cn(
  "tiptap min-h-[120px] w-full px-3 py-2 text-sm leading-relaxed focus:outline-none",
  "[&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
  "[&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5",
  "[&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5",
  "[&_strong]:font-semibold",
);

function syncTagQuery(
  editor: Editor,
  tagQueryEnabled: boolean,
  onTagQueryChange?: (query: EditorTagQuery | null) => void,
) {
  if (!tagQueryEnabled || !onTagQueryChange) {
    onTagQueryChange?.(null);
    return;
  }

  onTagQueryChange(findActiveTagQueryInEditor(editor));
}

export function NotebookRichTextField({
  value,
  onChange,
  placeholder,
  disabled = false,
  id,
  className,
  tagQueryEnabled = false,
  onEditorReady,
  onTagQueryChange,
  onTagPickerKeyDown,
}: NotebookRichTextFieldProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "",
      }),
    ],
    content: toEditorHtml(value),
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        class: editorClassName,
      },
      handleKeyDown: (_view, event) => {
        if (onTagPickerKeyDown?.(event)) {
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
      syncTagQuery(currentEditor, tagQueryEnabled, onTagQueryChange);
    },
    onSelectionUpdate: ({ editor: currentEditor }) => {
      syncTagQuery(currentEditor, tagQueryEnabled, onTagQueryChange);
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    onEditorReady?.(editor);
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const nextHtml = toEditorHtml(value);
    if (nextHtml !== editor.getHTML()) {
      editor.commands.setContent(nextHtml, { emitUpdate: false });
      syncTagQuery(editor, tagQueryEnabled, onTagQueryChange);
    }
  }, [editor, onTagQueryChange, tagQueryEnabled, value]);

  if (!editor) {
    return (
      <div
        className={cn(
          "min-h-[120px] animate-pulse rounded-b-[10px] bg-muted/30",
          className,
        )}
      />
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border/60 px-2 py-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="size-8 px-0"
          disabled={disabled}
          aria-pressed={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="size-8 px-0"
          disabled={disabled}
          aria-pressed={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="size-8 px-0"
          disabled={disabled}
          aria-pressed={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="size-8 px-0"
          disabled={disabled}
          aria-pressed={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" />
        </Button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
