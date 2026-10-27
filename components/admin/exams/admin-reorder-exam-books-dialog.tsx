"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { reorderAdminExamBooks } from "@/lib/admin/content/reorder-exam-books";
import { copy } from "@/lib/copy/vi";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { BookCatalogEntry } from "@/types/test-data";

interface AdminReorderExamBooksDialogProps {
  books: BookCatalogEntry[];
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length
  ) {
    return items;
  }
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function AdminReorderExamBooksDialog({
  books,
}: AdminReorderExamBooksDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [orderedBooks, setOrderedBooks] = useState(books);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setOrderedBooks(books);
    setDraggingId(null);
    setDropTargetId(null);
  }, [books, open]);

  const initialOrderKey = useMemo(
    () => books.map((book) => book.id).join(","),
    [books],
  );
  const draftOrderKey = orderedBooks.map((book) => book.id).join(",");
  const unchanged = draftOrderKey === initialOrderKey;
  const canReorder = books.length > 1;

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setDraggingId(null);
      setDropTargetId(null);
    }
  }

  function handleDropOn(targetId: string) {
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null);
      setDropTargetId(null);
      return;
    }
    const fromIndex = orderedBooks.findIndex((book) => book.id === draggingId);
    const toIndex = orderedBooks.findIndex((book) => book.id === targetId);
    setOrderedBooks((current) => moveItem(current, fromIndex, toIndex));
    setDraggingId(null);
    setDropTargetId(null);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await reorderAdminExamBooks(
        orderedBooks.map((book) => book.id),
      );
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(copy.admin.exams.toast.booksReordered);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={!canReorder || isPending}
        >
          <ArrowUpDown className="size-4" />
          {copy.admin.exams.reorderBooks.action}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.admin.exams.reorderBooks.title}</DialogTitle>
          <DialogDescription>
            {copy.admin.exams.reorderBooks.description}
          </DialogDescription>
        </DialogHeader>

        {orderedBooks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {copy.admin.exams.reorderBooks.empty}
          </p>
        ) : (
          <ul className="max-h-[360px] space-y-1 overflow-y-auto">
            {orderedBooks.map((book, index) => {
              const isDragging = draggingId === book.id;
              const isDropTarget = dropTargetId === book.id && !isDragging;

              return (
                <li
                  key={book.id}
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (draggingId && draggingId !== book.id) {
                      setDropTargetId(book.id);
                    }
                  }}
                  onDragLeave={() => {
                    if (dropTargetId === book.id) setDropTargetId(null);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleDropOn(book.id);
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-2 py-2 transition-colors",
                    isDragging && "opacity-50",
                    isDropTarget
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background",
                  )}
                >
                  <button
                    type="button"
                    draggable={!isPending}
                    aria-label={copy.admin.exams.reorderBooks.dragHandle}
                    className="inline-flex size-8 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 active:cursor-grabbing disabled:cursor-not-allowed"
                    disabled={isPending}
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", book.id);
                      setDraggingId(book.id);
                    }}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDropTargetId(null);
                    }}
                  >
                    <GripVertical className="size-4" />
                  </button>
                  <span className="w-6 shrink-0 text-sm tabular-nums text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{book.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {book.id}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => setOpen(false)}
          >
            {copy.admin.exams.reorderBooks.cancel}
          </Button>
          <Button
            type="button"
            disabled={isPending || unchanged || orderedBooks.length === 0}
            onClick={handleSave}
          >
            {isPending
              ? copy.admin.exams.reorderBooks.saving
              : copy.admin.exams.reorderBooks.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
