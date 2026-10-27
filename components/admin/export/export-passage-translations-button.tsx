"use client";

import { useTransition } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { exportPassageTranslationJson } from "@/lib/admin/export/passage-translation-export-actions";
import { copy } from "@/lib/copy/vi";
import { Button } from "@/components/ui/button";

interface ExportPassageTranslationsButtonProps {
  bookId: string;
  testId: string;
  part: 6 | 7;
  disabled?: boolean;
  size?: "sm" | "default";
  variant?: "outline" | "secondary" | "default";
  className?: string;
  compact?: boolean;
}

function downloadJsonFile(json: string, filename: string) {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ExportPassageTranslationsButton({
  bookId,
  testId,
  part,
  disabled,
  size = "sm",
  variant = "outline",
  className,
  compact = false,
}: ExportPassageTranslationsButtonProps) {
  const [isPending, startTransition] = useTransition();
  const label = copy.admin.passageTranslationExport.button(part);

  function handleExport() {
    startTransition(async () => {
      const result = await exportPassageTranslationJson(bookId, testId, part);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      downloadJsonFile(result.json, result.filename);
      toast.success(copy.admin.exams.toast.exported);
    });
  }

  return (
    <div className={className}>
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={disabled || isPending}
        onClick={handleExport}
        className={compact ? "size-8 shrink-0 px-0" : undefined}
        aria-label={label}
        title={compact ? label : undefined}
      >
        <Download className="size-4" />
        {compact ? null : label}
      </Button>
    </div>
  );
}

interface ExportPassageTranslationsGroupProps {
  bookId: string;
  testId: string;
  disabled?: boolean;
}

export function ExportPassageTranslationsGroup({
  bookId,
  testId,
  disabled,
}: ExportPassageTranslationsGroupProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ExportPassageTranslationsButton
        bookId={bookId}
        testId={testId}
        part={6}
        disabled={disabled}
      />
      <ExportPassageTranslationsButton
        bookId={bookId}
        testId={testId}
        part={7}
        disabled={disabled}
      />
    </div>
  );
}
