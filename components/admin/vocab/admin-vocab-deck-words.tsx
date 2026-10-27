"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AdminVocabularyDetailDialog } from "@/components/admin/vocabulary/admin-vocabulary-detail-dialog";
import { VocabularyDeckSearch } from "@/components/vocabulary/vocabulary-deck-search";
import type {
  LoadedVocabularyItem,
  VocabularySummaryItem,
} from "@/lib/vocabulary/load-deck-vocabulary";

interface AdminVocabDeckWordsProps {
  deckId: string;
  deckName: string;
  items: VocabularySummaryItem[];
  loadedItems: LoadedVocabularyItem[];
}

export function AdminVocabDeckWords({
  deckId,
  deckName,
  items,
  loadedItems,
}: AdminVocabDeckWordsProps) {
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<LoadedVocabularyItem | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [, startTransition] = useTransition();

  function handleItemClick(summary: VocabularySummaryItem) {
    const item = loadedItems.find((entry) => entry.id === summary.id) ?? null;
    if (!item) return;
    setSelectedItem(item);
    setDialogOpen(true);
  }

  function handleDialogChange(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      startTransition(() => router.refresh());
    }
  }

  return (
    <>
      <VocabularyDeckSearch
        items={items}
        deckId={deckId}
        deckName={deckName}
        onItemClick={handleItemClick}
        showLearnerActions={false}
      />
      <AdminVocabularyDetailDialog
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        item={selectedItem}
        deckId={deckId}
      />
    </>
  );
}
