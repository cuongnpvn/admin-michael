import { redirect } from "next/navigation";
import { adminSectionTestPath } from "@/lib/admin/admin-paths";

/** Listening test overview is temporarily folded into /admin/exams. */
export default async function AdminListeningTestPage({
  params,
}: {
  params: Promise<{ bookId: string; testId: string }>;
}) {
  const { bookId, testId } = await params;
  redirect(adminSectionTestPath("listening", bookId, testId));
}
