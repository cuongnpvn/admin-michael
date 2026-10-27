"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createAdminPracticeEntry } from "@/lib/admin/content/create-practice";
import { copy } from "@/lib/copy/vi";
import type { PublishSection } from "@/lib/content/publish-test";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AdminCreatePracticeDialogProps {
  section: PublishSection;
}

export function AdminCreatePracticeDialog({ section }: AdminCreatePracticeDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    const label = String(formData.get("label") ?? "");
    const slug = String(formData.get("slug") ?? "").trim() || undefined;

    startTransition(async () => {
      const result = await createAdminPracticeEntry({ section, label, slug });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.push(result.data.redirectPath);
      router.refresh();
    });
  }

  const sectionCopy =
    section === "listening" ? copy.admin.listening : copy.admin.reading;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          {sectionCopy.addPractice}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.admin.commonPractice.createTitle}</DialogTitle>
          <DialogDescription>
            {copy.admin.commonPractice.createDescription}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label">{copy.admin.commonPractice.label}</Label>
            <Input id="label" name="label" required disabled={isPending} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">{copy.admin.commonPractice.slug}</Label>
            <Input id="slug" name="slug" disabled={isPending} />
            <p className="text-xs text-muted-foreground">
              {copy.admin.commonPractice.slugHint}
            </p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={isPending}>
            {copy.admin.commonPractice.create}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
