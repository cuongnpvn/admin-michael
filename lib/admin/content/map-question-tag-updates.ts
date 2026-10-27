import { flattenPart5TagFields } from "@/lib/admin/content/map-part5-tag-updates";
import {
  focusesForPart,
  parseQuestionTags,
  skillsForPart,
  validateQuestionTagsComplete,
  type QuestionTagsValidationResult,
} from "@/lib/content/toeic-tags";

export type GroupedTagPart = 3 | 4 | 6 | 7;

export interface QuestionTagUpdate {
  id: string;
  tags: string[];
}

export interface MapQuestionTagUpdatesResult {
  updates: QuestionTagUpdate[];
  droppedIds: string[];
  missingIds: string[];
  invalid: Array<{ id: string | null; error: string }>;
}

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

function tagsFromRow(record: Record<string, unknown>): string[] {
  const flattened = flattenPart5TagFields(record);
  if (flattened.length > 0) return flattened;

  if (!Array.isArray(record.tags)) return [];
  return record.tags.filter(
    (entry): entry is string => typeof entry === "string" && Boolean(entry.trim()),
  );
}

export function validateGroupedRetagTags(
  part: GroupedTagPart,
  tags: string[] | undefined,
): QuestionTagsValidationResult {
  const complete = validateQuestionTagsComplete(tags);
  if (!complete.ok) return complete;

  const parsed = parseQuestionTags(complete.tags);
  const skillValues = new Set(skillsForPart(part).map((entry) => entry.value));
  const focusValues = new Set(focusesForPart(part).map((entry) => entry.value));

  const badSkills = parsed.skills.filter((skill) => !skillValues.has(skill));
  if (badSkills.length > 0) {
    return {
      ok: false,
      tags: complete.tags,
      error: `Part ${part} không dùng dạng câu: ${badSkills.join(", ")}.`,
    };
  }

  const badFocuses = parsed.focuses.filter((focus) => !focusValues.has(focus));
  if (badFocuses.length > 0) {
    return {
      ok: false,
      tags: complete.tags,
      error: `Part ${part} không dùng trọng tâm: ${badFocuses.join(", ")}.`,
    };
  }

  return complete;
}

export function mapQuestionTagUpdates(
  part: GroupedTagPart,
  raw: unknown,
  allowedIds: ReadonlySet<string>,
): MapQuestionTagUpdatesResult {
  const updates: QuestionTagUpdate[] = [];
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

    const validated = validateGroupedRetagTags(part, tagsFromRow(record));
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

export function assertQuestionTagUpdatesComplete(
  part: GroupedTagPart,
  mapped: MapQuestionTagUpdatesResult,
  expectedCount: number,
): QuestionTagUpdate[] {
  if (mapped.invalid.length > 0) {
    const first = mapped.invalid[0];
    const prefix = first.id ? `${first.id}: ` : "";
    throw new Error(
      `Part ${part} tags invalid (${mapped.invalid.length}): ${prefix}${first.error}`,
    );
  }

  if (mapped.missingIds.length > 0) {
    throw new Error(
      `Part ${part} tags missing ${mapped.missingIds.length} of ${expectedCount} questions.`,
    );
  }

  if (mapped.updates.length !== expectedCount) {
    throw new Error(
      `Part ${part} tags expected ${expectedCount} updates, got ${mapped.updates.length}.`,
    );
  }

  return mapped.updates;
}
