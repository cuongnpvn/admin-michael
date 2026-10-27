"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy/vi";
import { withStorageCacheBust } from "@/lib/media/retry-storage-load";
import { cn } from "@/lib/utils";

interface StorageImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function StorageImage({ src, alt, className }: StorageImageProps) {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setAttempt(0);
    setFailed(false);
  }, [src]);

  if (failed) {
    return (
      <div
        className={cn(
          "flex min-h-32 w-full flex-col items-center justify-center gap-2 px-4 py-6",
          className,
        )}
      >
        <p className="text-center text-sm text-muted-foreground">
          {copy.session.imageLoadFailed}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setFailed(false);
            setAttempt((current) => current + 1);
          }}
        >
          {copy.common.retry}
        </Button>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- Supabase public URLs are dynamic
    <img
      src={withStorageCacheBust(src, attempt)}
      alt={alt}
      className={className}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
