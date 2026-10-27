export type ToeicPartDb = "1" | "2" | "3" | "4" | "5" | "6" | "7";

export type ListeningFormat = "dialogue" | "monologue";

export type ListeningStimulusKind =
  | "conversation"
  | "announcement"
  | "voicemail"
  | "radio_ad"
  | "report"
  | "instructions"
  | "tour_talk"
  | "other";

export type ReadingDocumentType =
  | "email"
  | "memo"
  | "letter"
  | "article"
  | "advertisement"
  | "brochure"
  | "notice"
  | "form"
  | "schedule"
  | "review"
  | "web_page"
  | "conversation"
  | "other";

export const READING_DOCUMENT_TYPES: ReadingDocumentType[] = [
  "email",
  "memo",
  "letter",
  "article",
  "advertisement",
  "brochure",
  "notice",
  "form",
  "schedule",
  "review",
  "web_page",
  "conversation",
  "other",
];

export type PassageSetContentModel = "comprehension" | "text_completion_cloze";

export type PassageSetLayout = "single" | "double" | "triple";

export type MediaKind = "image" | "audio" | "pdf";

export type OptionLabelDb = "A" | "B" | "C" | "D";
