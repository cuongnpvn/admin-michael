import { AdminDictationTable } from "@/components/admin/dictation/admin-dictation-table";
import {
  ImportDictationDialog,
  PublishDictationDialog,
} from "@/components/admin/dictation/import-dictation-dialog";
import { loadAdminDictation } from "@/lib/admin/dictation/load-admin-dictation";
import { loadAdminExamCatalog } from "@/lib/admin/load-section-admin-data";
import { copy } from "@/lib/copy/vi";

export default async function AdminDictationPage() {
  const [groups, catalog] = await Promise.all([
    loadAdminDictation(),
    loadAdminExamCatalog(),
  ]);

  const books = catalog.books.map((book) => ({
    id: book.id,
    name: book.name,
    tests: book.tests.map((test) => ({
      id: test.id,
      label: test.label,
    })),
  }));

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 lg:px-8 lg:py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight">
            {copy.admin.dictationManage.title}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {copy.admin.dictationManage.subtitle}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PublishDictationDialog books={books} />
          <ImportDictationDialog books={books} />
        </div>
      </div>

      <AdminDictationTable groups={groups} />
    </div>
  );
}
