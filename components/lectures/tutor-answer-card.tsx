"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AskLectureTutorSuccess } from "@/lib/lectures/tutor/types";
import { stripIncompleteInlineToken } from "@/lib/lectures/tutor/rewrite-inline-links";
import { copy } from "@/lib/copy/vi";
import { cn } from "@/lib/utils";

export function TutorAnswerCard({
  result,
  answerMarkdown,
  streaming = false,
  className,
}: {
  result?: AskLectureTutorSuccess;
  answerMarkdown?: string;
  streaming?: boolean;
  className?: string;
}) {
  const refuse = result?.refuse ?? false;
  const raw = answerMarkdown ?? result?.answerMarkdown ?? "";
  const markdown = streaming ? stripIncompleteInlineToken(raw) : raw;

  return (
    <div className={cn("text-sm", className)}>
      <div
        className={cn(
          "lecture-html tutor-answer",
          streaming && "tutor-stream-caret",
          refuse &&
            "rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2",
        )}
      >
        {refuse ? (
          <p className="mb-2 text-xs font-medium text-amber-800 dark:text-amber-200">
            {copy.lectures.tutorOffTopicLabel}
          </p>
        ) : null}
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ href, children }) => (
              <Link href={href || "#"} className="underline">
                {children}
              </Link>
            ),
            table: ({ children }) => (
              <div className="tutor-answer-table">
                <table>{children}</table>
              </div>
            ),
          }}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    </div>
  );
}
