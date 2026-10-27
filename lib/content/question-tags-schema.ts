import {
  MIN_QUESTION_TAGS,
  validateQuestionTagsComplete,
} from "@/lib/content/toeic-tags";
import {
  validateListeningPart12QuestionTags,
} from "@/lib/content/listening-part-12-tags";
import { z } from "zod";

export const importQuestionTagsSchema = z
  .array(z.string())
  .min(MIN_QUESTION_TAGS, {
    message: `Each question must include at least ${MIN_QUESTION_TAGS} tags.`,
  })
  .superRefine((tags, ctx) => {
    const result = validateQuestionTagsComplete(tags);
    if (!result.ok) {
      ctx.addIssue({
        code: "custom",
        message: result.error,
      });
    }
  });

function listeningPartQuestionTagsSchema(part: 1 | 2) {
  return z
    .array(z.string())
    .min(1, {
      message: `Part ${part} cần đúng 1 tag phân loại.`,
    })
    .max(2, {
      message: `Part ${part} cần 1 tag phân loại và tối đa 1 chủ đề.`,
    })
    .superRefine((tags, ctx) => {
      const result = validateListeningPart12QuestionTags(part, tags);
      if (!result.ok) {
        ctx.addIssue({
          code: "custom",
          message: result.error,
        });
      }
    });
}

/** Part 1 listening: one photograph-classification slug. */
export const listeningPart1QuestionTagsSchema =
  listeningPartQuestionTagsSchema(1);

/** Part 2 listening: one question-type slug. */
export const listeningPart2QuestionTagsSchema =
  listeningPartQuestionTagsSchema(2);

/** Parts 6–7 reading: tags optional at import (can be added later in CMS). */
export const optionalQuestionTagsSchema = z.array(z.string()).optional();

// TODO: Re-enable tag validation for reading Parts 6–7 once tag rules are finalized.
// /** Parts 1–2 listening: tags optional at field level; validated when present. */
// export const optionalQuestionTagsSchema = z
//   .array(z.string())
//   .optional()
//   .superRefine((tags, ctx) => {
//     if (!tags?.length) return;
//
//     const trimmed = tags.map((entry) => entry.trim()).filter(Boolean);
//     if (trimmed.length !== 1) {
//       ctx.addIssue({
//         code: "custom",
//         message: `Part 1–2 cần đúng 1 tag (hiện có ${trimmed.length}).`,
//       });
//       return;
//     }
//
//     if (!isListeningPart12TagValue(trimmed[0])) {
//       ctx.addIssue({
//         code: "custom",
//         message: `Tag "${trimmed[0]}" không hợp lệ cho Part 1–2.`,
//       });
//     }
//   });
