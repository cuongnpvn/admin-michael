import type { AskLectureTutorSuccess } from "@/lib/lectures/tutor/types";

export type TutorSseStatus = {
  phase: "preparing" | "thinking";
  text?: string;
};

export type TutorSseDelta = {
  markdown: string;
};

export type TutorSseDone = {
  result: AskLectureTutorSuccess;
};

export type TutorSseError = {
  error: string;
};
