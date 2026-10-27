"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createLectureCollection } from "@/lib/admin/lectures/collection-actions";
import { adminLectureCollectionPath } from "@/lib/lectures/paths";
import type { LectureAccessTier } from "@/lib/lectures/types";
import { copy } from "@/lib/copy/vi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateLectureCollectionDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [accessTier, setAccessTier] = useState<LectureAccessTier>("free");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setTitle("");
    setExcerpt("");
    setAccessTier("free");
    setError(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createLectureCollection({ title, excerpt, accessTier });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      reset();
      if (result.collectionId) {
        router.push(adminLectureCollectionPath(result.collectionId));
      }
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button type="button">{copy.admin.lectures.newCollection}</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{copy.admin.lectures.newCollection}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="collection-title">
                {copy.admin.lectures.collectionTitle}
              </Label>
              <Input
                id="collection-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="collection-excerpt">
                {copy.admin.lectures.collectionExcerpt}
              </Label>
              <Input
                id="collection-excerpt"
                value={excerpt}
                onChange={(event) => setExcerpt(event.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="collection-tier">{copy.admin.lectures.accessTier}</Label>
              <select
                id="collection-tier"
                className="h-10 w-full rounded-[12px] border border-input bg-background px-3 text-sm"
                value={accessTier}
                onChange={(event) =>
                  setAccessTier(event.target.value as LectureAccessTier)
                }
                disabled={isPending}
              >
                <option value="free">{copy.admin.lectures.accessFree}</option>
                <option value="pro">{copy.admin.lectures.accessPro}</option>
              </select>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending || !title.trim()}>
              {copy.admin.lectures.newCollection}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
