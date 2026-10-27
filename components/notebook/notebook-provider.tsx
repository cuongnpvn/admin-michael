"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AuthDialog } from "@/components/auth/auth-dialog";
import {
  DictionaryLookupDrawer,
  type DictionaryLookupDrawerMode,
} from "@/components/notebook/dictionary-lookup-drawer";
import {
  NotebookEntryDrawer,
  type NotebookDrawerMode,
} from "@/components/notebook/notebook-entry-drawer";
import {
  TextSelectionMenu,
} from "@/components/notebook/text-selection-menu";
import { useTextSelection } from "@/components/notebook/use-text-selection";
import { useAuth } from "@/lib/auth/use-auth";
import {
  captureNotebookSource,
  type NotebookSourceOverrides,
} from "@/lib/notebook/capture-source";
import { extractSentenceContextFromSelection } from "@/lib/notebook/extract-sentence-context";
import type { NotebookNoteSource } from "@/lib/notebook/types";
import type { NotebookNoteTagId } from "@/lib/notebook/tags";

export type OpenNoteDrawerPayload = {
  word: string;
  source?: NotebookNoteSource;
  body?: string;
  tags?: NotebookNoteTagId[];
};

export type OpenLookupDrawerPayload = {
  word: string;
  sentenceContext?: string;
};

type PendingSelection =
  | { kind: "note"; payload: OpenNoteDrawerPayload }
  | { kind: "lookup"; payload: OpenLookupDrawerPayload };

interface NotebookContextValue {
  openNoteDrawer: (payload: OpenNoteDrawerPayload) => void;
  openEditDrawer: (mode: Extract<NotebookDrawerMode, { kind: "edit" }>) => void;
  setSourceOverrides: (overrides: NotebookSourceOverrides) => void;
  clearSourceOverrides: () => void;
}

const NotebookContext = createContext<NotebookContextValue | null>(null);

export function useOptionalNotebook() {
  return useContext(NotebookContext);
}

export function useNotebook() {
  const context = useOptionalNotebook();
  if (!context) {
    throw new Error("useNotebook must be used within NotebookProvider");
  }
  return context;
}

interface NotebookProviderProps {
  children: ReactNode;
}

export function NotebookProvider({ children }: NotebookProviderProps) {
  const { user } = useAuth();
  const sourceOverridesRef = useRef<NotebookSourceOverrides>({});

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<NotebookDrawerMode | null>(
    null,
  );
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupMode, setLookupMode] =
    useState<DictionaryLookupDrawerMode | null>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [pendingSelection, setPendingSelection] =
    useState<PendingSelection | null>(null);

  const openNoteDrawer = useCallback(
    (payload: OpenNoteDrawerPayload) => {
      if (!user) {
        setPendingSelection({ kind: "note", payload });
        setAuthDialogOpen(true);
        return;
      }

      const source =
        payload.source ?? captureNotebookSource(sourceOverridesRef.current);

      setLookupOpen(false);
      setLookupMode(null);
      setDrawerMode({
        kind: "add",
        word: payload.word,
        source,
        body: payload.body,
        tags: payload.tags,
      });
      setDrawerOpen(true);
    },
    [user],
  );

  const openLookupDrawer = useCallback(
    (payload: OpenLookupDrawerPayload) => {
      if (!user) {
        setPendingSelection({ kind: "lookup", payload });
        setAuthDialogOpen(true);
        return;
      }

      setDrawerOpen(false);
      setDrawerMode(null);
      setLookupMode({
        word: payload.word,
        sentenceContext: payload.sentenceContext,
      });
      setLookupOpen(true);
    },
    [user],
  );

  const openEditDrawer = useCallback(
    (mode: Extract<NotebookDrawerMode, { kind: "edit" }>) => {
      setLookupOpen(false);
      setLookupMode(null);
      setDrawerMode(mode);
      setDrawerOpen(true);
    },
    [],
  );

  const setSourceOverrides = useCallback(
    (overrides: NotebookSourceOverrides) => {
      sourceOverridesRef.current = overrides;
    },
    [],
  );

  const clearSourceOverrides = useCallback(() => {
    sourceOverridesRef.current = {};
  }, []);

  const handleSelection = useCallback(() => {
    // menu state managed by useTextSelection
  }, []);

  const { menu, dismiss } = useTextSelection({
    enabled: true,
    onSelection: handleSelection,
  });

  useEffect(() => {
    if (user && pendingSelection && !authDialogOpen) {
      if (pendingSelection.kind === "note") {
        openNoteDrawer(pendingSelection.payload);
      } else {
        openLookupDrawer(pendingSelection.payload);
      }
      setPendingSelection(null);
    }
  }, [
    authDialogOpen,
    openLookupDrawer,
    openNoteDrawer,
    pendingSelection,
    user,
  ]);

  const captureSelection = useCallback(() => {
    if (!menu) return null;

    const word = menu.text;
    const sentenceContext =
      extractSentenceContextFromSelection(word) ?? undefined;
    dismiss();
    return { word, sentenceContext };
  }, [dismiss, menu]);

  const handleAddNoteFromMenu = useCallback(() => {
    const selection = captureSelection();
    if (!selection) return;
    openNoteDrawer({ word: selection.word });
  }, [captureSelection, openNoteDrawer]);

  const handleLookupFromMenu = useCallback(() => {
    const selection = captureSelection();
    if (!selection) return;
    openLookupDrawer({
      word: selection.word,
      sentenceContext: selection.sentenceContext,
    });
  }, [captureSelection, openLookupDrawer]);

  const handleAuthDialogChange = useCallback(
    (open: boolean) => {
      setAuthDialogOpen(open);
      if (!open && !user) {
        setPendingSelection(null);
      }
    },
    [user],
  );

  const value = useMemo(
    () => ({
      openNoteDrawer,
      openEditDrawer,
      setSourceOverrides,
      clearSourceOverrides,
    }),
    [clearSourceOverrides, openEditDrawer, openNoteDrawer, setSourceOverrides],
  );

  return (
    <NotebookContext.Provider value={value}>
      {children}
      <TextSelectionMenu
        menu={menu}
        onAddNote={handleAddNoteFromMenu}
        onLookup={handleLookupFromMenu}
        onDismiss={dismiss}
      />
      <NotebookEntryDrawer
        open={drawerOpen}
        mode={drawerMode}
        onOpenChange={setDrawerOpen}
      />
      <DictionaryLookupDrawer
        open={lookupOpen}
        mode={lookupMode}
        onOpenChange={setLookupOpen}
      />
      <AuthDialog open={authDialogOpen} onOpenChange={handleAuthDialogChange} />
    </NotebookContext.Provider>
  );
}
