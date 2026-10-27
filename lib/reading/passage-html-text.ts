import DOMPurify from "isomorphic-dompurify";
import { isPassageHtmlAllowedClass } from "@/lib/reading/passage-allowed-classes";

const PASSAGE_HTML_ALLOWED_TAGS = [
  "div",
  "p",
  "span",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "br",
  "hr",
  "h1",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "dl",
  "dt",
  "dd",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "section",
  "blockquote",
] as const;

const PASSAGE_HTML_SANITIZE_CONFIG = {
  ALLOWED_TAGS: [...PASSAGE_HTML_ALLOWED_TAGS],
  ALLOWED_ATTR: ["class"],
  ALLOW_DATA_ATTR: false,
};

function sanitizePassageClasses(html: string): string {
  return html.replace(/\sclass="([^"]*)"/g, (_match, classValue: string) => {
    const filtered = classValue
      .split(/\s+/)
      .filter(Boolean)
      .filter((token) => isPassageHtmlAllowedClass(token));
    return filtered.length > 0 ? ` class="${filtered.join(" ")}"` : "";
  });
}

export function sanitizePassageHtml(html: string): string {
  const withSafeClasses = sanitizePassageClasses(html.trim());
  const sanitized = DOMPurify.sanitize(
    withSafeClasses,
    PASSAGE_HTML_SANITIZE_CONFIG,
  );

  if (typeof sanitized !== "string") {
    return "";
  }

  return sanitized;
}

/** Render passage-meta label/value pairs like translation rows: "From: Jane Smith". */
function formatPassageMetaPairs(html: string): string {
  return html.replace(
    /<dt[^>]*>([^<]*)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi,
    (_match, label: string, value: string) => {
      const cleanValue = value.replace(/<[^>]+>/g, "").trim();
      return `${label.trim()}: ${cleanValue}\n`;
    },
  );
}

/** Extract visible text from HTML for bilingual matching and paragraph grouping. */
export function stripPassageHtml(html: string): string {
  const sanitized = sanitizePassageHtml(html);
  if (!sanitized) {
    return "";
  }

  const withMetaLines = formatPassageMetaPairs(sanitized);

  // Isomorphic only — never branch on `document` (SSR and client must match).
  return withMetaLines
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/(td|th)>/gi, " ")
    .replace(/<\/(div|section|li|dt|dd|tr|h[1-6]|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/ +\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
