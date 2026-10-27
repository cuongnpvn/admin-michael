/**
 * Allowed CSS classes on passage HTML fragments (extract + translation).
 * Legacy passage-* classes plus curated Tailwind utilities for PDF layout.
 * Keep in sync with extract/process instruction tables and passage-tailwind-safelist.ts.
 */

export const PASSAGE_LEGACY_CLASSES = [
  "passage-label",
  "passage-meta",
  "passage-headline",
  "passage-signature",
  "passage-form",
  "passage-schedule",
  "passage-blank",
  "passage-cloze",
  "passage-message",
  "passage-breadcrumb",
  "passage-byline",
] as const;

/** Curated Tailwind utilities safe for DB-stored passage HTML. */
export const PASSAGE_TAILWIND_CLASSES = [
  "font-bold",
  "font-semibold",
  "font-medium",
  "italic",
  "underline",
  "uppercase",
  "tracking-wide",
  "text-center",
  "text-sm",
  "text-base",
  "text-lg",
  "text-muted-foreground",
  "grid",
  "grid-cols-[auto_1fr]",
  "gap-x-3",
  "gap-y-1",
  "gap-1",
  "gap-2",
  "space-y-1",
  "space-y-2",
  "my-1",
  "my-2",
  "my-3",
  "mt-2",
  "mt-3",
  "mb-2",
  "mb-3",
  "ml-4",
  "pl-4",
  "pl-5",
  "list-disc",
  "list-decimal",
  "border",
  "border-border",
  "border-collapse",
  "rounded-lg",
  "w-full",
  "p-1",
  "p-2",
  "p-3",
  "p-4",
  "align-top",
  "inline-block",
  "border-b",
  "min-w-12",
  "flex",
  "items-start",
  "items-center",
  "justify-between",
  "shrink-0",
  "min-w-4",
  "min-h-4",
  "w-4",
  "h-4",
  "w-12",
  "min-h-6",
  "max-w-md",
] as const;

export const PASSAGE_HTML_ALLOWED_CLASSES = [
  ...PASSAGE_LEGACY_CLASSES,
  ...PASSAGE_TAILWIND_CLASSES,
] as const;

export type PassageHtmlAllowedClass =
  (typeof PASSAGE_HTML_ALLOWED_CLASSES)[number];

export function isPassageHtmlAllowedClass(token: string): boolean {
  return PASSAGE_HTML_ALLOWED_CLASSES.includes(
    token as PassageHtmlAllowedClass,
  );
}
