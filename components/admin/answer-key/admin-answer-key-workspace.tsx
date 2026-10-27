"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Download, Upload } from "lucide-react";
import { ZodError } from "zod";
import { AdminAnswerKeyPromptSection } from "@/components/admin/answer-key/admin-answer-key-prompt-section";
import { FileInput } from "@/components/ui/file-input";
import { importAnswerKeyFromJson } from "@/lib/admin/answer-key/actions";
import {
  answerKeyDownloadFilename,
  downloadJsonFile,
  serializeAnswerKeyForDownload,
} from "@/lib/admin/answer-key/download-json";
import {
  inferAnswerKeySection,
  normalizeAnswerKeyEntries,
  parseAnswerKeyFile,
  type AnswerKeyFile,
  type AnswerKeySection,
} from "@/lib/admin/answer-key/schema";
import { TOEIC_PART_QUESTION_COUNTS } from "@/lib/content/toeic-global-item-number";
import { copy } from "@/lib/copy/vi";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface AdminAnswerKeyWorkspaceProps {
  promptContent: string;
}

interface PreviewPart {
  part: number;
  answers: Record<string, string>;
  count: number;
  expected: number;
}

interface PreviewState {
  file: AnswerKeyFile | null;
  parts: PreviewPart[];
  section: AnswerKeySection | null;
  error: string | null;
}

function buildPreviewParts(file: AnswerKeyFile): PreviewPart[] {
  return file.parts
    .slice()
    .sort((a, b) => a.part - b.part)
    .map((partBlock) => ({
      part: partBlock.part,
      answers: Object.fromEntries(
        Object.entries(partBlock.answers).map(([key, value]) => [
          String(key),
          value,
        ]),
      ),
      count: Object.keys(partBlock.answers).length,
      expected: TOEIC_PART_QUESTION_COUNTS[partBlock.part] ?? 0,
    }));
}

function formatPreviewError(error: unknown): string {
  if (error instanceof ZodError) {
    const first = error.issues[0];
    return first
      ? `${copy.admin.answerKey.errors.invalidSchema}: ${first.message}`
      : copy.admin.answerKey.errors.invalidSchema;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return copy.admin.answerKey.errors.parsePreview;
}

function parseAnswerKeyRaw(raw: string): PreviewState {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { file: null, parts: [], section: null, error: null };
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    const fileData = parseAnswerKeyFile(parsed);
    const entries = normalizeAnswerKeyEntries(fileData);
    const section = inferAnswerKeySection(
      entries.map((entry) => entry.globalItemNumber),
    );
    return {
      file: fileData,
      parts: buildPreviewParts(fileData),
      section,
      error: null,
    };
  } catch (error) {
    return {
      file: null,
      parts: [],
      section: null,
      error: formatPreviewError(error),
    };
  }
}

function applyPreview(
  setters: {
    setPreviewFile: (file: AnswerKeyFile | null) => void;
    setPreviewParts: (parts: PreviewPart[]) => void;
    setPreviewSection: (section: AnswerKeySection | null) => void;
    setPreviewError: (error: string | null) => void;
  },
  preview: PreviewState,
) {
  setters.setPreviewFile(preview.file);
  setters.setPreviewParts(preview.parts);
  setters.setPreviewSection(preview.section);
  setters.setPreviewError(preview.error);
}

