"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Headphones, Upload } from "lucide-react";
import { importListeningFromJson } from "@/lib/admin/import/actions";
import { copy } from "@/lib/copy/vi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface ImportListeningJsonDialogProps {
  disabled?: boolean;
  disabledReason?: string;
  embedded?: boolean;
  onSuccess?: () => void;
}

function ImportListeningForm({
  disabled,
  disabledReason,
  onSuccess,
}: {
  disabled?: boolean;
  disabledReason?: string;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await importListeningFromJson(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const { summary } = result;
      setSuccess(
        copy.admin.listeningImport.success(
          summary.bookId,
          summary.testId,
          summary.questionCount,
          summary.partsUpdated,
          summary.mediaAssetCount,
          summary.missingAnswerKeys,
        ),
      );
      formRef.current?.reset();
      router.refresh();
      onSuccess?.();
    });
  }

  return (
    <>
      {disabledReason && (
        <p className="text-sm text-destructive">{disabledReason}</p>
      )}
      <p className="text-sm text-muted-foreground">
        {copy.admin.listeningImport.requiredFieldsNote}
      </p>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="import-listening-json-file">
            {copy.admin.listeningImport.selectFile}
          </Label>
          <input
            id="import-listening-json-file"
            name="file"
            type="file"
            accept="application/json,.json"
            required
            disabled={disabled || isPending}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-[10px] file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-success">{success}</p>}
        <Button type="submit" className="w-full" disabled={disabled || isPending}>
          <Upload className="size-4" />
          {isPending
            ? copy.auth.signingIn
            : copy.admin.listeningImport.importButton}
        </Button>
      </form>
    </>
  );
}

export function ImportListeningJsonDialog({
  disabled,
  disabledReason,
  embedded,
  onSuccess,
}: ImportListeningJsonDialogProps) {
  const [open, setOpen] = useState(false);

  if (embedded) {
    return (
      <ImportListeningForm
        disabled={disabled}
        disabledReason={disabledReason}
        onSuccess={onSuccess}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" disabled={disabled}>
          <Headphones className="size-4" />
          {copy.admin.listeningImport.title}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.admin.listeningImport.title}</DialogTitle>
          <DialogDescription>
            {copy.admin.listeningImport.description}
          </DialogDescription>
        </DialogHeader>
        <ImportListeningForm
          disabled={disabled}
          disabledReason={disabledReason}
          onSuccess={() => {
            setOpen(false);
            onSuccess?.();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
