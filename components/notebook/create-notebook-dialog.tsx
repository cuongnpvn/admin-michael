"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { copy } from "@/lib/copy/vi";
import { createNotebook } from "@/lib/notebook/actions";

interface CreateNotebookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (notebook: { id: string; name: string }) => void;
}

export function CreateNotebookDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateNotebookDialogProps) {
  const [name, setName] = useState<string>(copy.notebook.defaultName);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createNotebook(name);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      onCreated({ id: result.notebookId, name: result.name });
      onOpenChange(false);
      setName(copy.notebook.defaultName);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.notebook.createTitle}</DialogTitle>
          <DialogDescription>{copy.notebook.createDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="notebook-create-name">
            {copy.notebook.createNameLabel}
          </Label>
          <Input
            id="notebook-create-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={isSubmitting}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleSubmit();
              }
            }}
          />
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim()}
          >
            {copy.notebook.createSubmit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
