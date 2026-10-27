"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  updateAdminBookName,
  updateAdminTestAccessTier,
  updateAdminTestLabel,
} from "@/lib/admin/content/update-catalog-labels";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminEditCatalogLabelsDialogProps {
  bookId: string;
  testId: string;
  bookName: string;
  testLabel: string;
  showBookName?: boolean;
  accessTier?: "free" | "pro";
}

export function AdminEditCatalogLabelsDialog({
  bookId,
  testId,
  bookName,
  testLabel,
  showBookName = true,
  accessTier,
}: AdminEditCatalogLabelsDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState(bookName);
  const [labelDraft, setLabelDraft] = useState(testLabel);
  const [accessTierDraft, setAccessTierDraft] = useState<"free" | "pro">(
    accessTier ?? "free",
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setNameDraft(bookName);
    setLabelDraft(testLabel);
    setAccessTierDraft(accessTier ?? "free");
  }, [accessTier, bookName, open, testLabel]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
  }

  function handleSave() {
    startTransition(async () => {
      if (showBookName && nameDraft.trim() !== bookName.trim()) {
        const bookResult = await updateAdminBookName(bookId, nameDraft);
        if (!bookResult.ok) {
          toast.error(bookResult.error);
          return;
        }
      }

      if (labelDraft.trim() !== testLabel.trim()) {
        const testResult = await updateAdminTestLabel(
          bookId,
          testId,
          labelDraft,
        );
        if (!testResult.ok) {
          toast.error(testResult.error);
          return;
        }
      }

      if (accessTier != null && accessTierDraft !== accessTier) {
        const tierResult = await updateAdminTestAccessTier(
          bookId,
          testId,
          accessTierDraft,
        );
        if (!tierResult.ok) {
          toast.error(tierResult.error);
          return;
        }
      }

      toast.success(copy.admin.exams.toast.labelsSaved);
      setOpen(false);
      router.refresh();
    });
  }

  const unchanged =
    (!showBookName || nameDraft.trim() === bookName.trim()) &&
    labelDraft.trim() === testLabel.trim() &&
    (accessTier == null || accessTierDraft === accessTier);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" disabled={isPending}>
          <Pencil className="size-4" />
          {copy.admin.exams.editLabels.action}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.admin.exams.editLabels.title}</DialogTitle>
          <DialogDescription>
            {copy.admin.exams.editLabels.description}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {showBookName ? (
            <div className="space-y-2">
              <Label htmlFor="catalog-book-name">
                {copy.admin.exams.create.bookName}
              </Label>
              <Input
                id="catalog-book-name"
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
                disabled={isPending}
              />
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="catalog-test-label">
              {copy.admin.commonPractice.label}
            </Label>
            <Input
              id="catalog-test-label"
              value={labelDraft}
              onChange={(event) => setLabelDraft(event.target.value)}
              disabled={isPending}
            />
          </div>
          {accessTier != null ? (
            <div className="space-y-2">
              <Label htmlFor="catalog-access-tier">
                {copy.admin.exams.accessTier.label}
              </Label>
              <Select
                value={accessTierDraft}
                onValueChange={(value) => {
                  if (value === "free" || value === "pro") {
                    setAccessTierDraft(value);
                  }
                }}
                disabled={isPending}
              >
                <SelectTrigger id="catalog-access-tier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">
                    {copy.admin.exams.accessTier.free}
                  </SelectItem>
                  <SelectItem value="pro">
                    {copy.admin.exams.accessTier.pro}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {copy.admin.exams.accessTier.hint}
              </p>
            </div>
          ) : null}
          <p className="text-sm text-muted-foreground">
            {bookId}/{testId}
          </p>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => setOpen(false)}
          >
            {copy.admin.exams.delete.cancel}
          </Button>
          <Button
            type="button"
            disabled={isPending || unchanged}
            onClick={handleSave}
          >
            {copy.admin.exams.editLabels.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
