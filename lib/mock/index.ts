import type { ExamSection, ListeningPart, ReadingPart } from "@/types/ui";

import { copy } from "@/lib/copy/vi";
import { ENTRANCE_TEST_READY_PATH } from "@/lib/entrance/paths";

export const MAIN_NAV_ITEMS = [
  { href: "/", label: copy.nav.community, icon: "users" },
  {
    href: ENTRANCE_TEST_READY_PATH,
    label: copy.nav.entranceTest,
    icon: "clipboard-check",
  },
  { href: "/dictation", label: copy.nav.dictation, icon: "audio-lines" },
  { href: "/practice", label: copy.nav.practice, icon: "headphones" },
  { href: "/vocab", label: copy.nav.vocab, icon: "book-marked" },
  { href: "/course", label: copy.nav.courses, icon: "book-text" },
  { href: "/exam", label: copy.nav.exam, icon: "clipboard-list" },
] as const;

export const USER_NAV_ITEMS = [
  { href: "/notebook", label: copy.nav.notebook, icon: "notebook-pen" },
  { href: "/progress", label: copy.nav.progress, icon: "chart-line" },
] as const;

/** @deprecated Use MAIN_NAV_ITEMS and USER_NAV_ITEMS */
export const NAV_ITEMS = MAIN_NAV_ITEMS;

export const listeningParts: ListeningPart[] = [
  {
    part: 1,
    title: "Photographs",
    description: "Nhìn hình ảnh và chọn câu mô tả phù hợp nhất.",
    questionCount: 6,
    estimatedMinutes: 3,
  },
  {
    part: 2,
    title: "Question-Response",
    description: "Nghe câu hỏi và chọn câu trả lời phù hợp nhất.",
    questionCount: 25,
    estimatedMinutes: 8,
  },
  {
    part: 3,
    title: "Conversations",
    description: "Nghe các hội thoại và trả lời câu hỏi về nội dung.",
    questionCount: 39,
    estimatedMinutes: 14,
  },
  {
    part: 4,
    title: "Talks",
    description: "Nghe các bài nói ngắn và trả lời câu hỏi về nội dung.",
    questionCount: 30,
    estimatedMinutes: 12,
  },
];

export const readingParts: ReadingPart[] = [
  {
    part: 5,
    title: "Incomplete Sentences",
    description: "Chọn từ hoặc cụm từ phù hợp nhất để hoàn thành câu.",
    questionCount: 30,
    estimatedMinutes: 15,
  },
  {
    part: 6,
    title: "Text Completion",
    description: "Điền vào chỗ trống trong đoạn văn để hoàn thiện nghĩa.",
    questionCount: 16,
    estimatedMinutes: 10,
  },
  {
    part: 7,
    title: "Reading Comprehension",
    description: "Đọc đoạn văn và trả lời câu hỏi về thông tin trong bài.",
    questionCount: 54,
    estimatedMinutes: 45,
  },
];

export const examSections: ExamSection[] = [
  {
    id: "listening",
    name: "Listening",
    durationMinutes: 45,
    questionCount: 100,
  },
  {
    id: "reading",
    name: "Reading",
    durationMinutes: 75,
    questionCount: 100,
  },
];

/** Legacy exam UI mock — exam wiring deferred. */
export const mockListeningSession = {
  examBookId: "ets-2026",
  examBookName: "ETS 2026",
  part: 1,
  partTitle: "Photographs",
  questionNumber: 1,
  totalQuestions: 1,
  question: {
    id: "legacy-q1",
    number: 1,
    prompt: "Look at the photograph.",
    options: [
      { id: "a", label: "A", text: "Sample option A.", audioId: "legacy-a" },
      { id: "b", label: "B", text: "Sample option B.", audioId: "legacy-b" },
      { id: "c", label: "C", text: "Sample option C.", audioId: "legacy-c" },
      { id: "d", label: "D", text: "Sample option D.", audioId: "legacy-d" },
    ],
  },
};

export const mockExamQuestions = Array.from({ length: 10 }, (_, index) => ({
  number: index + 1,
  answered: index < 3,
  current: index === 3,
}));
