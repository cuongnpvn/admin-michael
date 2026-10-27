import { redirect } from "next/navigation";
import { adminPartPath } from "@/lib/admin/admin-paths";

/** Reading part CMS is temporarily folded into /admin/exams. */
export default async function AdminReadingPartPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookId: string; testId: string; part: string }>;
  searchParams: Promise<{ question?: string }>;
}) {
  const { bookId, testId, part } = await params;
  const { question } = await searchParams;
  const partNum = Number.parseInt(part, 10);
  redirect(adminPartPath(bookId, testId, partNum, question, "reading"));
}
