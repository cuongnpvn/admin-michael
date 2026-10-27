import { redirect } from "next/navigation";

/** Listening admin catalog is folded into /admin/exams?section=listening. */
export default function AdminListeningPage() {
  redirect("/admin/exams?section=listening");
}
