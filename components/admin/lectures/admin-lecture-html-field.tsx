"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MutableRefObject } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { VOCABULARY_IMAGE_ACCEPT } from "@/lib/admin/vocabulary/constants";
import { uploadLectureImage } from "@/lib/admin/lectures/upload-lecture-image";
import { withLectureImageAudio } from "@/lib/lectures/image-audio";
import {
  MID_PRACTICE_PREFIX,
  rewriteMidPracticeTokens,
} from "@/lib/lectures/practice-token";
import { prettyPrintLectureHtml } from "@/lib/lectures/pretty-print-html";
import { stripLeadingLectureKicker } from "@/lib/lectures/strip-kicker";
import { copy } from "@/lib/copy/vi";

function resizeLectureHtmlTextarea(element: HTMLTextAreaElement | null) {
  if (!element) return;
  element.style.height = "0px";
  element.style.height = `${element.scrollHeight}px`;
}

function lecturePreviewHtml(
  html: string,
  practiceTitles?: ReadonlyMap<number, string>,
) {
  return withLectureImageAudio(
    rewriteMidPracticeTokens(stripLeadingLectureKicker(html), practiceTitles),
  );
}

function LectureHtmlPreview({
  html,
  practiceTitles,
}: {
  html: string;
  practiceTitles?: ReadonlyMap<number, string>;
}) {
  return (
    <div
      className="lecture-html min-h-48 rounded-[12px] border border-border p-4"
      dangerouslySetInnerHTML={{ __html: lecturePreviewHtml(html, practiceTitles) }}
    />
  );
}

export function AdminLectureHtmlField({
  lectureId,
  value,
  onChange,
  insertRef,
  practiceTitles,
  onSave,
  saving = false,
  saveError = null,
}: {
  lectureId: string;
  value: string;
  onChange: (value: string) => void;
  insertRef?: MutableRefObject<(snippet: string) => void>;
  practiceTitles?: ReadonlyMap<number, string>;
  onSave?: () => void;
  saving?: boolean;
  saveError?: string | null;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const valueRef = useRef(value);
  const fileRef = useRef<HTMLInputElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  valueRef.current = value;

  const bindTextarea = useCallback((element: HTMLTextAreaElement | null) => {
    resizeObserverRef.current?.disconnect();
    resizeObserverRef.current = null;
    textareaRef.current = element;
    if (!element) return;
    resizeLectureHtmlTextarea(element);
    const parent = element.parentElement;
    if (!parent) return;
    const observer = new ResizeObserver(() => resizeLectureHtmlTextarea(element));
    observer.observe(parent);
    resizeObserverRef.current = observer;
  }, []);

  useLayoutEffect(() => {
    resizeLectureHtmlTextarea(textareaRef.current);
  }, [value]);

  const insertSnippet = useCallback(
    (snippet: string) => {
      const field = textareaRef.current;
      const current = valueRef.current;
      if (!field) {
        onChange(`${current}${snippet}`);
        return;
      }
      const start = field.selectionStart;
      const end = field.selectionEnd;
      onChange(`${current.slice(0, start)}${snippet}${current.slice(end)}`);
      requestAnimationFrame(() => {
        const pos = start + snippet.length;
        field.focus();
        field.selectionStart = field.selectionEnd = pos;
      });
    },
    [onChange],
  );

  useEffect(() => {
    if (!insertRef) return;
    insertRef.current = insertSnippet;
  }, [insertRef, insertSnippet]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Tab" || event.shiftKey) return;
    event.preventDefault();
    const field = event.currentTarget;
    const start = field.selectionStart;
    const end = field.selectionEnd;
    const next = `${value.slice(0, start)}  ${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      field.selectionStart = field.selectionEnd = start + 2;
    });
  }

  async function handleImage(file: File) {
    setError(null);
    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadLectureImage(lectureId, formData);
    setUploading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    insertRef?.current(`<img src="${result.imageUrl}" alt="">`);
  }

  return (
    <>
      <div className="overflow-hidden rounded-[12px] border border-border">
        <div className="border-b border-border px-3 py-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
            {copy.admin.lectures.fields.editBody}
          </Button>
        </div>
        <div
          className="lecture-html min-h-48 p-4"
          dangerouslySetInnerHTML={{ __html: lecturePreviewHtml(value, practiceTitles) }}
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-h-[90vh] max-w-6xl overflow-y-auto"
          aria-describedby={undefined}
        >
          <DialogHeader className="flex-row items-center justify-between gap-3 pr-8">
            <DialogTitle>{copy.admin.lectures.fields.body}</DialogTitle>
            {onSave ? (
              <Button type="button" size="sm" onClick={onSave} disabled={saving}>
                {copy.admin.lectures.save}
              </Button>
            ) : null}
          </DialogHeader>
          {saveError ? <p className="text-sm text-destructive">{saveError}</p> : null}
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="lecture-body-html">{copy.admin.lectures.fields.body}</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => insertSnippet(MID_PRACTICE_PREFIX)}
                  >
                    {copy.admin.lectures.fields.insertPractice}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                  >
                    {uploading
                      ? copy.admin.lectures.fields.insertingImage
                      : copy.admin.lectures.fields.insertImage}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onChange(prettyPrintLectureHtml(value))}
                  >
                    {copy.admin.lectures.fields.alignTags}
                  </Button>
                </div>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept={VOCABULARY_IMAGE_ACCEPT}
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) void handleImage(file);
                }}
              />
              <textarea
                id="lecture-body-html"
                ref={bindTextarea}
                spellCheck={false}
                className="min-h-48 w-full resize-none overflow-hidden rounded-[12px] border border-input bg-background p-3 font-mono text-[13px] leading-6 [tab-size:2]"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                onKeyDown={handleKeyDown}
              />
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </div>
            <div className="space-y-2">
              <Label>{copy.admin.lectures.fields.preview}</Label>
              <LectureHtmlPreview html={value} practiceTitles={practiceTitles} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
