import type {
  ListeningStimulusKind,
  PassageSetLayout,
} from "@/types/content-db";

export function inferListeningStimulusKind(
  part: 3 | 4,
  topic?: string,
): ListeningStimulusKind {
  if (part === 3) return "conversation";

  const normalized = (topic ?? "").toLowerCase();
  if (normalized.includes("announcement")) return "announcement";
  if (normalized.includes("voicemail")) return "voicemail";
  if (normalized.includes("radio")) return "radio_ad";
  if (normalized.includes("report")) return "report";
  if (normalized.includes("instruction")) return "instructions";
  if (normalized.includes("tour")) return "tour_talk";

  return "other";
}

export function layoutFromPassageCount(count: number): PassageSetLayout {
  if (count >= 3) return "triple";
  if (count === 2) return "double";
  return "single";
}

export function layoutToPassageLayout(layout: PassageSetLayout): "single" | "double" {
  return layout === "single" ? "single" : "double";
}

/** True when the set should render every passage (double/triple Part 7). */
export function isMultiPassageReadingLayout(
  layout: PassageSetLayout | "single" | "double" | null | undefined,
  passageCount: number,
): boolean {
  if (passageCount <= 1) {
    return false;
  }

  return layout !== "single";
}
