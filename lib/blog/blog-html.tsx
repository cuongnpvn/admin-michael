"use client";

import DOMPurify from "isomorphic-dompurify";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

const BLOG_HTML_ALLOWED_TAGS = [
  "p",
  "br",
  "hr",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "s",
  "a",
  "ul",
  "ol",
  "li",
  "blockquote",
  "pre",
  "code",
  "img",
  "figure",
  "figcaption",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
] as const;

const BLOG_HTML_SANITIZE_CONFIG = {
  ALLOWED_TAGS: [...BLOG_HTML_ALLOWED_TAGS],
  ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel"],
  ALLOW_DATA_ATTR: false,
};

export function sanitizeBlogHtml(html: string): string {
  const sanitized = DOMPurify.sanitize(html.trim(), BLOG_HTML_SANITIZE_CONFIG);

  if (typeof sanitized !== "string") {
    return "";
  }

  return sanitized;
}

interface BlogHtmlContentProps {
  html: string;
  className?: string;
}

export function BlogHtmlContent({ html, className }: BlogHtmlContentProps) {
  const sanitized = sanitizeBlogHtml(html);

  const htmlProp = useMemo(
    () => (sanitized ? { __html: sanitized } : null),
    [sanitized],
  );

  if (!htmlProp) {
    return null;
  }

  return (
    <div
      className={cn("blog-html", className)}
      dangerouslySetInnerHTML={htmlProp}
    />
  );
}
