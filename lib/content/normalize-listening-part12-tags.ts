import {
  isListeningPart1TagValue,
  isListeningPart2TagValue,
} from "@/lib/content/listening-part-12-tags";

/** Common Gemini mistakes → canonical Part 2 slugs (used only when inference is unavailable). */
const PART2_TAG_ALIASES: Record<string, string> = {
  would: "request",
  could: "request",
  should: "request",
  please: "request",
  lets: "request",
  let: "request",
  suggestion: "request",
  or: "choice",
  alternative: "choice",
  tag: "tag_question",
  tagquestion: "tag_question",
  tag_question: "tag_question",
  yes: "yes_no",
  no: "yes_no",
  yesno: "yes_no",
  "yes/no": "yes_no",
  statement: "declarative",
  sentence: "declarative",
  wh_why: "why",
  wh_what: "what",
  wh_which: "which",
  wh_who: "who",
  wh_when: "when",
  wh_where: "where",
  wh_how: "how",
};

/** Common Gemini mistakes → canonical Part 1 slugs. */
const PART1_TAG_ALIASES: Record<string, string> = {
  picture_person: "picture_single_person",
  single_person: "picture_single_person",
  one_person: "picture_single_person",
  person: "picture_single_person",
  multiple_people: "picture_multiple_people",
  multi_person: "picture_multiple_people",
  people: "picture_multiple_people",
  object: "picture_object",
  objects: "picture_object",
  scene: "picture_object",
  photograph: "picture_single_person",
  photo: "picture_single_person",
};

function normalizeSlug(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, "_");
}

function isTagQuestionTranscript(text: string): boolean {
  const trimmed = text.trim();
  if (
    /,\s*(?:isn'?t|aren'?t|wasn'?t|weren'?t|don'?t|doesn'?t|didn'?t|won'?t|can'?t|couldn'?t|shouldn'?t|wouldn'?t|hasn'?t|haven'?t|hadn'?t)\b/i.test(
      trimmed,
    )
  ) {
    return true;
  }
  return /^(?:isn'?t|aren'?t|wasn'?t|weren'?t|don'?t|doesn'?t|didn'?t|won'?t|can'?t|couldn'?t|shouldn'?t|wouldn'?t|hasn'?t|haven'?t|hadn'?t)\b/i.test(
    trimmed,
  );
}

function isChoiceQuestionTranscript(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.includes("?") && /\sor\s/i.test(trimmed);
}

/** Infer the Part 2 classification slug from the spoken question/statement. */
export function inferListeningPart2TagFromTranscript(
  transcript: string,
): string {
  const text = transcript.trim();
  if (!text) return "declarative";

  if (isTagQuestionTranscript(text)) return "tag_question";
  if (isChoiceQuestionTranscript(text)) return "choice";

  if (/^why\b/i.test(text)) return "why";
  if (/^what\b/i.test(text)) return "what";
  if (/^which\b/i.test(text)) return "which";
  if (/^who\b|^whom\b|^whose\b/i.test(text)) return "who";
  if (/^when\b/i.test(text)) return "when";
  if (/^where\b/i.test(text)) return "where";
  if (/^how\b/i.test(text)) return "how";

  if (/^(let'?s|please\b)/i.test(text)) return "request";
  if (/^(could|would)\s+(you|we)\b/i.test(text)) return "request";

  if (
    text.includes("?") &&
    /^(do|does|did|is|are|was|were|can|will|have|has|had)\b/i.test(text)
  ) {
    return "yes_no";
  }

  if (/\.\s*$/.test(text) && !text.includes("?")) return "declarative";

  if (text.includes("?")) return "yes_no";

  return "declarative";
}

/** Infer Part 1 photograph slug from an optional visual caption. */
export function inferListeningPart1TagFromCaption(caption: string): string {
  const text = caption.trim().toLowerCase();
  if (!text) return "picture_single_person";

  if (
    /\b(two|three|four|several|multiple|group|people|men|women|crowd|team)\b/.test(
      text,
    )
  ) {
    return "picture_multiple_people";
  }

  if (
    /\b(object|objects|building|room|office|desk|equipment|vehicle|sign|flag|plant|box|door|walkway|platform|no people|empty)\b/.test(
      text,
    ) &&
    !/\b(man|woman|person|people|he|she|they)\b/.test(text)
  ) {
    return "picture_object";
  }

  return "picture_single_person";
}

export function resolveListeningPart2Tag(
  rawTag: string | undefined,
  transcript: string,
): string {
  const slug = normalizeSlug(rawTag);
  if (slug && isListeningPart2TagValue(slug)) return slug;

  const inferred = inferListeningPart2TagFromTranscript(transcript);
  if (transcript.trim()) return inferred;

  const aliased = slug ? PART2_TAG_ALIASES[slug] : undefined;
  if (aliased && isListeningPart2TagValue(aliased)) return aliased;

  return inferred;
}

export function resolveListeningPart1Tag(
  rawTag: string | undefined,
  visualCaption?: string,
): string {
  const slug = normalizeSlug(rawTag);
  if (slug && isListeningPart1TagValue(slug)) return slug;

  const caption = visualCaption?.trim() ?? "";
  if (caption) {
    return inferListeningPart1TagFromCaption(caption);
  }

  const aliased = slug ? PART1_TAG_ALIASES[slug] : undefined;
  if (aliased && isListeningPart1TagValue(aliased)) return aliased;

  if (isListeningPart2TagValue(slug)) {
    return "picture_single_person";
  }

  return "picture_single_person";
}

export function normalizeListeningPart2QuestionTags(
  tags: unknown,
  transcript: string,
): string[] {
  const raw = Array.isArray(tags)
    ? tags.find((entry): entry is string => typeof entry === "string")
    : undefined;
  return [resolveListeningPart2Tag(raw, transcript)];
}

export function normalizeListeningPart1QuestionTags(
  tags: unknown,
  visualCaption?: string,
): string[] {
  const raw = Array.isArray(tags)
    ? tags.find((entry): entry is string => typeof entry === "string")
    : undefined;
  return [resolveListeningPart1Tag(raw, visualCaption)];
}
