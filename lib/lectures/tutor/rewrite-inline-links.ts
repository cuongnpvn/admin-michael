import { copy } from "@/lib/copy/vi";
import {
  lectureExercisePath,
  lecturePath,
} from "@/lib/lectures/paths";
import type {
  LectureCitation,
  RecommendedExercise,
  RecommendedLecture,
  TutorCandidates,
  TutorLecture,
  TutorQuestion,
} from "@/lib/lectures/tutor/types";

const TOKEN_RE = /\[\[(lecture|exercise):([^\]|]+)(?:\|([^\]]*))?\]\]/gi;
const INCOMPLETE_TOKEN_RE = /\[\[[^\]]*$/;

/** Drops a trailing `[[lecture:` / `[[exercise:` token that has not closed yet. */
export function stripIncompleteInlineToken(markdown: string): string {
  return markdown.replace(INCOMPLETE_TOKEN_RE, "");
}

const LESSON_KICKER_RE =
  /^(lesson|lector|lecture|bài|bai)\s*\d+\s*[:.\-–—]\s*/i;
const HEADING_INDEX_RE = /^((?:\d+|[ivxlcdm]+)\.\s*)+/i;

export function shortLectureLabel(title: string, headingPath?: string): string {
  if (headingPath?.trim()) {
    const last = headingPath.split(/>|\/|·/).pop()?.trim() ?? "";
    const withoutIndex = last.replace(HEADING_INDEX_RE, "").trim();
    if (withoutIndex) return softenCaps(withoutIndex);
  }
  const stripped = title.trim().replace(LESSON_KICKER_RE, "").trim();
  return softenCaps(stripped || title.trim());
}

function softenCaps(text: string): string {
  if (
    text.length > 1 &&
    text === text.toLocaleUpperCase("vi") &&
    text !== text.toLocaleLowerCase("vi")
  ) {
    const lower = text.toLocaleLowerCase("vi");
    return lower.charAt(0).toLocaleUpperCase("vi") + lower.slice(1);
  }
  return text;
}

export function exerciseLinkLabel(rawLabel?: string): string {
  const label = rawLabel?.trim() ?? "";
  if (!label) return copy.lectures.tutorPractice.toLowerCase();
  const words = label.split(/\s+/).filter(Boolean);
  if (
    words.length === 0 ||
    words.length > 3 ||
    /lesson|lector|https?:\/\//i.test(label)
  ) {
    return copy.lectures.tutorPractice.toLowerCase();
  }
  return label;
}

function isTableRow(line: string): boolean {
  return /^\s*\|.+\|\s*$/.test(line);
}

/** GFM tables need a blank line after prose, but rows must stay consecutive. */
function ensureBlankLineBeforeTable(text: string): string {
  const lines = text.split("\n");
  const out: string[] = [];
  for (const line of lines) {
    const prev = out[out.length - 1];
    if (
      isTableRow(line) &&
      prev !== undefined &&
      prev !== "" &&
      !isTableRow(prev)
    ) {
      out.push("");
    }
    out.push(line);
  }
  return out.join("\n");
}

function markdownLink(label: string, href: string): string {
  const safeLabel = label.replace(/[[\]]/g, "");
  return `[${safeLabel}](${href})`;
}

function lectureHrefFor(lecture: TutorLecture): string {
  return lecturePath(lecture.collectionSlug, lecture.slug);
}

function exerciseHrefFor(
  lecture: TutorLecture,
  question: TutorQuestion,
): string {
  return lectureExercisePath(
    lecture.collectionSlug,
    lecture.slug,
    question.sortOrder,
  );
}

export function rewriteInlineLinks(
  markdown: string,
  ctx: {
    lectures: TutorLecture[];
    questions: TutorQuestion[];
    candidates: TutorCandidates;
    citations: LectureCitation[];
    recommendedExercise: RecommendedExercise | null;
    recommendedLecture: RecommendedLecture | null;
  },
): string {
  const lectureById = new Map(ctx.lectures.map((lecture) => [lecture.id, lecture]));
  const questionById = new Map(
    ctx.questions.map((question) => [question.id, question]),
  );
  const allowedLectures = new Set(ctx.lectures.map((lecture) => lecture.id));
  const allowedExercises = new Set(
    ctx.candidates.exercises.map((item) => item.questionId),
  );
  if (ctx.recommendedExercise) {
    allowedExercises.add(ctx.recommendedExercise.questionId);
  }

  const headingByLecture = new Map<string, string>();
  for (const citation of ctx.citations) {
    if (citation.headingPath && !headingByLecture.has(citation.lectureId)) {
      headingByLecture.set(citation.lectureId, citation.headingPath);
    }
  }

  const source = markdown.includes("\n")
    ? markdown
    : markdown.replace(/\\n/g, "\n");

  let rewritten = source.replace(
    TOKEN_RE,
    (_full, kind: string, rawId: string, rawLabel?: string) => {
      const id = rawId.trim();
      if (kind.toLowerCase() === "lecture") {
        const lecture = lectureById.get(id);
        if (!lecture || !allowedLectures.has(id)) return "";
        const label = shortLectureLabel(lecture.title, headingByLecture.get(id));
        return markdownLink(label, lectureHrefFor(lecture));
      }
      const question = questionById.get(id);
      const lecture = question
        ? lectureById.get(question.lectureId)
        : undefined;
      if (!question || !lecture || !allowedExercises.has(id)) return "";
      return markdownLink(exerciseLinkLabel(rawLabel), exerciseHrefFor(lecture, question));
    },
  );

  rewritten = rewritten
    .replace(/[^\S\n]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return ensureBlankLineBeforeTable(rewritten);
}
