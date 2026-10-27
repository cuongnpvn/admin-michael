"use client";

import { useEffect, useState } from "react";
import { Check, NotebookPen, Plus } from "lucide-react";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { AddVocabToDeckSheet } from "@/components/vocabulary/add-vocab-to-deck-sheet";
import { CefrLevelBadge } from "@/components/vocabulary/vocabulary-item-detail-parts";
import { useOptionalNotebook } from "@/components/notebook/notebook-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { captureNotebookSource } from "@/lib/notebook/capture-source";
import {
  defaultVocabularyNoteTags,
  formatVocabularyNoteBody,
} from "@/lib/notebook/format-vocabulary-note-body";
import { NOTEBOOK_SELECTABLE_ATTR } from "@/lib/notebook/types";
import { useAuth } from "@/lib/auth/use-auth";
import { copy } from "@/lib/copy/vi";
import type { VocabularySummaryItem } from "@/lib/vocabulary/load-deck-vocabulary";
import { prefetchMyVocabularyDecks } from "@/lib/vocabulary/use-my-vocabulary-decks-cache";
import { cn } from "@/lib/utils";

interface VocabularyWordGridProps {
  items: VocabularySummaryItem[];
  deckId: string;
  deckName: string;
  className?: string;
  onItemClick?: (item: VocabularySummaryItem) => void;
  selectionMode?: boolean;
  selectedIds?: ReadonlySet<string>;
  onToggleSelect?: (item: VocabularySummaryItem) => void;
  /** Learner quick-add buttons (deck / notebook). Off in admin CMS. */
  showLearnerActions?: boolean;
}

function WordTypeBadge({ wordTypes }: { wordTypes: string[] }) {
  if (wordTypes.length === 0) return null;

  return (
    <span className="text-xs italic text-muted-foreground">
      {wordTypes.join(", ")}
    </span>
  );
}

function VocabularyWordCard({
  item,
  onAddToNotebook,
  onAddToDeck,
  onItemClick,
  selectionMode = false,
  selected = false,
  onToggleSelect,
  showLearnerActions = true,
  canAddToNotebook = true,
}: {
  item: VocabularySummaryItem;
  onAddToNotebook: (item: VocabularySummaryItem) => void;
  onAddToDeck: (item: VocabularySummaryItem) => void;
  onItemClick?: (item: VocabularySummaryItem) => void;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (item: VocabularySummaryItem) => void;
  showLearnerActions?: boolean;
  canAddToNotebook?: boolean;
}) {
  const clickable = selectionMode
    ? Boolean(onToggleSelect)
    : Boolean(onItemClick);

  function handleActivate() {
    if (selectionMode) {
      onToggleSelect?.(item);
      return;
    }
    onItemClick?.(item);
  }

  return (
    <Card
      className={cn(
        "flex h-full flex-col",
        clickable && "cursor-pointer transition-calm hover:-translate-y-px hover:shadow-card",
        selectionMode && selected && "ring-2 ring-primary shadow-card",
        selectionMode && !selected && "opacity-90",
      )}
      onClick={clickable ? handleActivate : undefined}
      onKeyDown={
        clickable
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleActivate();
              }
            }
          : undefined
      }
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-pressed={selectionMode ? selected : undefined}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <CardTitle className="text-base font-semibold leading-snug">
                {item.term}
              </CardTitle>
              <CefrLevelBadge level={item.level} />
              <WordTypeBadge wordTypes={item.wordTypes} />
            </div>
          </div>
          {selectionMode ? (
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full border",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border-subtle text-transparent",
              )}
              aria-hidden
            >
              <Check className="size-4" />
            </span>
          ) : showLearnerActions ? (
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="size-8 px-0 text-muted-foreground hover:text-foreground"
                aria-label={copy.vocab.quickAdd.add}
                title={copy.vocab.quickAdd.add}
                onClick={(event) => {
                  event.stopPropagation();
                  onAddToDeck(item);
                }}
              >
                <Plus className="size-4" />
              </Button>
              {canAddToNotebook ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="size-8 shrink-0 px-0"
                  aria-label={copy.notebook.addFromVocab}
                  title={copy.notebook.addFromVocab}
                  onClick={(event) => {
                    event.stopPropagation();
                    onAddToNotebook(item);
                  }}
                >
                  <NotebookPen className="size-4" />
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent
        className="mt-auto pt-0"
        {...{ [NOTEBOOK_SELECTABLE_ATTR]: "" }}
      >
        {item.meaningVi ? (
          <p className="line-clamp-1 text-sm text-muted-foreground">
            {item.meaningVi}
          </p>
        ) : (
          <p className="min-h-5 text-sm text-muted-foreground">&nbsp;</p>
        )}
      </CardContent>
    </Card>
  );
}

