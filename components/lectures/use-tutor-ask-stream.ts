"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { copy } from "@/lib/copy/vi";
import { readSseStream } from "@/lib/lectures/tutor/read-sse-stream";
import type {
  TutorSseDelta,
  TutorSseDone,
  TutorSseError,
  TutorSseStatus,
} from "@/lib/lectures/tutor/stream-events";
import { isAbortError } from "@/lib/lectures/tutor/is-abort-error";
import type {
  AskLectureTutorInput,
  AskLectureTutorSuccess,
} from "@/lib/lectures/tutor/types";

export type TutorAskStreamResult =
  | { ok: true; result: AskLectureTutorSuccess }
  | { ok: false; error: string; aborted?: boolean };

export function useTutorAskStream() {
  const abortRef = useRef<AbortController | null>(null);
  const frameRef = useRef(0);
  const pendingMarkdownRef = useRef<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [draftMarkdown, setDraftMarkdown] = useState<string | null>(null);
  const [thinkingText, setThinkingText] = useState<string | null>(null);

  const cancelFrame = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    }
    pendingMarkdownRef.current = null;
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    cancelFrame();
    setIsStreaming(false);
    setDraftMarkdown(null);
    setThinkingText(null);
  }, [cancelFrame]);

  useEffect(() => {
    return () => abort();
  }, [abort]);

  const clearDraft = useCallback(() => {
    cancelFrame();
    setDraftMarkdown(null);
    setThinkingText(null);
  }, [cancelFrame]);

  const queueMarkdown = useCallback((markdown: string) => {
    pendingMarkdownRef.current = markdown;
    if (frameRef.current) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      if (pendingMarkdownRef.current == null) return;
      setDraftMarkdown(pendingMarkdownRef.current);
      pendingMarkdownRef.current = null;
    });
  }, []);

  const ask = useCallback(
    async (input: AskLectureTutorInput): Promise<TutorAskStreamResult> => {
      abortRef.current?.abort();
      cancelFrame();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsStreaming(true);
      setDraftMarkdown(null);
      setThinkingText(null);

      try {
        const response = await fetch("/api/lectures/tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
          signal: controller.signal,
        });
        const contentType = response.headers.get("content-type") ?? "";
        if (!response.ok || !contentType.includes("text/event-stream")) {
          setDraftMarkdown(null);
          setThinkingText(null);
          return { ok: false, error: copy.lectures.tutorFailed };
        }
        if (!response.body) {
          setDraftMarkdown(null);
          setThinkingText(null);
          return { ok: false, error: copy.lectures.tutorFailed };
        }

        let result: AskLectureTutorSuccess | null = null;
        let streamError: string | null = null;
        await readSseStream(response.body, (event, data) => {
          if (event === "status") {
            const status = data as TutorSseStatus;
            if (status.phase === "thinking" && status.text) {
              setThinkingText(status.text);
            }
            return;
          }
          if (event === "delta") {
            queueMarkdown((data as TutorSseDelta).markdown ?? "");
            return;
          }
          if (event === "done") {
            result = (data as TutorSseDone).result;
            return;
          }
          if (event === "error") {
            streamError =
              (data as TutorSseError).error ?? copy.lectures.tutorFailed;
          }
        });

        if (pendingMarkdownRef.current != null) {
          setDraftMarkdown(pendingMarkdownRef.current);
          pendingMarkdownRef.current = null;
        }

        if (result) return { ok: true, result };
        setDraftMarkdown(null);
        setThinkingText(null);
        return {
          ok: false,
          error: streamError ?? copy.lectures.tutorFailed,
        };
      } catch (error) {
        setDraftMarkdown(null);
        setThinkingText(null);
        if (controller.signal.aborted || isAbortError(error)) {
          return { ok: false, error: "", aborted: true };
        }
        return { ok: false, error: copy.lectures.tutorFailed };
      } finally {
        cancelFrame();
        if (abortRef.current === controller) abortRef.current = null;
        setIsStreaming(false);
      }
    },
    [cancelFrame, queueMarkdown],
  );

  return { ask, abort, clearDraft, isStreaming, draftMarkdown, thinkingText };
}
