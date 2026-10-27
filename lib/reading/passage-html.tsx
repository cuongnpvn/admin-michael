"use client";

import { useMemo } from "react";
import { sanitizePassageHtml } from "@/lib/reading/passage-html-text";
import { cn } from "@/lib/utils";

export { sanitizePassageHtml, stripPassageHtml } from "@/lib/reading/passage-html-text";

interface PassageHtmlContentProps {
  html: string;
  className?: string;
}

export function PassageHtmlContent({ html, className }: PassageHtmlContentProps) {
  const sanitized = sanitizePassageHtml(html);

  // React compares dangerouslySetInnerHTML by object identity. A fresh
  // `{ __html }` each render forces innerHTML reset and wipes imperative
  // hover/highlight decorations (timer ticks, tab focus, etc.).
  const htmlProp = useMemo(
    () => (sanitized ? { __html: sanitized } : null),
    [sanitized],
  );

  if (!htmlProp) {
    return null;
  }

  return (
    <div
      className={cn("passage-html reading-content text-base text-foreground", className)}
      dangerouslySetInnerHTML={htmlProp}
    />
  );
}
