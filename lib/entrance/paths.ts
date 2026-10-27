export const ENTRANCE_TEST_COOKIE = "entrance_test_id";
export const ENTRANCE_TEST_RESULT_STORAGE_KEY = "entrance-test-result";

export const ENTRANCE_TEST_BEGIN_PATH = "/entrance-test/begin";
export const ENTRANCE_TEST_READY_PATH = "/entrance-test";
export const ENTRANCE_TEST_SESSION_PATH = "/entrance-test/session";
export const ENTRANCE_TEST_RESULT_PATH = "/entrance-test/result";
export const ENTRANCE_TEST_COOKIE_PATH = "/entrance-test";

export function entranceTestBeginHref(again = false): string {
  return again
    ? `${ENTRANCE_TEST_BEGIN_PATH}?again=1`
    : ENTRANCE_TEST_BEGIN_PATH;
}

/** Assigns a test, then opens the exam. The intro page stays on the ready path. */
export function entranceTestStartHref(): string {
  return `${ENTRANCE_TEST_BEGIN_PATH}?to=session`;
}
