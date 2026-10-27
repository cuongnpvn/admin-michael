"use client";

import { useEffect, useState, useTransition } from "react";
import { FileInput } from "@/components/ui/file-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  deleteVocabularyItemImage,
  uploadVocabularyItemImage,
} from "@/lib/admin/vocabulary/image-actions";
import { VOCABULARY_IMAGE_ACCEPT } from "@/lib/admin/vocabulary/constants";
import { copy } from "@/lib/copy/vi";
import { cn } from "@/lib/utils";
import type { LoadedVocabularyItem } from "@/lib/vocabulary/load-deck-vocabulary";

interface AdminVocabularyItemImageFieldProps {
  item: LoadedVocabularyItem;
  deckId: string;
  disabled?: boolean;
  onError: (error: string | null) => void;
  className?: string;
}

export function AdminVocabularyItemImageField({
  item,
  deckId,
  disabled = false,
  onError,
  className,
}: AdminVocabularyItemImageFieldProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(item.imageUrl);
  const [isPending, startTransition] = useTransition();
  const detailCopy = copy.admin.vocabulary.detail;

  useEffect(() => {
    setImageUrl(item.imageUrl);
  }, [item.id, item.imageUrl]);

  const busy = disabled || isPending;

  function handleFilesChange(files: File[]) {
    const file = files[0];
    if (!file) return;

    const formData = new FormData();
    formData.set("file", file);
    onError(null);

    startTransition(async () => {
      const result = await uploadVocabularyItemImage(item.id, deckId, formData);
      if (!result.ok) {
        onError(result.error);
        return;
      }

      const nextUrl = result.imageUrl
        ? `${result.imageUrl}?t=${Date.now()}`
        : null;
      setImageUrl(nextUrl);
    });
  }

  function handleRemove() {
    onError(null);

    startTransition(async () => {
      const result = await deleteVocabularyItemImage(item.id, deckId);
      if (!result.ok) {
        onError(result.error);
        return;
      }

      setImageUrl(null);
    });
  }

  return (
    <div className={cn("flex min-h-0 flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label>{detailCopy.fields.image}</Label>
        <span className="text-xs text-muted-foreground">
          {detailCopy.imageOptional}
        </span>
      </div>
      <FileInput
        variant="dropzone"
        accept={VOCABULARY_IMAGE_ACCEPT}
        disabled={busy}
        className="min-h-48 flex-1"
        dropLabel={detailCopy.imageDrop}
        dropHint={detailCopy.imageHint}
        dropReleaseLabel={detailCopy.imageDropRelease}
        onFilesChange={handleFilesChange}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- Supabase public URLs are dynamic per word
          <img
            src={imageUrl}
            alt={item.term}
            className="max-h-64 w-auto max-w-full object-contain md:max-h-full"
          />
        ) : null}
      </FileInput>
      {imageUrl ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          className="self-start"
          onClick={handleRemove}
        >
          {detailCopy.imageRemove}
        </Button>
      ) : null}
    </div>
  );
}
