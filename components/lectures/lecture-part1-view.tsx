"use client";

import type { ReactNode } from "react";
import { StorageImage } from "@/components/media/storage-image";
import { copy } from "@/lib/copy/vi";
import { lecturePart1Media } from "@/lib/lectures/part1-media";
import type { LectureQuestionPayload } from "@/lib/lectures/exercise";

export function LecturePart1View({
  payload,
  children,
}: {
  payload: LectureQuestionPayload;
  children: ReactNode;
}) {
  const media = lecturePart1Media(payload);

  return (
    <div className="space-y-4">
      <div className="mx-auto w-full max-w-md space-y-2">
        {media.audioUrl ? (
          <audio
            controls
            preload="none"
            src={media.audioUrl}
            aria-label={copy.session.playAudio}
            className="w-full"
          />
        ) : null}
        <div className="overflow-hidden rounded-[12px] border border-border bg-muted/20">
          {media.imageUrl ? (
            <StorageImage
              src={media.imageUrl}
              alt={copy.session.imagePlaceholder}
              className="h-auto w-full"
            />
          ) : (
            <p className="p-6 text-sm text-muted-foreground">
              {copy.session.imagePlaceholder}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
