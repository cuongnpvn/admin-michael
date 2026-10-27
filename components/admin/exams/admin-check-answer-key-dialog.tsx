"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import {
  checkExamAnswerKey,
} from "@/lib/admin/answer-key/actions";
import type { CheckAnswerKeyResult } from "@/lib/admin/answer-key/check-answer-key";
import { adminAnswerKeysPath } from "@/lib/admin/admin-paths";
import { copy } from "@/lib/copy/vi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AdminCheckAnswerKeyDialogProps {
  bookId: string;
  testId: string;
}

export function AdminCheckAnswerKeyDialog({
  bookId,
  testId,
}: AdminCheckAnswerKeyDialogProps) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<CheckAnswerKeyResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const t = copy.admin.exams.checkAnswerKey;

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setResult(null);
      return;
    }

    setResult(null);
    startTransition(async () => {
      const response = await checkExamAnswerKey(bookId, testId);
      if (!response.ok) {
        toast.error(response.error);
        return;
      }
      setResult(response.result);
    });
  }

  const extras =
    result != null
      ? t.summaryExtras(
          result.summary.questionUnset,
          result.summary.missingAnswerKey,
          result.summary.missingQuestion,
        )
      : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" disabled={isPending}>
          <ClipboardCheck className="size-4" />
          {t.action}
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] max-w-lg flex-col gap-4">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        {isPending && (
          <p className="text-sm text-muted-foreground">{t.checking}</p>
        )}

        {!isPending && result && !result.hasAnswerKeys && (
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">{t.noKeys}</p>
            <Button asChild variant="outline" size="sm">
              <Link href={adminAnswerKeysPath()}>{t.noKeysLink}</Link>
            </Button>
          </div>
        )}

        {!isPending && result && result.hasAnswerKeys && (
          <div className="min-h-0 flex-1 space-y-3 overflow-hidden">
            <div className="space-y-1 text-sm">
              <p className="font-medium">
                {t.summary(
                  result.summary.matched,
                  result.summary.mismatched,
                  result.summary.questionCount,
                  result.summary.answerKeyCount,
                )}
              </p>
              {extras && (
                <p className="text-muted-foreground">{extras}</p>
              )}
              {result.summary.mismatched === 0 && (
                <p className="text-emerald-700 dark:text-emerald-400">
                  {t.allMatch}
                </p>
              )}
            </div>

            {result.mismatches.length > 0 ? (
              <div className="max-h-[45vh] overflow-auto rounded-md border">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-background">
                    <tr className="border-b text-muted-foreground">
                      <th className="px-3 py-2 font-medium">{t.colPart}</th>
                      <th className="px-3 py-2 font-medium">{t.colNumber}</th>
                      <th className="px-3 py-2 font-medium">
                        {t.colQuestion}
                      </th>
                      <th className="px-3 py-2 font-medium">
                        {t.colAnswerKey}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.mismatches.map((row) => (
                      <tr
                        key={row.globalItemNumber}
                        className="border-b last:border-0"
                      >
                        <td className="px-3 py-2">{row.part}</td>
                        <td className="px-3 py-2">{row.globalItemNumber}</td>
                        <td className="px-3 py-2 font-medium text-destructive">
                          {row.questionLabel ?? "—"}
                        </td>
                        <td className="px-3 py-2 font-medium">
                          {row.answerKeyLabel}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            {t.close}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
