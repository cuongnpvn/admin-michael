"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ADMIN_ENTRANCE_TEST_PATH } from "@/lib/admin/admin-paths";
import { deleteAdminExamTest } from "@/lib/admin/content/delete-exam-test";
import { isEntranceTestBook } from "@/lib/content/catalog-ids";
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

interface AdminDeleteExamTestDialogProps {
  bookId: string;
  testId: string;
  testLabel: string;
  disabled?: boolean;
  disabledReason?: string;
}

export function AdminDeleteExamTestDialog({
  bookId,
  testId,
  testLabel,
  disabled,
  disabledReason,
}: AdminDeleteExamTestDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
  }

  function handleConfirm() {
    startTransition(async () => {
      const result = await deleteAdminExamTest(bookId, testId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(copy.admin.exams.toast.testDeleted);
      setOpen(false);
      router.push(
        isEntranceTestBook(bookId) ? ADMIN_ENTRANCE_TEST_PATH : "/admin/exams",
      );
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="text-destructive hover:text-destructive"
          disabled={disabled || isPending}
          title={disabled ? disabledReason : undefined}
        >
          <Trash2 className="size-4" />
          {copy.admin.exams.delete.deleteTest}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{copy.admin.exams.delete.confirmTitle}</DialogTitle>
          <DialogDescription>
            {copy.admin.exams.delete.confirmBody(testLabel)}
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {bookId}/{testId}
        </p>
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
            variant="destructive"
            disabled={isPending}
            onClick={handleConfirm}
          >
            {copy.admin.exams.delete.deleteTest}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
