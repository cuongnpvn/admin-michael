import { createHash } from "node:crypto";

export function lectureChunkContentHash(input: {
  sourceKind: string;
  heading: string;
  questionId: string | null;
  content: string;
}): string {
  return createHash("sha256")
    .update(
      [
        input.sourceKind,
        input.heading,
        input.questionId ?? "",
        input.content,
      ].join("\n"),
    )
    .digest("hex");
}
