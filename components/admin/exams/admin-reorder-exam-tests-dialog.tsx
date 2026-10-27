"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { reorderAdminExamTests } from "@/lib/admin/content/reorder-exam-tests";
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
import type { TestCatalogEntry } from "@/types/test-data";

interface AdminReorderExamTestsDialogProps {
  bookId: string;
  tests: TestCatalogEntry[];
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

export function AdminReorderExamTestsDialog({
  bookId,
  tests,
}: AdminReorderExamTestsDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [orderedTests, setOrderedTests] = useState(tests);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setOrderedTests(tests);
    setDraggingId(null);
    setDropTargetId(null);
  }, [open, tests]);

  const initialOrderKey = useMemo(
    () => tests.map((test) => test.id).join(","),
    [tests],
  );
  const draftOrderKey = orderedTests.map((test) => test.id).join(",");
  const unchanged = draftOrderKey === initialOrderKey;
  const canReorder = tests.length > 1;

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
    const fromIndex = orderedTests.findIndex((test) => test.id === draggingId);
    const toIndex = orderedTests.findIndex((test) => test.id === targetId);
    setOrderedTests((current) => moveItem(current, fromIndex, toIndex));
    setDraggingId(null);
    setDropTargetId(null);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await reorderAdminExamTests(
        bookId,
        orderedTests.map((test) => test.id),
      );
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(copy.admin.exams.toast.testsReordered);
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
          {copy.admin.exams.reorderTests.action}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.admin.exams.reorderTests.title}</DialogTitle>
          <DialogDescription>
            {copy.admin.exams.reorderTests.description}
          </DialogDescription>
        </DialogHeader>

        {orderedTests.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {copy.admin.exams.reorderTests.empty}
          </p>
        ) : (
          <ul className="max-h-[360px] space-y-1 overflow-y-auto">
            {orderedTests.map((test, index) => {
              const isDragging = draggingId === test.id;
              const isDropTarget = dropTargetId === test.id && !isDragging;

              return (
                <li
                  key={test.id}
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (draggingId && draggingId !== test.id) {
                      setDropTargetId(test.id);
                    }
                  }}
                  onDragLeave={() => {
                    if (dropTargetId === test.id) setDropTargetId(null);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleDropOn(test.id);
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
                    aria-label={copy.admin.exams.reorderTests.dragHandle}
                    className="inline-flex size-8 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 active:cursor-grabbing disabled:cursor-not-allowed"
                    disabled={isPending}
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", test.id);
                      setDraggingId(test.id);
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
                    <p className="truncate text-sm font-medium">{test.label}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {test.id}
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
            {copy.admin.exams.reorderTests.cancel}
          </Button>
          <Button
            type="button"
            disabled={isPending || unchanged || orderedTests.length === 0}
            onClick={handleSave}
          >
            {isPending
              ? copy.admin.exams.reorderTests.saving
              : copy.admin.exams.reorderTests.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
