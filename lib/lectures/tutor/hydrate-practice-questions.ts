import type { LectureOption, LectureOptionLabel } from "@/lib/lectures/types";
import type { TutorPracticeQuestion } from "@/lib/lectures/tutor/types";

const OPTION_LABELS = new Set<LectureOptionLabel>(["A", "B", "C", "D"]);

type RankedOption = LectureOption & { sortOrder: number };

function optionLabel(value: unknown): LectureOptionLabel | null {
  const label = String(value ?? "").trim().toUpperCase();
  if (OPTION_LABELS.has(label as LectureOptionLabel)) {
    return label as LectureOptionLabel;
  }
  return null;
}

function mapOptions(raw: unknown): LectureOption[] {
  if (!Array.isArray(raw)) return [];
  const options: RankedOption[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = String(row.id ?? "").trim();
    const label = optionLabel(row.label);
    const text = String(row.text ?? "").trim();
    if (!id || !label || !text) continue;
    options.push({
      id,
      label,
      text,
      sortOrder: Number(row.sort_order) || 0,
    });
  }
  return options
    .sort(
      (left, right) =>
        left.sortOrder - right.sortOrder || left.label.localeCompare(right.label),
    )
    .map(({ id, label, text }) => ({ id, label, text }));
}

export function mapHydratedPracticeQuestions(
  data: unknown,
  orderedIds: string[],
): TutorPracticeQuestion[] {
  if (!Array.isArray(data)) return [];
  const byId = new Map<string, TutorPracticeQuestion>();
  for (const item of data) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = String(row.id ?? "").trim();
    const stem = String(row.prompt ?? "").trim();
    const options = mapOptions(row.answer_options);
    if (!id || !stem || options.length < 3) continue;
    byId.set(id, { id, stem, options });
  }
  return orderedIds.flatMap((id) => {
    const question = byId.get(id);
    return question ? [question] : [];
  });
}
