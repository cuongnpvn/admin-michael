import type { LectureFormat } from "@/lib/lectures/types";

export function parseLectureFormat(value: unknown): LectureFormat {
  if (value === "practice" || value === "vocab" || value === "lesson") {
    return value;
  }
  return "lesson";
}
