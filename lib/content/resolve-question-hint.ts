import { getToeicTipById } from "@/lib/content/toeic-tips-static";
import {
  formatQuestionExplanation,
  hasQuestionExplanation,
  parseQuestionExplanation,
  type QuestionExplanation,
} from "@/lib/content/question-explanation";
import { parseQuestionTags } from "@/lib/content/toeic-tags";
import { copy } from "@/lib/copy/vi";

export type { QuestionExplanation } from "@/lib/content/question-explanation";
export {
  formatQuestionExplanation,
  hasQuestionExplanation,
  parseQuestionExplanation,
} from "@/lib/content/question-explanation";

export function resolveQuestionHint(input: {
  hint?: string | null;
  tags?: string[] | null;
}): string {
  const trimmed = input.hint?.trim();
  if (trimmed) return trimmed;

  const { topics, skills, focuses } = parseQuestionTags(input.tags ?? []);
  const parts: string[] = [];
  const seenTipIds = new Set<string>();

  for (const skillId of skills) {
    const tip = getToeicTipById(skillId);
    if (tip && !seenTipIds.has(tip.id)) {
      seenTipIds.add(tip.id);
      parts.push(`${tip.headlineVi}: ${tip.bodyVi}`);
    }
  }

  for (const focusId of focuses) {
    const tip = getToeicTipById(focusId);
    if (tip && !seenTipIds.has(tip.id)) {
      seenTipIds.add(tip.id);
      parts.push(`${tip.headlineVi}: ${tip.bodyVi}`);
    }
  }

  const primaryTopic = topics[0];
  if (primaryTopic) {
    const tip = getToeicTipById(primaryTopic);
    if (tip && !seenTipIds.has(tip.id)) {
      parts.push(`${tip.headlineVi}: ${tip.bodyVi}`);
    }
  }

  if (parts.length > 0) {
    return parts.join("\n\n");
  }

  return copy.session.tutorHint;
}

export function resolveQuestionExplanation(input: {
  explanation?: QuestionExplanation | unknown | null;
}): QuestionExplanation {
  const parsed = parseQuestionExplanation(input.explanation);
  if (!parsed || !hasQuestionExplanation(parsed)) {
    return { reasoning: copy.session.explanationFallback, reference: [] };
  }
  return formatQuestionExplanation(parsed, copy.session.explanationFallback);
}
