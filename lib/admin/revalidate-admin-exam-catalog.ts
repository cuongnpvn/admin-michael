import { revalidatePath } from "next/cache";
import { ADMIN_ENTRANCE_TEST_PATH } from "@/lib/admin/admin-paths";

/** Exam CMS and the entrance-test CMS share the same catalog mutations. */
export function revalidateAdminExamCatalogPaths(): void {
  revalidatePath("/admin/exams");
  revalidatePath(ADMIN_ENTRANCE_TEST_PATH);
}
