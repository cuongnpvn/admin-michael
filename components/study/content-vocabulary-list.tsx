"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { AddVocabToDeckSheet } from "@/components/vocabulary/add-vocab-to-deck-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ContentVocabularyWord } from "@/lib/content/content-vocabulary";
import { useAuth } from "@/lib/auth/use-auth";
import { copy } from "@/lib/copy/vi";
import { prefetchMyVocabularyDecks } from "@/lib/vocabulary/use-my-vocabulary-decks-cache";
import { cn } from "@/lib/utils";

function formatIpa(ipa: ContentVocabularyWord["ipa"]): string {
  const us = ipa[0]?.trim() ?? "";
  const uk = ipa[1]?.trim() ?? "";
  if (us && uk && us !== uk) return `${us} · ${uk}`;
  return us || uk;
}

interface ContentVocabularyListProps {
  words: ContentVocabularyWord[] | null | undefined;
  className?: string;
}

export function ContentVocabularyList({
  words,
  className,
}: ContentVocabularyListProps) {
  const { user } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [selectedWord, setSelectedWord] =
    useState<ContentVocabularyWord | null>(null);
  const [pendingWord, setPendingWord] =
    useState<ContentVocabularyWord | null>(null);

  useEffect(() => {
    prefetchMyVocabularyDecks(user?.id);
  }, [user?.id]);

  useEffect(() => {
    if (user && pendingWord && !authOpen) {
      setSelectedWord(pendingWord);
      setPendingWord(null);
      setSheetOpen(true);
    }
  }, [authOpen, pendingWord, user]);

  if (!words || words.length === 0) return null;

  function handleAddClick(word: ContentVocabularyWord) {
    if (!user) {
      setPendingWord(word);
      setAuthOpen(true);
      return;
    }

    setSelectedWord(word);
    setSheetOpen(true);
  }

  function handleAuthOpenChange(open: boolean) {
    setAuthOpen(open);
    if (!open && !user) {
      setPendingWord(null);
    }
  }

  return (
    <>
      <section className={cn("space-y-3", className)}>
        <ul className="space-y-4 max-lg:space-y-2.5">
          {words.map((word) => {
            const ipa = formatIpa(word.ipa);
            return (
              <li key={word.term.toLowerCase()} className="space-y-1">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="text-sm font-medium text-foreground">
                        {word.term}
                      </span>
                      {ipa ? (
                        <span className="text-sm italic text-muted-foreground">
                          {ipa}
                        </span>
                      ) : null}
                      {word.level ? (
                        <Badge
                          variant="secondary"
                          className="rounded-full px-2 py-0 text-[10px]"
                        >
                          {word.level}
                        </Badge>
                      ) : null}
                      {word.wordType ? (
                        <Badge
                          variant="outline"
                          className="rounded-full px-2 py-0 text-[10px]"
                        >
                          {word.wordType}
                        </Badge>
                      ) : null}
                    </div>
                    {word.definitionEn.trim() ? (
                      <p className="text-sm leading-snug text-foreground">
                        {word.definitionEn}
                      </p>
                    ) : null}
                    {word.meaningVi.trim() ? (
                      <p className="text-sm leading-snug text-muted-foreground">
                        {word.meaningVi}
                      </p>
                    ) : null}
                    {word.example?.trim() ? (
                      <p className="text-sm leading-snug italic text-muted-foreground">
                        {word.example}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={() => handleAddClick(word)}
                    aria-label={copy.vocab.quickAdd.add}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <AddVocabToDeckSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        word={selectedWord}
      />
      <AuthDialog open={authOpen} onOpenChange={handleAuthOpenChange} />
    </>
  );
}
