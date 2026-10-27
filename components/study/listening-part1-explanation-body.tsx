"use client";

import { QuestionExplanationMarkdown } from "@/components/study/question-explanation-markdown";
import {
  isListeningPart1OptionTranslationExplanation,
  parseListeningPart1OptionTranslationLines,
} from "@/lib/listening/part1-explanation-format";
import { cn } from "@/lib/utils";

interface ListeningPart1ExplanationBodyProps {
  reasoning: string;
  className?: string;
}

export function ListeningPart1ExplanationBody({
  reasoning,
  className,
}: ListeningPart1ExplanationBodyProps) {
  const lines = parseListeningPart1OptionTranslationLines(reasoning);

  if (lines.length === 0) {
    return (
      <QuestionExplanationMarkdown
        content={reasoning}
        className={className}
      />
    );
  }

  return (
    <ul className={cn("listening-part1-explanation m-0 list-none space-y-3 p-0", className)}>
      {lines.map((line) => (
        <li
          key={line.label}
          className="rounded-[10px] border border-border/70 bg-background/60 px-3 py-2.5 text-sm leading-relaxed"
        >
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="shrink-0 text-base font-semibold text-primary">
              {line.label}.
            </span>
            {line.english ? (
              <span className="min-w-0 flex-1 text-foreground">
                {line.english}
              </span>
            ) : null}
          </div>
          {line.vietnamese ? (
            <p className="mt-1.5 text-muted-foreground">{line.vietnamese}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function shouldUseListeningPart1ExplanationBody(
  reasoning: string,
): boolean {
  return isListeningPart1OptionTranslationExplanation(reasoning);
}
