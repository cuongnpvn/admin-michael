"use client";

import { useEffect, useId, useRef } from "react";
import { NotebookMotionDrawer } from "@/components/notebook/notebook-motion-drawer";
import {
  DictionaryLookupResultCard,
  DictionaryLookupShimmerCard,
} from "@/components/notebook/dictionary-lookup-result-card";
import { useDictionaryLookup } from "@/components/notebook/use-dictionary-lookup";
import { useDictionaryPrefetch } from "@/components/notebook/use-dictionary-prefetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/use-auth";
import { copy } from "@/lib/copy/vi";
import {
  findLookupHistoryItem,
  lookupHistoryItemKey,
  readLookupHistory,
} from "@/lib/dictionary/lookup-history";

export type DictionaryLookupDrawerMode = {
  word: string;
  sentenceContext?: string;
};

interface DictionaryLookupDrawerProps {
  open: boolean;
  mode: DictionaryLookupDrawerMode | null;
  onOpenChange: (open: boolean) => void;
}

export function DictionaryLookupDrawer({
  open,
  mode,
  onOpenChange,
}: DictionaryLookupDrawerProps) {
  const { user } = useAuth();
  const titleId = useId();
  const word = mode?.word ?? "";
  const sentenceContext = mode?.sentenceContext;
  const trimmedWord = word.trim();
  const historyHit = Boolean(
    user?.id &&
      findLookupHistoryItem(readLookupHistory(user.id), trimmedWord),
  );
  const dictionaryPrefetch = useDictionaryPrefetch(
    word,
    open && Boolean(trimmedWord) && !historyHit,
  );
  const {
    isLookingUp,
    result,
    error,
    recentHistory,
    history,
    focusedHistoryKey,
  } = useDictionaryLookup({
    open,
    word,
    sentenceContext,
    userId: user?.id ?? null,
    dictionaryPrefetch,
  });

  const currentWord = result?.word || trimmedWord;
  const showHistoryOnly =
    Boolean(focusedHistoryKey) && !isLookingUp && !result && !error;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !focusedHistoryKey || !showHistoryOnly) return;

    const frame = window.requestAnimationFrame(() => {
      const card = scrollRef.current?.querySelector(
        `[data-lookup-history-key="${CSS.escape(focusedHistoryKey)}"]`,
      );
      card?.scrollIntoView({ block: "start", behavior: "smooth" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [focusedHistoryKey, open, showHistoryOnly]);

  return (
    <NotebookMotionDrawer
      open={open}
      onOpenChange={onOpenChange}
      ariaLabelledBy={titleId}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="shrink-0 border-b border-border px-6 pb-4 pt-6 text-left">
          <h2 id={titleId} className="text-lg font-semibold">
            {copy.notebook.lookupDrawerTitle}
          </h2>
        </header>

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto px-6 py-5"
        >
          <div className="space-y-4">
            {showHistoryOnly ? (
              <div className="space-y-3">
                {history.map((item) => {
                  const key = lookupHistoryItemKey(item);
                  return (
                    <div key={key} data-lookup-history-key={key}>
                      <DictionaryLookupResultCard
                        word={item.word}
                        body={item.body}
                        payload={item.payload}
                        lookedUpAt={item.lookedUpAt}
                        highlighted={key === focusedHistoryKey}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
                {isLookingUp || (!result && !error) ? (
                  <DictionaryLookupShimmerCard word={currentWord} />
                ) : result ? (
                  <DictionaryLookupResultCard
                    word={result.word}
                    body={result.body}
                    payload={result.payload}
                    lookedUpAt={result.lookedUpAt}
                  />
                ) : error ? (
                  <Card className="shadow-none">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base leading-snug">
                        {currentWord}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-sm text-destructive" role="alert">
                        {error}
                      </p>
                    </CardContent>
                  </Card>
                ) : null}

                {recentHistory.length > 0 ? (
                  <div className="space-y-3">
                    {recentHistory.map((item) => (
                      <DictionaryLookupResultCard
                        key={lookupHistoryItemKey(item)}
                        word={item.word}
                        body={item.body}
                        payload={item.payload}
                        lookedUpAt={item.lookedUpAt}
                      />
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </NotebookMotionDrawer>
  );
}
