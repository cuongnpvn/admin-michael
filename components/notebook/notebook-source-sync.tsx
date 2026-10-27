"use client";

import { useEffect } from "react";
import { useOptionalNotebook } from "@/components/notebook/notebook-provider";
import type { NotebookNoteSourceSection } from "@/lib/notebook/types";

interface NotebookSourceSyncProps {
  enabled?: boolean;
  bookId?: string;
  testId?: string;
  bookName?: string;
  testLabel?: string;
  section?: NotebookNoteSourceSection;
  part?: number;
  setId?: string;
  groupId?: string;
  questionNumber?: number;
}

export function NotebookSourceSync({
  enabled = true,
  bookId,
  testId,
  bookName,
  testLabel,
  section,
  part,
  setId,
  groupId,
  questionNumber,
}: NotebookSourceSyncProps) {
  const notebook = useOptionalNotebook();

  useEffect(() => {
    if (!notebook) return;

    const { setSourceOverrides, clearSourceOverrides } = notebook;

    if (!enabled) {
      clearSourceOverrides();
      return;
    }

    setSourceOverrides({
      bookId,
      testId,
      bookName,
      testLabel,
      section,
      part,
      setId,
      groupId,
      questionNumber,
    });

    return () => clearSourceOverrides();
  }, [
    bookId,
    bookName,
    enabled,
    groupId,
    notebook,
    part,
    questionNumber,
    section,
    setId,
    testId,
    testLabel,
  ]);

  return null;
}
