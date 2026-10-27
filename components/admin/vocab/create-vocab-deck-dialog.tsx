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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VOCABULARY_UPLOAD_ACCEPT } from "@/lib/admin/vocabulary/constants";
import { importVocabularyDeckFromUpload } from "@/lib/admin/vocabulary/actions";
import { copy } from "@/lib/copy/vi";
import { adminVocabDeckPath } from "@/lib/vocabulary/vocabulary-paths";

export function CreateVocabDeckDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setName("");
    setFile(null);
    setError(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set("name", name.trim());
    if (file) formData.set("file", file);

    startTransition(async () => {
      const result = await importVocabularyDeckFromUpload(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      setOpen(false);
      resetForm();
      router.push(adminVocabDeckPath(result.deckId));
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button type="button">{copy.admin.vocabManage.createDeck}</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{copy.admin.vocabManage.createDeckTitle}</DialogTitle>
            <DialogDescription>
              {copy.admin.vocabManage.createDeckDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deck-name">
                {copy.admin.vocabManage.deckNameLabel}
              </Label>
              <Input
                id="deck-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={copy.admin.vocabManage.deckNamePlaceholder}
                disabled={isPending}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{copy.admin.vocabManage.uploadLabel}</Label>
              <FileInput
                accept={VOCABULARY_UPLOAD_ACCEPT}
                onFilesChange={(files) => setFile(files[0] ?? null)}
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                {copy.admin.vocabManage.uploadHint}
              </p>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setOpen(false)}
            >
              {copy.admin.cms.cancel}
            </Button>
            <Button type="submit" disabled={isPending || !file}>
              {copy.admin.vocabManage.createDeckSubmit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
