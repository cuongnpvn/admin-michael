import { redirect } from "next/navigation";
import { adminPartPath } from "@/lib/admin/admin-paths";

/** Prefer query-param exams URLs: /admin/exams?bookId=&testId=&part= */
export default async function AdminExamPartPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookId: string; testId: string; part: string }>;
  searchParams: Promise<{ question?: string }>;
}) {
  const { bookId, testId, part } = await params;
  const { question } = await searchParams;
  const partNum = Number.parseInt(part, 10);
  redirect(adminPartPath(bookId, testId, partNum, question));
}
