"use client";

import { cn } from "@/lib/utils";

export function TutorThinkingBubble({
  label,
  detail,
  className,
}: {
  label: string;
  detail?: string | null;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-[85%] rounded-2xl bg-muted/50 px-3 py-2.5",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <p className="shimmer text-sm text-muted-foreground">{label}</p>
      {detail ? (
        <p className="mt-1 line-clamp-3 text-xs text-muted-foreground/80">
          {detail}
        </p>
      ) : null}
    </div>
  );
}