export function AdminAnswerKeyWorkspace({
  promptContent,
}: AdminAnswerKeyWorkspaceProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [previewFile, setPreviewFile] = useState<AnswerKeyFile | null>(null);
  const [previewParts, setPreviewParts] = useState<PreviewPart[]>([]);
  const [previewSection, setPreviewSection] =
    useState<AnswerKeySection | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jsonContent, setJsonContent] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);
  const [isPending, startTransition] = useTransition();

  const previewSetters = {
    setPreviewFile,
    setPreviewParts,
    setPreviewSection,
    setPreviewError,
  };

  function clearMessages() {
    setSaveError(null);
    setSuccess(null);
  }

  async function handleFilesChange(files: File[]) {
    const file = files[0] ?? null;
    clearMessages();
    setSelectedFile(file);
    setJsonContent("");

    if (!file) {
      applyPreview(previewSetters, {
        file: null,
        parts: [],
        section: null,
        error: null,
      });
      return;
    }

    const raw = await file.text();
    applyPreview(previewSetters, parseAnswerKeyRaw(raw));
  }

  function handleJsonContentChange(value: string) {
    clearMessages();
    setJsonContent(value);
    setSelectedFile(null);
    setFileInputKey((current) => current + 1);
    applyPreview(previewSetters, parseAnswerKeyRaw(value));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    const trimmedJson = jsonContent.trim();
    if (!selectedFile && !trimmedJson) {
      return;
    }

    const formData = new FormData();
    if (trimmedJson) {
      formData.set("jsonContent", jsonContent);
    } else if (selectedFile) {
      formData.set("file", selectedFile);
    }

    startTransition(async () => {
      const result = await importAnswerKeyFromJson(formData);
      if (!result.ok) {
        setSaveError(result.error);
        return;
      }

      const { summary } = result;
      setSuccess(
        copy.admin.answerKey.success(
          summary.bookId,
          summary.testId,
          summary.entriesSaved,
          summary.partsSaved,
          summary.createdBook,
          summary.createdTest,
        ),
      );
      formRef.current?.reset();
      setSelectedFile(null);
      setJsonContent("");
      setFileInputKey((current) => current + 1);
      setPreviewFile(null);
      setPreviewParts([]);
      setPreviewSection(null);
      setPreviewError(null);
      router.refresh();
    });
  }

  function handleDownloadPreview() {
    if (!previewFile) return;

    downloadJsonFile(
      serializeAnswerKeyForDownload(previewFile),
      answerKeyDownloadFilename(previewFile.bookId, previewFile.testId),
    );
  }

  const canSave =
    Boolean(previewFile) &&
    !previewError &&
    (selectedFile != null || jsonContent.trim().length > 0);

  return (
    <div className="space-y-8">
      <AdminAnswerKeyPromptSection content={promptContent} />

      <section className="space-y-4 rounded-[16px] border border-border bg-surface p-5">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">
            {copy.admin.answerKey.uploadSectionTitle}
          </h2>
          <p className="text-sm text-muted-foreground">
            {copy.admin.answerKey.uploadSectionDescription}
          </p>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{copy.admin.answerKey.selectFile}</Label>
            <FileInput
              key={fileInputKey}
              variant="dropzone"
              accept=".json,application/json"
              disabled={isPending}
              placeholderLabel={copy.admin.answerKey.uploadPlaceholder}
              emptyLabel={
                selectedFile?.name ?? copy.admin.answerKey.uploadPlaceholder
              }
              dropReleaseLabel={copy.admin.answerKey.uploadDropRelease}
              onFilesChange={handleFilesChange}
            />
            <p className="text-xs text-muted-foreground">
              {copy.admin.answerKey.uploadHint}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="answer-key-json-content">
              {copy.admin.answerKey.pasteJsonLabel}
            </Label>
            <textarea
              id="answer-key-json-content"
              value={jsonContent}
              disabled={isPending}
              rows={10}
              placeholder={copy.admin.answerKey.pasteJsonPlaceholder}
              onChange={(event) => handleJsonContentChange(event.target.value)}
              className={cn(
                "w-full rounded-[12px] border border-border bg-background px-3 py-2 font-mono text-sm",
                "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                "disabled:cursor-not-allowed disabled:opacity-60",
              )}
            />
          </div>

          {previewError && (
            <p className="text-sm text-destructive">{previewError}</p>
          )}
          {saveError && <p className="text-sm text-destructive">{saveError}</p>}
          {success && <p className="text-sm text-emerald-600">{success}</p>}

          <div className="space-y-3">
            <h3 className="text-sm font-medium">
              {copy.admin.answerKey.previewTitle}
            </h3>

            {!previewFile && !previewError && (
              <p className="text-sm text-muted-foreground">
                {copy.admin.answerKey.previewEmpty}
              </p>
            )}

            {previewFile && (
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {copy.admin.answerKey.bookTestLabel(
                      previewFile.bookId,
                      previewFile.testId,
                    )}
                  </p>
                  {previewSection && (
                    <p className="text-sm text-muted-foreground">
                      {copy.admin.answerKey.sectionLabel(previewSection)}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPreview}
                >
                  <Download className="size-4" />
                  {copy.admin.answerKey.downloadPreview}
                </Button>
              </div>
            )}

            {previewParts.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {previewParts.map((part) => (
                  <div
                    key={part.part}
                    className="rounded-[12px] border border-border bg-muted/20 p-3"
                  >
                    <p className="text-sm font-medium">
                      {copy.admin.answerKey.partSummary(
                        part.part,
                        part.count,
                        part.expected,
                      )}
                    </p>
                    <p className="mt-2 line-clamp-3 font-mono text-xs text-muted-foreground">
                      {Object.entries(part.answers)
                        .slice(0, 8)
                        .map(([num, label]) => `${num}:${label}`)
                        .join(" · ")}
                      {part.count > 8 ? " · …" : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" disabled={isPending || !canSave}>
            <Upload className="size-4" />
            {copy.admin.answerKey.saveButton}
          </Button>
        </form>
      </section>
    </div>
  );
}
