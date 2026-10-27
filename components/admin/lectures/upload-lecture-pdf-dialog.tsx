"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FileInput } from "@/components/ui/file-input";
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
import { Label } from "@/components/ui/label";
import { uploadLecturePdf } from "@/lib/admin/lectures/upload-actions";
import { adminLectureEditorPath } from "@/lib/lectures/paths";
import { copy } from "@/lib/copy/vi";

export function UploadLecturePdfDialog({
  collectionId,
  lectureId,
  size = "default",
}: {
  collectionId: string;
  lectureId?: string;
  size?: "default" | "sm";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const overwrite = Boolean(lectureId);
  const actionLabel = overwrite
    ? copy.admin.lectures.reuploadPdf
    : copy.admin.lectures.uploadPdf;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    setError(null);
    const formData = new FormData();
    formData.set("pdf", file);

    startTransition(async () => {
      const result = await uploadLecturePdf(collectionId, formData, lectureId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setFile(null);
      if (result.lectureId && !overwrite) {
        router.push(adminLectureEditorPath(collectionId, result.lectureId));
      }
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={overwrite ? "outline" : "default"}
          size={size}
        >
          {actionLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{actionLabel}</DialogTitle>
            <DialogDescription>
              {overwrite
                ? copy.admin.lectures.reuploadHint
                : copy.admin.lectures.uploadHint}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Label>{copy.admin.lectures.uploadPdf}</Label>
            <FileInput
              accept="application/pdf,.pdf"
              onFilesChange={(files) => setFile(files[0] ?? null)}
              disabled={isPending}
            />
            {isPending ? (
              <p className="text-sm text-muted-foreground">
                {copy.admin.lectures.extracting}
              </p>
            ) : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending || !file}>
              {actionLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
