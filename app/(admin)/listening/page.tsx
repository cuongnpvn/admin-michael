import { redirect } from "next/navigation";

/** Listening admin catalog is folded into /exams?section=listening. */
export default function AdminListeningPage() {
  redirect("/exams?section=listening");
}
