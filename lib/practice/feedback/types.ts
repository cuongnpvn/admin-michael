export interface PracticeFeedbackScope {
  bookId: string;
  testId: string;
  part: number;
  listeningGroupId?: string;
  readingPassageSetId?: string;
}

export interface PracticeDifficultyStat {
  median: number;
  count: number;
}

export type PracticeDifficultyStatsMap = Map<string, PracticeDifficultyStat>;

export interface SavePracticeDifficultyFeedbackPayload {
  bookId: string;
  testId: string;
  part: number;
  listeningGroupId?: string;
  readingPassageSetId?: string;
  difficultyScore: number;
}
