import type { AskLectureTutorSuccess } from "@/lib/lectures/tutor/types";

export type TutorUiTurn =
  | { role: "user"; text: string }
  | { role: "assistant"; result: AskLectureTutorSuccess };

export function pendingPracticeOfferIndex(
  turns: TutorUiTurn[],
  handledIndex: number | null,
): number | null {
  const index = turns.length - 1;
  if (index < 0 || handledIndex === index) return null;
  const last = turns[index];
  if (last.role !== "assistant") return null;
  if (last.result.refuse || !last.result.offerPractice) return null;
  return index;
}
