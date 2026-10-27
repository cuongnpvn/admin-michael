export interface DailyGoals {
  wordsTarget: number;
  practiceTarget: number;
  examTarget: number;
}

export interface DailyProgress {
  words: number;
  practice: number;
  exam: number;
}

export interface DailyGoalSummary {
  goals: DailyGoals;
  today: DailyProgress;
  isTodayMet: boolean;
  streakDays: number;
  completedDays: string[];
}

export const DEFAULT_DAILY_GOALS: DailyGoals = {
  wordsTarget: 5,
  practiceTarget: 1,
  examTarget: 1,
};
