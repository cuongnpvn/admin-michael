import { redirect } from "next/navigation";

/** Reading admin catalog is folded into /exams?section=reading. */
export default function AdminReadingPage() {
  redirect("/exams?section=reading");
}
