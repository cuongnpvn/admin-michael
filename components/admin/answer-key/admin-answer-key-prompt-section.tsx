"use client";

import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { InstructionMarkdownPreview } from "@/components/admin/instructions/instruction-markdown-preview";
import {
  answerKeyListeningTemplate,
  answerKeyReadingTemplate,
  downloadJsonFile,
} from "@/lib/admin/answer-key/download-json";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy/vi";

interface AdminAnswerKeyPromptSectionProps {
  content: string;
}

function downloadTemplate(
  data: Record<string, unknown>,
  suffix: "listening" | "reading",
) {
  const json = `${JSON.stringify(data, null, 2)}\n`;
  downloadJsonFile(json, `answer-key-template-${suffix}.json`);
}

export function AdminAnswerKeyPromptSection({
  content,
}: AdminAnswerKeyPromptSectionProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="space-y-4 rounded-[16px] border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl space-y-1">
          <h2 className="text-base font-semibold">
            {copy.admin.answerKey.promptSectionTitle}
          </h2>
          <p className="text-sm text-muted-foreground">
            {copy.admin.answerKey.promptSectionDescription}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => downloadTemplate(answerKeyListeningTemplate, "listening")}
          >
            <Download className="size-4" />
            {copy.admin.answerKey.downloadListeningTemplate}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => downloadTemplate(answerKeyReadingTemplate, "reading")}
          >
            <Download className="size-4" />
            {copy.admin.answerKey.downloadReadingTemplate}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
            {copied
              ? copy.admin.answerKey.copiedPrompt
              : copy.admin.answerKey.copyPrompt}
          </Button>
        </div>
      </div>
      <div className="max-h-72 overflow-y-auto rounded-[12px] border border-border bg-muted/30 p-4">
        <InstructionMarkdownPreview content={content} className="text-sm" />
      </div>
    </section>
  );
}
