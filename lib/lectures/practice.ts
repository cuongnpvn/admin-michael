export type LecturePracticeRef = {
  questionId: string;
  part: string;
  globalItemNumber: number;
  stem: string;
};

export type LecturePracticeItem = LecturePracticeRef & {
  bookId: string;
  testId: string;
  imageUrl: string | null;
  audioUrl: string | null;
  passage: string | null;
  options: { id: string; label: string; text: string }[];
};
