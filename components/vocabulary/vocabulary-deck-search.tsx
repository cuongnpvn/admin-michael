"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { NotebookSourceSync } from "@/components/notebook/notebook-source-sync";
import { Input } from "@/components/ui/input";
import { VocabularyWordGrid } from "@/components/vocabulary/vocabulary-word-grid";
import { copy } from "@/lib/copy/vi";
import { filterVocabularySummaryItems } from "@/lib/vocabulary/filter-vocabulary-items";
import type { VocabularySummaryItem } from "@/lib/vocabulary/load-deck-vocabulary";

interface VocabularyDeckSearchProps {
  items: VocabularySummaryItem[];
  deckId: string;
  deckName: string;
  onItemClick?: (item: VocabularySummaryItem) => void;
  selectionMode?: boolean;
  selectedIds?: ReadonlySet<string>;
  onToggleSelect?: (item: VocabularySummaryItem) => void;
  /** Learner quick-add buttons (deck / notebook). Off in admin CMS. */
  showLearnerActions?: boolean;
}

export function VocabularyDeckSearch({
  items,
  deckId,
  deckName,
  onItemClick,
  selectionMode = false,
  selectedIds,
  onToggleSelect,
  showLearnerActions = true,
}: VocabularyDeckSearchProps) {
  const [query, setQuery] = useState("");

  const filteredItems = useMemo(
    () => filterVocabularySummaryItems(items, query),
    [items, query],
  );

  return (
    <div className="space-y-4">
      {showLearnerActions ? (
        <NotebookSourceSync section="vocabulary" />
      ) : null}
      <div className="flex items-center justify-between gap-4">
        <div className="relative min-w-0 max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.vocab.searchPlaceholder}
            className="pl-9"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <p className="shrink-0 text-muted-foreground">
          {copy.vocab.wordCount(items.length)}
        </p>
      </div>

      {filteredItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {copy.vocab.searchEmpty}
        </p>
      ) : (
        <VocabularyWordGrid
          items={filteredItems}
          deckId={deckId}
          deckName={deckName}
          onItemClick={onItemClick}
          selectionMode={selectionMode}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
          showLearnerActions={showLearnerActions}
        />
      )}
    </div>
  );
}
