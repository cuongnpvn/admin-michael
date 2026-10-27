import {
  focusesForPart,
  parseQuestionTags,
  skillsForPart,
  validateQuestionTagsComplete,
  type QuestionTagsValidationResult,
} from "@/lib/content/toeic-tags";

export interface Part5TagUpdate {
  id: string;
  tags: string[];
}

export interface MapPart5TagUpdatesResult {
  updates: Part5TagUpdate[];
  droppedIds: string[];
  missingIds: string[];
  invalid: Array<{ id: string | null; error: string }>;
}

const PART5_SKILL_VALUES = new Set(
  skillsForPart(5).map((entry) => entry.value),
);
const PART5_FOCUS_VALUES = new Set(
  focusesForPart(5).map((entry) => entry.value),
);

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function questionsFromRaw(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  const record = asRecord(raw);
  if (record && Array.isArray(record.questions)) return record.questions;
  return [];
}

/** Flatten Gemini `skills` + `focus` + optional `topic` into import `tags[]`. */
export function flattenPart5TagFields(question: {
  skills?: unknown;
  skill?: unknown;
  focus?: unknown;
  topic?: unknown;
}): string[] {
  const tags: string[] = [];

  if (typeof question.topic === "string" && question.topic.trim()) {
    tags.push(question.topic.trim());
  }

  if (Array.isArray(question.skills)) {
    for (const entry of question.skills) {
      if (typeof entry === "string" && entry.trim()) {
        tags.push(entry.trim());
      }
    }
  } else if (typeof question.skill === "string" && question.skill.trim()) {
    tags.push(question.skill.trim());
  }

  if (typeof question.focus === "string" && question.focus.trim()) {
    tags.push(question.focus.trim());
  }

  return tags;
}

export function validatePart5RetagTags(
  tags: string[] | undefined,
): QuestionTagsValidationResult {
  const complete = validateQuestionTagsComplete(tags);
  if (!complete.ok) return complete;

  const parsed = parseQuestionTags(complete.tags);
  const badSkills = parsed.skills.filter(
    (skill) => !PART5_SKILL_VALUES.has(skill),
  );
  if (badSkills.length > 0) {
    return {
      ok: false,
      tags: complete.tags,
      error: `Part 5 không dùng dạng câu comprehension: ${badSkills.join(", ")}.`,
    };
  }

  const badFocuses = parsed.focuses.filter(
    (focus) => !PART5_FOCUS_VALUES.has(focus),
  );
  if (badFocuses.length > 0) {
    return {
      ok: false,
      tags: complete.tags,
      error: `Part 5 không dùng trọng tâm comprehension: ${badFocuses.join(", ")}.`,
    };
  }

  return complete;
}

function tagsFromRow(record: Record<string, unknown>): string[] {
  const flattened = flattenPart5TagFields(record);
  if (flattened.length > 0) return flattened;

  if (!Array.isArray(record.tags)) return [];
  return record.tags.filter(
    (entry): entry is string => typeof entry === "string" && Boolean(entry.trim()),
  );
}

/**
 * Keep only rows whose `id` is in `allowedIds` (existing Part 5 questions).
 * Unknown ids are dropped. Invalid / incomplete rows are listed, not updated.
 */
export function mapPart5TagUpdates(
  raw: unknown,
  allowedIds: ReadonlySet<string>,
): MapPart5TagUpdatesResult {
  const updates: Part5TagUpdate[] = [];
  const droppedIds: string[] = [];
  const invalid: Array<{ id: string | null; error: string }> = [];
  const seenAllowed = new Set<string>();

  for (const entry of questionsFromRaw(raw)) {
    const record = asRecord(entry);
    if (!record) {
      invalid.push({ id: null, error: "Question row is not an object." });
      continue;
    }

    const id = typeof record.id === "string" ? record.id.trim() : "";
    if (!id) {
      invalid.push({ id: null, error: "Missing question id." });
      continue;
    }

    if (!allowedIds.has(id)) {
      droppedIds.push(id);
      continue;
    }

    const validated = validatePart5RetagTags(tagsFromRow(record));
    if (!validated.ok) {
      invalid.push({ id, error: validated.error });
      continue;
    }

    seenAllowed.add(id);
    updates.push({ id, tags: validated.tags });
  }

  const missingIds = [...allowedIds].filter((id) => !seenAllowed.has(id));
  return { updates, droppedIds, missingIds, invalid };
}

export function assertPart5TagUpdatesComplete(
  mapped: MapPart5TagUpdatesResult,
  expectedCount: number,
): Part5TagUpdate[] {
  if (mapped.invalid.length > 0) {
    const first = mapped.invalid[0];
    const prefix = first.id ? `${first.id}: ` : "";
    throw new Error(
      `Part 5 tags invalid (${mapped.invalid.length}): ${prefix}${first.error}`,
    );
  }

  if (mapped.missingIds.length > 0) {
    throw new Error(
      `Part 5 tags missing ${mapped.missingIds.length} of ${expectedCount} questions.`,
    );
  }

  if (mapped.updates.length !== expectedCount) {
    throw new Error(
      `Part 5 tags expected ${expectedCount} updates, got ${mapped.updates.length}.`,
    );
  }

  return mapped.updates;
}
