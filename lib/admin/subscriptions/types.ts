export type EntitlementAccessTier = "free" | "pro";

export type EntitlementTestRow = {
  testId: string;
  testLabel: string;
  accessTier: EntitlementAccessTier;
};

export type EntitlementBookGroup = {
  bookId: string;
  bookName: string;
  tests: EntitlementTestRow[];
};

/** Universal free-explanation slot: one question number across every bookId/testId. */
export type UniversalFreeExplanationSlot = {
  part: number;
  /** questions.global_item_number */
  slotKey: number;
  label: string;
  freeExplanation: boolean;
  rowCount: number;
};
