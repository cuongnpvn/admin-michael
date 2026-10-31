import { after } from "next/server";

type LearnerRevalidateBody =
  | { scope: "content"; bookId: string; testId: string }
  | { scope: "catalog" }
  | { scope: "vocabulary" }
  | { scope: "all"; tests: Array<{ bookId: string; testId: string }> };

/** Ask the learner app to drop its published-content cache. No-op without URL and secret. */
export function notifyLearnerRevalidate(body: LearnerRevalidateBody): void {
  const url = process.env.LEARNER_REVALIDATE_URL?.trim();
  const secret = process.env.LEARNER_REVALIDATE_SECRET?.trim();
  if (!url || !secret) return;

  after(async () => {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          authorization: `Bearer ${secret}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
        signal: AbortSignal.timeout(5_000),
      });
      if (!response.ok) {
        console.error("Learner revalidate failed", response.status);
      }
    } catch (error) {
      console.error(
        "Learner revalidate failed",
        error instanceof Error ? error.message : "request failed",
      );
    }
  });
}
