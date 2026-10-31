"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { syncListeningTestDictation } from "@/lib/admin/content/listening-test-dictation-actions";
import { publishDictationTest } from "@/lib/admin/dictation/publish-dictation-actions";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface DictationImportBook {
  id: string;
  name: string;
  tests: Array<{ id: string; label: string }>;
}

function DictationBookTestDialog({
  books,
  trigger,
  triggerVariant = "default",
  title,
  description,
  submitLabel,
  pendingLabel,
  onSubmit,
}: {
  books: DictationImportBook[];
  trigger: string;
  triggerVariant?: "default" | "outline";
  title: string;
  description: string;
  submitLabel: string;
  pendingLabel: string;
  onSubmit: (
    bookId: string,
    testId: string,
  ) => Promise<{ ok: true; message: string } | { ok: false; error: string }>;
}) {
  const router = useRouter();
  const labels = copy.admin.dictationManage;
  const [open, setOpen] = useState(false);
  const [bookId, setBookId] = useState("");
  const [testId, setTestId] = useState("");
  const [isPending, startTransition] = useTransition();

  const tests = books.find((book) => book.id === bookId)?.tests ?? [];

  function resetForm() {
    setBookId("");
    setTestId("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!bookId || !testId) return;

    startTransition(async () => {
      const result = await onSubmit(bookId, testId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(result.message);
      setOpen(false);
      resetForm();
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant={triggerVariant}>
          {trigger}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{labels.bookLabel}</Label>
              <Select
                value={bookId || undefined}
                onValueChange={(value) => {
                  setBookId(value);
                  setTestId("");
                }}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder={labels.bookPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {books.map((book) => (
                    <SelectItem key={book.id} value={book.id}>
                      {book.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{labels.testLabel}</Label>
              <Select
                value={testId || undefined}
                onValueChange={setTestId}
                disabled={!bookId || isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder={labels.testPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {tests.map((test) => (
                    <SelectItem key={test.id} value={test.id}>
                      {test.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={!bookId || !testId || isPending}>
              {isPending ? pendingLabel : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ImportDictationDialog({
  books,
}: {
  books: DictationImportBook[];
}) {
  const labels = copy.admin.dictationManage;

  return (
    <DictationBookTestDialog
      books={books}
      trigger={labels.import}
      title={labels.importTitle}
      description={labels.importDescription}
      submitLabel={labels.importSubmit}
      pendingLabel={labels.importing}
      onSubmit={async (bookId, testId) => {
        const result = await syncListeningTestDictation(bookId, testId);
        if (!result.ok) return result;
        return { ok: true, message: labels.importSuccess(result.count) };
      }}
    />
  );
}

export function PublishDictationDialog({
  books,
}: {
  books: DictationImportBook[];
}) {
  const labels = copy.admin.dictationManage;

  return (
    <DictationBookTestDialog
      books={books}
      trigger={labels.publish}
      triggerVariant="outline"
      title={labels.publishTitle}
      description={labels.publishDescription}
      submitLabel={labels.publishSubmit}
      pendingLabel={labels.publishing}
      onSubmit={async (bookId, testId) => {
        const result = await publishDictationTest(bookId, testId);
        if (!result.ok) return result;
        if (result.status === "empty") {
          return { ok: true, message: labels.publishEmpty };
        }
        if (result.status === "already") {
          return { ok: true, message: labels.publishAlready };
        }
        return { ok: true, message: labels.publishSuccess(result.count) };
      }}
    />
  );
}
