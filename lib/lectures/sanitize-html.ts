import DOMPurify from "isomorphic-dompurify";
import { stripLeadingLectureKicker } from "@/lib/lectures/strip-kicker";

export { stripLeadingLectureKicker };

const LECTURE_HTML_ALLOWED_TAGS = [
  "a",
  "p",
  "br",
  "hr",
  "h2",
  "h3",
  "h4",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "blockquote",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "aside",
  "div",
  "span",
  "img",
] as const;

const LECTURE_HTML_SANITIZE_CONFIG = {
  ALLOWED_TAGS: [...LECTURE_HTML_ALLOWED_TAGS],
  ALLOWED_ATTR: ["class", "href", "src", "alt"],
  ALLOW_DATA_ATTR: false,
};

const EXERCISE_HREF_RE = /^#exercise(?:-\d+)?$/;
const ATTR_RE = (name: string) =>
  new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i");

export function isLectureImageSrc(src: string): boolean {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return false;
  try {
    const url = new URL(src);
    const origin = new URL(base);
    return (
      url.origin === origin.origin &&
      url.pathname.startsWith("/storage/v1/object/public/images/") &&
      !url.pathname.includes("..")
    );
  } catch {
    return false;
  }
}

export function isLectureExerciseHref(href: string): boolean {
  return EXERCISE_HREF_RE.test(href);
}

function attrValue(attrs: string, name: string): string | null {
  const match = ATTR_RE(name).exec(attrs);
  return match?.[1] ?? match?.[2] ?? null;
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

/** Keep storage images and in-page exercise links. Unwrap everything else. */
function restrictLectureMedia(html: string): string {
  const images = html.replace(/<img\b([^>]*)\/?>/gi, (_full, attrs: string) => {
    const src = attrValue(attrs, "src");
    if (!src || !isLectureImageSrc(src)) return "";
    const alt = attrValue(attrs, "alt") ?? "";
    return `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}">`;
  });
  return images.replace(
    /<a\b([^>]*)>([\s\S]*?)<\/a>/gi,
    (_full, attrs: string, inner: string) => {
      const href = attrValue(attrs, "href");
      if (!href || !isLectureExerciseHref(href)) return inner;
      return `<a href="${escapeAttr(href)}">${inner}</a>`;
    },
  );
}

export function sanitizeLectureHtml(html: string): string {
  const sanitized = DOMPurify.sanitize(html.trim(), LECTURE_HTML_SANITIZE_CONFIG);
  const text = typeof sanitized === "string" ? sanitized : "";
  return restrictLectureMedia(text);
}

export function isLectureHtmlEmpty(html: string): boolean {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim().length === 0;
}

export function sanitizeCollectionDescriptionHtml(html: string): string {
  const sanitized = sanitizeLectureHtml(html);
  return isLectureHtmlEmpty(sanitized) ? "" : sanitized;
}
