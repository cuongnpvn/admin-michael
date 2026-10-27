import { redirect } from "next/navigation";

/** Reading admin catalog is folded into /admin/exams?section=reading. */
export default function AdminReadingPage() {
  redirect("/admin/exams?section=reading");
}
