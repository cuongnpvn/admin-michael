import { redirect } from "next/navigation";
import { adminExamsPath } from "@/lib/admin/admin-paths";

/** Prefer query-param exams URLs: /admin/exams?bookId=&testId= */
export default async function AdminTestPage({
  params,
}: {
  params: Promise<{ bookId: string; testId: string }>;
}) {
  const { bookId, testId } = await params;
  redirect(adminExamsPath(bookId, testId));
}
