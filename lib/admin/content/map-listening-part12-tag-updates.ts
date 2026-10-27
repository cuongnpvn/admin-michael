import { validateListeningPart12QuestionTags } from "@/lib/content/listening-part-12-tags";

export interface ListeningPart12TagUpdate {
  id: string;
  tags: string[];
}

export interface MapListeningPart12TagUpdatesResult {
  updates: ListeningPart12TagUpdate[];
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
  const tags = Array.isArray(record.tags)
    ? record.tags.filter(
        (entry): entry is string =>
          typeof entry === "string" && Boolean(entry.trim()),
      )
    : [];
  const topic = typeof record.topic === "string" ? record.topic.trim() : "";
  if (!topic || tags.includes(topic)) return tags;
  return [topic, ...tags];
}

/**
 * Keep only rows whose `id` is in `allowedIds`.
 * Unknown ids are dropped. Invalid tag sets are listed, not updated.
 */
export function mapListeningPart12TagUpdates(
  part: 1 | 2,
  raw: unknown,
  allowedIds: ReadonlySet<string>,
): MapListeningPart12TagUpdatesResult {
  const updates: ListeningPart12TagUpdate[] = [];
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

    const validated = validateListeningPart12QuestionTags(part, tagsFromRow(record));
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

export function assertListeningPart12TagUpdatesComplete(
  part: 1 | 2,
  mapped: MapListeningPart12TagUpdatesResult,
  expectedCount: number,
): ListeningPart12TagUpdate[] {
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
