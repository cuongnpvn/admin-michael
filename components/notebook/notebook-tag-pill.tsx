import type { ReactNode } from "react";
import { X } from "lucide-react";
import { getNotebookTagColor } from "@/lib/notebook/tag-colors";
import {
  formatNotebookTagDisplay,
  type NotebookNoteTagId,
} from "@/lib/notebook/tags";
import { cn } from "@/lib/utils";

interface NotebookTagPillProps {
  tagId: NotebookNoteTagId;
  className?: string;
  children?: ReactNode;
  onRemove?: () => void;
  removeLabel?: string;
}

export function NotebookTagPill({
  tagId,
  className,
  children,
  onRemove,
  removeLabel = "Remove tag",
}: NotebookTagPillProps) {
  const colors = getNotebookTagColor(tagId);
  const label = children ?? formatNotebookTagDisplay(tagId);

  return (
    <span
      className={cn(
        "group relative inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
        onRemove && "pr-2.5",
        colors.bg,
        colors.text,
        colors.border,
        className,
      )}
    >
      {label}
      {onRemove ? (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onRemove();
          }}
          aria-label={removeLabel}
          className={cn(
            "absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground opacity-0 shadow-sm transition-calm",
            "group-hover:opacity-100 hover:bg-muted hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <X className="size-2.5" strokeWidth={2.5} />
        </button>
      ) : null}
    </span>
  );
}
