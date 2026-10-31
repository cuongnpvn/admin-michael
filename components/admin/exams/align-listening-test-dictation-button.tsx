"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Split } from "lucide-react";
import { toast } from "sonner";
import { alignListeningGroupTurns } from "@/lib/admin/content/listening-group-turn-alignment-actions";
import { alignListeningShortItem } from "@/lib/admin/content/listening-short-item-alignment-actions";
import {
  listListeningTestDictationTargets,
  syncListeningTestDictation,
} from "@/lib/admin/content/listening-test-dictation-actions";
import { GEMINI_EXTRACT_CONCURRENCY } from "@/lib/admin/gemini/constants";
import { runWithConcurrency } from "@/lib/admin/gemini/run-with-concurrency";
import { copy } from "@/lib/copy/vi";
import { Button } from "@/components/ui/button";

export function AlignListeningTestDictationButton({
  bookId,
  testId,
  disabled,
}: {
  bookId: string;
  testId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const labels = copy.admin.cms.turnAlignment;
  const [isRunning, setIsRunning] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  async function handleAlign() {
    setIsRunning(true);
    setDoneCount(0);
    setTotalCount(0);

    try {
      const listed = await listListeningTestDictationTargets(bookId, testId);
      if (!listed.ok) {
        toast.error(listed.error);
        return;
      }
      if (listed.total === 0) {
        toast.error(labels.wholeTestEmpty);
        return;
      }

      setTotalCount(listed.pending.length);
      const results = await runWithConcurrency(
        listed.pending,
        GEMINI_EXTRACT_CONCURRENCY,
        async (target) => {
          const result =
            target.kind === "group"
              ? await alignListeningGroupTurns(bookId, testId, target.id)
              : await alignListeningShortItem(bookId, testId, target.id);
          setDoneCount((current) => current + 1);
          return { target, result };
        },
      );

      const failures = results.flatMap((entry) =>
        entry.result.ok ? [] : [{ target: entry.target, error: entry.result.error }],
      );
      const synced = await syncListeningTestDictation(bookId, testId);
      if (!synced.ok) {
        toast.error(synced.error);
        return;
      }

      if (failures.length === 0) {
        toast.success(labels.wholeTestSuccess(synced.count));
      } else {
        const details = failures
          .slice(0, 3)
          .map((entry) => `${entry.target.label}: ${entry.error}`)
          .join(" ");
        const extra = failures.length > 3 ? ` (+${failures.length - 3})` : "";
        toast.error(
          `${labels.wholeTestPartial(results.length - failures.length, listed.pending.length)} ${details}${extra}`,
        );
      }

      router.refresh();
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled || isRunning}
      onClick={() => void handleAlign()}
    >
      <Split className="size-4" />
      {isRunning
        ? labels.wholeTestGenerating(doneCount, totalCount)
        : labels.wholeTest}
    </Button>
  );
}
