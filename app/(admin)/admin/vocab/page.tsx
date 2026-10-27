import { AdminVocabDeckGrid } from "@/components/admin/vocab/admin-vocab-deck-grid";
import { CreateVocabDeckDialog } from "@/components/admin/vocab/create-vocab-deck-dialog";
import { fetchAdminVocabularyDecks } from "@/lib/admin/vocabulary/actions";
import { copy } from "@/lib/copy/vi";

export default async function AdminVocabPage() {
  const decks = await fetchAdminVocabularyDecks();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 lg:px-8 lg:py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight">
            {copy.admin.vocabManage.title}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {copy.admin.vocabManage.subtitle}
          </p>
        </div>
        <CreateVocabDeckDialog />
      </div>

      <AdminVocabDeckGrid decks={decks} />
    </div>
  );
}
