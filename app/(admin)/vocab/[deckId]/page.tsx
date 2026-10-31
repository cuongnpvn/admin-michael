import { notFound } from "next/navigation";
import { AdminVocabDeckHeader } from "@/components/admin/vocab/admin-vocab-deck-header";
import { AdminVocabDeckWords } from "@/components/admin/vocab/admin-vocab-deck-words";
import { copy } from "@/lib/copy/vi";
import {
  loadDeckById,
  loadDeckVocabulary,
  loadDeckVocabularySummary,
} from "@/lib/vocabulary/load-deck-vocabulary";
import { createClient } from "@/lib/supabase/server";

interface AdminVocabDeckPageProps {
  params: Promise<{ deckId: string }>;
}

export default async function AdminVocabDeckPage({
  params,
}: AdminVocabDeckPageProps) {
  const { deckId } = await params;
  const supabase = await createClient();
  const deck = await loadDeckById(supabase, deckId);

  if (!deck) notFound();

  const [summaryItems, loadedItems] = await Promise.all([
    loadDeckVocabularySummary(supabase, deckId),
    loadDeckVocabulary(supabase, deckId),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:px-8 lg:py-10">
      <AdminVocabDeckHeader
        deckId={deckId}
        name={deck.name}
        published={deck.published}
        wordCount={summaryItems.length}
      />

      <div className="mt-8">
        {summaryItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {copy.admin.vocabulary.emptySection}
          </p>
        ) : (
          <AdminVocabDeckWords
            deckId={deckId}
            deckName={deck.name}
            items={summaryItems}
            loadedItems={loadedItems}
          />
        )}
      </div>
    </div>
  );
}
