"use client";

import { useEffect, useState, useTransition } from "react";
import { confirmTutorPractice } from "@/lib/lectures/tutor/confirm-tutor-practice";
import type { TutorPracticeSet } from "@/lib/lectures/tutor/types";
import { copy } from "@/lib/copy/vi";

export function useTutorPractice(lectureId: string) {
  const [open, setOpen] = useState(false);
  const [practiceSet, setPracticeSet] = useState<TutorPracticeSet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setOpen(false);
    setPracticeSet(null);
    setError(null);
  }, [lectureId]);

  function confirmOffer() {
    setOpen(true);
    setPracticeSet(null);
    setError(null);
    startTransition(async () => {
      try {
        const result = await confirmTutorPractice({ lectureId });
        if (!result.ok) {
          setPracticeSet(null);
          setError(result.error);
          return;
        }
        setError(null);
        setPracticeSet(result.set);
      } catch {
        setPracticeSet(null);
        setError(copy.lectures.tutorPracticeFailed);
      }
    });
  }

  return { open, setOpen, practiceSet, error, isPending, confirmOffer };
}
