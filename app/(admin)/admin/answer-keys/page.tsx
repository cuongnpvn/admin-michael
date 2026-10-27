import { AdminAnswerKeyWorkspace } from "@/components/admin/answer-key/admin-answer-key-workspace";
import { loadAdminInstruction } from "@/lib/admin/instructions/load-instructions";
import { copy } from "@/lib/copy/vi";

export default async function AdminAnswerKeysPage() {
  const instruction = await loadAdminInstruction("answer-key");

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 lg:px-8 lg:py-10">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">
          {copy.admin.answerKey.title}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {copy.admin.answerKey.subtitle}
        </p>
      </div>

      <AdminAnswerKeyWorkspace promptContent={instruction?.content ?? ""} />
    </div>
  );
}
