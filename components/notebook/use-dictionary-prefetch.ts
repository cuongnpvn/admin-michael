"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  lookupDictionaryWord,
  type DictionaryLookupResult,
} from "@/lib/notebook/actions";

type PrefetchEntry = {
  word: string;
  promise: Promise<DictionaryLookupResult>;
  result?: DictionaryLookupResult;
};

export type DictionaryPrefetchStatus = "idle" | "loading" | "ready" | "error";

export function useDictionaryPrefetch(word: string, enabled: boolean) {
  const entryRef = useRef<PrefetchEntry | null>(null);
  const [status, setStatus] = useState<DictionaryPrefetchStatus>("idle");
  const trimmedWord = word.trim();

  useEffect(() => {
    if (!enabled || !trimmedWord) {
      entryRef.current = null;
      setStatus("idle");
      return;
    }

    if (
      entryRef.current?.word === trimmedWord &&
      entryRef.current.result !== undefined
    ) {
      setStatus(entryRef.current.result.ok ? "ready" : "error");
      return;
    }

    let cancelled = false;
    setStatus("loading");

    const promise = lookupDictionaryWord(trimmedWord);
    entryRef.current = { word: trimmedWord, promise };

    void promise.then((result) => {
      if (cancelled) {
        return;
      }

      if (entryRef.current?.word === trimmedWord) {
        entryRef.current = { word: trimmedWord, promise, result };
        setStatus(result.ok ? "ready" : "error");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, trimmedWord]);

  const resolveLookup = useCallback(
    async (targetWord: string): Promise<DictionaryLookupResult> => {
      const trimmed = targetWord.trim();
      const entry = entryRef.current;

      if (entry?.word === trimmed) {
        if (entry.result) {
          return entry.result;
        }

        return entry.promise;
      }

      const promise = lookupDictionaryWord(trimmed);
      entryRef.current = { word: trimmed, promise };
      const result = await promise;

      if (entryRef.current?.word === trimmed) {
        entryRef.current = { word: trimmed, promise, result };
        setStatus(result.ok ? "ready" : "error");
      }

      return result;
    },
    [],
  );

  const getCachedResult = useCallback(
    (targetWord: string): DictionaryLookupResult | null => {
      const trimmed = targetWord.trim();
      const entry = entryRef.current;

      if (entry?.word === trimmed && entry.result) {
        return entry.result;
      }

      return null;
    },
    [],
  );

  return {
    status,
    resolveLookup,
    getCachedResult,
  };
}
