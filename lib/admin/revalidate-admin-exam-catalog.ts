import { revalidatePath } from "next/cache";
import { ADMIN_ENTRANCE_TEST_PATH } from "@/lib/admin/admin-paths";
import { notifyLearnerRevalidate } from "@/lib/learner-revalidate";

/** Exam CMS and the entrance-test CMS share the same catalog mutations. */
export function revalidateAdminExamCatalogPaths(
  bookId?: string,
  testId?: string,
): void {
  revalidatePath("/exams");
  revalidatePath(ADMIN_ENTRANCE_TEST_PATH);
  if (bookId && testId) {
    notifyLearnerRevalidate({ scope: "content", bookId, testId });
  }
}

export function revalidateLearnerPublishedCatalog(): void {
  notifyLearnerRevalidate({ scope: "catalog" });
}
