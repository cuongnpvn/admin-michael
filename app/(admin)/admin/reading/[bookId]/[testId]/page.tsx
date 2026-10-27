import { redirect } from "next/navigation";
import { adminSectionTestPath } from "@/lib/admin/admin-paths";

/** Reading test overview is temporarily folded into /admin/exams. */
export default async function AdminReadingTestPage({
  params,
}: {
  params: Promise<{ bookId: string; testId: string }>;
}) {
  const { bookId, testId } = await params;
  redirect(adminSectionTestPath("reading", bookId, testId));
}
