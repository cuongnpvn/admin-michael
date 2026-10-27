"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { reorderAdminLectures } from "@/lib/admin/lectures/reorder-lectures";
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
import type { LectureSummary } from "@/lib/lectures/types";

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

export function AdminReorderLecturesDialog({
  collectionId,
  lectures,
}: {
  collectionId: string;
  lectures: LectureSummary[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [ordered, setOrdered] = useState(lectures);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setOrdered(lectures);
    setDraggingId(null);
    setDropTargetId(null);
  }, [lectures, open]);

  const initialOrderKey = useMemo(
    () => lectures.map((lecture) => lecture.id).join(","),
    [lectures],
  );
  const draftOrderKey = ordered.map((lecture) => lecture.id).join(",");
  const unchanged = draftOrderKey === initialOrderKey;
  const canReorder = lectures.length > 1;

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
    const fromIndex = ordered.findIndex((lecture) => lecture.id === draggingId);
    const toIndex = ordered.findIndex((lecture) => lecture.id === targetId);
    setOrdered((current) => moveItem(current, fromIndex, toIndex));
    setDraggingId(null);
    setDropTargetId(null);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await reorderAdminLectures(
        collectionId,
        ordered.map((lecture) => lecture.id),
      );
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(copy.admin.lectures.toast.reordered);
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
          {copy.admin.lectures.reorder.action}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.admin.lectures.reorder.title}</DialogTitle>
          <DialogDescription>
            {copy.admin.lectures.reorder.description}
          </DialogDescription>
        </DialogHeader>

        {ordered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {copy.admin.lectures.reorder.empty}
          </p>
        ) : (
          <ul className="max-h-[360px] space-y-1 overflow-y-auto">
            {ordered.map((lecture, index) => {
              const isDragging = draggingId === lecture.id;
              const isDropTarget = dropTargetId === lecture.id && !isDragging;

              return (
                <li
                  key={lecture.id}
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (draggingId && draggingId !== lecture.id) {
                      setDropTargetId(lecture.id);
                    }
                  }}
                  onDragLeave={() => {
                    if (dropTargetId === lecture.id) setDropTargetId(null);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleDropOn(lecture.id);
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
                    aria-label={copy.admin.lectures.reorder.dragHandle}
                    className="inline-flex size-8 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 active:cursor-grabbing disabled:cursor-not-allowed"
                    disabled={isPending}
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", lecture.id);
                      setDraggingId(lecture.id);
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
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">
                    {lecture.title}
                  </p>
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
            {copy.admin.lectures.reorder.cancel}
          </Button>
          <Button
            type="button"
            disabled={isPending || unchanged || ordered.length === 0}
            onClick={handleSave}
          >
            {isPending
              ? copy.admin.lectures.reorder.saving
              : copy.admin.lectures.reorder.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
