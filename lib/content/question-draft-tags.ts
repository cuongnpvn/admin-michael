import { validateListeningPart12QuestionTags } from "@/lib/content/listening-part-12-tags";
import { validateQuestionTags } from "@/lib/content/toeic-tags";

/** Tags shown in the admin question dialog. Parts 1–2 use their own slug lists. */
export function questionDraftTags(
  part: number,
  tags: string[] | undefined,
): string[] {
  if (part === 1 || part === 2) {
    const result = validateListeningPart12QuestionTags(part, tags);
    return result.ok ? result.tags : [];
  }
  return validateQuestionTags(tags);
}
