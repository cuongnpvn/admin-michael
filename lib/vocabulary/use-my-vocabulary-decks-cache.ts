"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  listMyVocabularyDecks,
  type MyVocabularyDeckOption,
} from "@/lib/vocabulary/user-deck-actions";

type DecksCacheSnapshot = {
  userId: string | null;
  decks: MyVocabularyDeckOption[];
  error: string | null;
  loaded: boolean;
  loading: boolean;
};

const EMPTY_SNAPSHOT: DecksCacheSnapshot = {
  userId: null,
  decks: [],
  error: null,
  loaded: false,
  loading: false,
};

let cache: DecksCacheSnapshot = EMPTY_SNAPSHOT;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return cache;
}

function resetCache() {
  cache = EMPTY_SNAPSHOT;
  inflight = null;
  emit();
}

async function loadDecks(userId: string, force = false) {
  if (!force && cache.userId === userId && cache.loaded) {
    return;
  }

  if (inflight && cache.userId === userId && !force) {
    await inflight;
    return;
  }

  cache = {
    userId,
    decks: force ? cache.decks : [],
    error: null,
    loaded: force ? cache.loaded : false,
    loading: true,
  };
  emit();

  inflight = (async () => {
    const result = await listMyVocabularyDecks();
    if (cache.userId !== userId) return;

    if (result.ok) {
      cache = {
        userId,
        decks: result.decks,
        error: null,
        loaded: true,
        loading: false,
      };
    } else {
      cache = {
        userId,
        decks: [],
        error: result.error,
        loaded: true,
        loading: false,
      };
    }
    emit();
    inflight = null;
  })();

  await inflight;
}

export function useMyVocabularyDecksCache(userId: string | undefined) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (!userId) {
      if (cache.userId != null) {
        resetCache();
      }
      return;
    }

    void loadDecks(userId);
  }, [userId]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    await loadDecks(userId, true);
  }, [userId]);

  const prependDeck = useCallback(
    (deck: MyVocabularyDeckOption) => {
      if (!userId || cache.userId !== userId) return;

      cache = {
        ...cache,
        decks: [deck, ...cache.decks.filter((entry) => entry.id !== deck.id)],
        loaded: true,
        loading: false,
        error: null,
      };
      emit();
    },
    [userId],
  );

  if (snapshot.userId !== userId) {
    return {
      decks: [] as MyVocabularyDeckOption[],
      error: null,
      loaded: false,
      loading: Boolean(userId),
      refresh,
      prependDeck,
    };
  }

  return {
    decks: snapshot.decks,
    error: snapshot.error,
    loaded: snapshot.loaded,
    loading: snapshot.loading,
    refresh,
    prependDeck,
  };
}

/** Prefetch deck options for the current page when the user is signed in. */
export function prefetchMyVocabularyDecks(userId: string | undefined) {
  if (!userId) return;
  void loadDecks(userId);
}
