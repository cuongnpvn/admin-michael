"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { copy } from "@/lib/copy/vi";
import {
  findLookupHistoryItem,
  lookupHistoryItemKey,
  prependLookupHistory,
  readLookupHistory,
  type LookupHistoryItem,
} from "@/lib/dictionary/lookup-history";
import {
  lookupDictionaryWordWithAi,
  type DictionaryLookupResult,
} from "@/lib/notebook/actions";
import {
  getLookupSessionCache,
  setLookupSessionCache,
} from "@/lib/notebook/lookup-session-cache";
import { prefetchMyVocabularyDecks } from "@/lib/vocabulary/use-my-vocabulary-decks-cache";
import type { VocabularyItemPayload } from "@/lib/vocabulary/vocabulary-item-payload";

type PrefetchApi = {
  getCachedResult: (word: string) => DictionaryLookupResult | null;
  resolveLookup: (word: string) => Promise<DictionaryLookupResult>;
};

export type DictionaryLookupResultState = {
  word: string;
  body: string;
  payload: VocabularyItemPayload | null;
  lookedUpAt: string;
};

function sameTerm(a: string, b: string): boolean {
  return (
    a.localeCompare(b, undefined, {
      sensitivity: "accent",
    }) === 0
  );
}

export function useDictionaryLookup(options: {
  open: boolean;
  word: string;
  sentenceContext?: string;
  userId: string | null;
  dictionaryPrefetch: PrefetchApi;
}) {
  const { open, word, sentenceContext, userId, dictionaryPrefetch } = options;
  const { resolveLookup, getCachedResult } = dictionaryPrefetch;
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [result, setResult] = useState<DictionaryLookupResultState | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<LookupHistoryItem[]>([]);
  const [focusedHistoryKey, setFocusedHistoryKey] = useState<string | null>(
    null,
  );
  const requestIdRef = useRef(0);

  const trimmedWord = word.trim();

  const persistResult = useCallback(
    (
      nextWord: string,
      body: string,
      payload: VocabularyItemPayload | null,
    ) => {
      const lookedUpAt = new Date().toISOString();
      setResult({
        word: nextWord,
        body,
        payload,
        lookedUpAt,
      });
      setError(null);
      setFocusedHistoryKey(null);

      if (!userId) return;

      setHistory(
        prependLookupHistory(userId, {
          word: nextWord,
          body,
          payload,
          lookedUpAt,
          sentenceContext,
          queriedWord: trimmedWord,
        }),
      );
    },
    [sentenceContext, trimmedWord, userId],
  );

  useEffect(() => {
    if (!open) {
      requestIdRef.current += 1;
      setIsLookingUp(false);
      setResult(null);
      setError(null);
      setFocusedHistoryKey(null);
      setHistory([]);
      return;
    }

    const stored = userId ? readLookupHistory(userId) : [];
    setHistory(stored);

    if (!trimmedWord) {
      setError(copy.notebook.errors.wordRequired);
      setResult(null);
      setFocusedHistoryKey(null);
      return;
    }

    const existing = findLookupHistoryItem(stored, trimmedWord);
    if (existing) {
      requestIdRef.current += 1;
      setFocusedHistoryKey(lookupHistoryItemKey(existing));
      setResult(null);
      setError(null);
      setIsLookingUp(false);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setFocusedHistoryKey(null);

    const sessionCached = getLookupSessionCache(trimmedWord, sentenceContext);
    if (sessionCached) {
      const resolvedWord = sessionCached.payload?.term.trim() || trimmedWord;
      persistResult(resolvedWord, sessionCached.body, sessionCached.payload);
      setIsLookingUp(false);
      return;
    }

    let cancelled = false;
    setError(null);
    setResult(null);
    setIsLookingUp(true);

    void (async () => {
      try {
        const aiResult = await lookupDictionaryWordWithAi(
          trimmedWord,
          sentenceContext,
        );
        if (cancelled || requestId !== requestIdRef.current) return;

        if (aiResult.ok) {
          const resolvedWord = aiResult.payload.term.trim() || trimmedWord;
          setLookupSessionCache(trimmedWord, sentenceContext, {
            body: aiResult.body,
            payload: aiResult.payload,
          });
          persistResult(resolvedWord, aiResult.body, aiResult.payload);
          return;
        }

        const cached = getCachedResult(trimmedWord);
        const fallback = cached ?? (await resolveLookup(trimmedWord));
        if (cancelled || requestId !== requestIdRef.current) return;

        if (fallback.ok) {
          setLookupSessionCache(trimmedWord, sentenceContext, {
            body: fallback.body,
            payload: null,
          });
          persistResult(trimmedWord, fallback.body, null);
          return;
        }

        if (
          aiResult.error === copy.user.errors.notSignedIn ||
          fallback.error === copy.user.errors.notSignedIn
        ) {
          setError(copy.user.errors.notSignedIn);
          return;
        }

        setError(copy.notebook.errors.lookupFailed);
      } finally {
        if (!cancelled && requestId === requestIdRef.current) {
          setIsLookingUp(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    getCachedResult,
    open,
    persistResult,
    resolveLookup,
    sentenceContext,
    trimmedWord,
    userId,
  ]);

  const recentHistory = history.filter((item) => {
    if (!result) {
      return !sameTerm(item.word, trimmedWord);
    }
    return !sameTerm(item.word, result.word);
  });

  useEffect(() => {
    if (!result?.payload || !userId) return;
    prefetchMyVocabularyDecks(userId);
  }, [result?.payload, userId]);

  return {
    isLookingUp,
    result,
    error,
    recentHistory,
    history,
    focusedHistoryKey,
  };
}
