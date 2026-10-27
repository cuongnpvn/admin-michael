import { lectureChunkContentHash } from "@/lib/lectures/rag/content-hash";
import type { LectureChunkSourceKind } from "@/lib/lectures/rag/match-filters";
import { sanitizeLectureHtml } from "@/lib/lectures/sanitize-html";
import type { LectureQuestion } from "@/lib/lectures/types";

export type LectureChunkDraft = {
  sourceKind: LectureChunkSourceKind;
  heading: string;
  questionId: string | null;
  content: string;
  contentHash: string;
};

export type LectureChunkSource = {
  title: string;
  excerpt: string;
  tags: string[];
  bodyHtml: string;
  questions: Array<Pick<LectureQuestion, "id" | "sortOrder" | "stem" | "options">>;
};

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, "");
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripAndDecode(value: string): string {
  return decodeEntities(stripTags(value)).replace(/\s+/g, " ").trim();
}

function replaceTablesWithTsv(html: string): string {
  return html.replace(/<table\b[^>]*>[\s\S]*?<\/table>/gi, (table) => {
    const rows = [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];
    const lines = rows.map((row) => {
      const cells = [...row[1]!.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)];
      return cells
        .map((cell) => stripAndDecode(cell[1] ?? "").replace(/\t/g, " "))
        .join("\t");
    });
    return `\n${lines.filter(Boolean).join("\n")}\n`;
  });
}

function htmlFragmentToText(html: string): string {
  const structured = replaceTablesWithTsv(html)
    .replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_, inner: string) => {
      return `- ${stripAndDecode(inner)}\n`;
    })
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|blockquote|aside)>/gi, "\n");
  return decodeEntities(stripTags(structured))
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitOnHeading(
  html: string,
  tag: "h2" | "h3",
): Array<{ heading: string; body: string }> {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "gi");
  const matches = [...html.matchAll(re)];
  if (matches.length === 0) return [{ heading: "", body: html }];

  const parts: Array<{ heading: string; body: string }> = [];
  let cursor = 0;
  for (const match of matches) {
    const start = match.index ?? 0;
    const before = html.slice(cursor, start);
    if (parts.length === 0) {
      if (before.trim()) parts.push({ heading: "", body: before });
    } else {
      parts[parts.length - 1]!.body = before;
    }
    parts.push({ heading: stripAndDecode(match[1] ?? ""), body: "" });
    cursor = start + match[0].length;
  }
  if (parts.length > 0) {
    parts[parts.length - 1]!.body = html.slice(cursor);
  }
  return parts;
}

function draft(
  sourceKind: LectureChunkSourceKind,
  heading: string,
  content: string,
  questionId: string | null = null,
): LectureChunkDraft | null {
  const trimmed = content.trim();
  if (!trimmed) return null;
  return {
    sourceKind,
    heading,
    questionId,
    content: trimmed,
    contentHash: lectureChunkContentHash({
      sourceKind,
      heading,
      questionId,
      content: trimmed,
    }),
  };
}

export function buildLectureChunks(source: LectureChunkSource): LectureChunkDraft[] {
  const chunks: LectureChunkDraft[] = [];
  const overview = [
    source.title.trim(),
    source.excerpt.trim(),
    source.tags.length > 0 ? `Tags: ${source.tags.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const overviewChunk = draft("overview", source.title.trim(), overview);
  if (overviewChunk) chunks.push(overviewChunk);

  const sanitized = replaceTablesWithTsv(sanitizeLectureHtml(source.bodyHtml));
  for (const h2 of splitOnHeading(sanitized, "h2")) {
    for (const h3 of splitOnHeading(h2.body, "h3")) {
      const heading = [h2.heading, h3.heading].filter(Boolean).join(" > ");
      const section = draft("section", heading, htmlFragmentToText(h3.body));
      if (section) chunks.push(section);
    }
  }

  for (const question of source.questions) {
    const options = question.options
      .map((option) => `${option.label}. ${option.text}`.trim())
      .join("\n");
    const exercise = draft(
      "exercise",
      `Câu ${question.sortOrder}`,
      [question.stem.trim(), options].filter(Boolean).join("\n"),
      question.id,
    );
    if (exercise) chunks.push(exercise);
  }

  return chunks;
}
