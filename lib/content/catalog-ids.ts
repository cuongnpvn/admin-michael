export const COMMON_BOOK_ID = "common";
export const ENTRANCE_TEST_BOOK_ID = "entrance-test";

export function isCommonBook(bookId: string): boolean {
  return bookId === COMMON_BOOK_ID;
}

export function isEntranceTestBook(bookId: string): boolean {
  return bookId === ENTRANCE_TEST_BOOK_ID;
}

export function isExamBook(bookId: string): boolean {
  return !isCommonBook(bookId);
}

/** Bộ đề admin catalog. Entrance tests use /admin/entrance-test. */
export function isManagedExamBook(bookId: string): boolean {
  return isExamBook(bookId) && !isEntranceTestBook(bookId);
}

/** Full-form question-number QA. Entrance tests may contain fewer questions. */
export function enforceOfficialQuestionNumberQa(bookId: string): boolean {
  return !isEntranceTestBook(bookId);
}
