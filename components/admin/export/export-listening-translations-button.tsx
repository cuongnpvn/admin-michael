"use client";

import { useTransition } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { exportListeningTranslationJson } from "@/lib/admin/export/listening-translation-export-actions";
import { copy } from "@/lib/copy/vi";
import { Button } from "@/components/ui/button";

interface ExportListeningTranslationsButtonProps {
  bookId: string;
  testId: string;
  part: 3 | 4;
  disabled?: boolean;
  size?: "sm" | "default";
  variant?: "outline" | "secondary" | "default";
  className?: string;
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

export function ExportListeningTranslationsButton({
  bookId,
  testId,
  part,
  disabled,
  size = "sm",
  variant = "outline",
  className,
}: ExportListeningTranslationsButtonProps) {
  const [isPending, startTransition] = useTransition();
  const label = copy.admin.listeningTranslationExport.button(part);

  function handleExport() {
    startTransition(async () => {
      const result = await exportListeningTranslationJson(bookId, testId, part);
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
        aria-label={label}
        title={label}
      >
        <Download className="size-4" />
        {label}
      </Button>
    </div>
  );
}