export function VocabularyWordGrid({
  items,
  deckId,
  deckName,
  className,
  onItemClick,
  selectionMode = false,
  selectedIds,
  onToggleSelect,
  showLearnerActions = true,
}: VocabularyWordGridProps) {
  const notebook = useOptionalNotebook();
  const { user } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [selectedItem, setSelectedItem] =
    useState<VocabularySummaryItem | null>(null);
  const [pendingItem, setPendingItem] =
    useState<VocabularySummaryItem | null>(null);

  useEffect(() => {
    if (!showLearnerActions) return;
    prefetchMyVocabularyDecks(user?.id);
  }, [showLearnerActions, user?.id]);

  useEffect(() => {
    if (user && pendingItem && !authOpen) {
      setSelectedItem(pendingItem);
      setPendingItem(null);
      setSheetOpen(true);
    }
  }, [authOpen, pendingItem, user]);

  function handleAddToNotebook(item: VocabularySummaryItem) {
    if (!notebook) return;

    const source = captureNotebookSource({
      section: "vocabulary",
    });

    notebook.openNoteDrawer({
      word: item.term,
      body: formatVocabularyNoteBody(
        {
          ipaUs: item.ipaUs,
          ipaUk: item.ipaUk,
          wordTypes: item.wordTypes,
          meaningVi: item.meaningVi,
          definitionEn: item.definitionEn,
          example: item.example,
          synonyms: item.synonyms,
          collocations: item.collocations,
          level: item.level,
        },
        {
          synonyms: copy.vocab.practice.synonymsLabel,
          collocations: copy.vocab.practice.collocationsLabel,
          englishPrefix: copy.vocab.practice.englishLabel,
          example: copy.vocab.practice.exampleLabel,
          level: copy.vocab.manage.fields.level,
        },
      ),
      tags: defaultVocabularyNoteTags({ collocations: item.collocations }),
      source: {
        ...source,
        vocabularyItemId: item.id,
        deckId,
        deckName,
      },
    });
  }

  function handleAddToDeck(item: VocabularySummaryItem) {
    if (!user) {
      setPendingItem(item);
      setAuthOpen(true);
      return;
    }

    setSelectedItem(item);
    setSheetOpen(true);
  }

  function handleAuthOpenChange(open: boolean) {
    setAuthOpen(open);
    if (!open && !user) {
      setPendingItem(null);
    }
  }

  return (
    <>
      <div
        className={cn(
          "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
          className,
        )}
      >
        {items.map((item) => (
          <VocabularyWordCard
            key={item.id}
            item={item}
            onAddToNotebook={handleAddToNotebook}
            onAddToDeck={handleAddToDeck}
            onItemClick={onItemClick}
            selectionMode={selectionMode}
            selected={selectedIds?.has(item.id) ?? false}
            onToggleSelect={onToggleSelect}
            showLearnerActions={showLearnerActions}
            canAddToNotebook={Boolean(notebook)}
          />
        ))}
      </div>

      {showLearnerActions ? (
        <>
          <AddVocabToDeckSheet
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            summaryItem={selectedItem}
          />
          <AuthDialog open={authOpen} onOpenChange={handleAuthOpenChange} />
        </>
      ) : null}
    </>
  );
}
