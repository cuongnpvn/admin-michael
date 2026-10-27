"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { copy } from "@/lib/copy/vi";
import {
  HIGHLIGHT_COLORS,
  fillTemplate,
  partsFromTemplate,
  type HighlightColor,
  type HighlightSpan,
} from "@/lib/lectures/exercise";
import type { LectureQuestionInsert } from "@/lib/lectures/options";
import { tokenizeDictationDisplay } from "@/lib/listening/dictation-normalize";
import { cn } from "@/lib/utils";

const highlightClass: Record<HighlightColor, string> = {
  red: "bg-red-200",
  blue: "bg-blue-200",
  green: "bg-green-200",
  amber: "bg-amber-200",
  violet: "bg-violet-200",
};

export function HighlightFields({
  question,
  onChange,
}: {

  question: LectureQuestionInsert;
  onChange: (patch: Partial<LectureQuestionInsert>) => void;
}) {
  const words = tokenizeDictationDisplay(question.payload.sentence);
  const [active, setActive] = useState(question.payload.labels[0]?.id ?? "");

  return (
    <div className="space-y-3">
      <Label>{copy.admin.lectures.fields.sentence}</Label>
      <Input
        value={question.payload.sentence}
        onChange={(event) =>
          onChange({
            payload: { ...question.payload, sentence: event.target.value },
            stem: event.target.value,
          })
        }
      />
      {question.payload.labels.map((label) => (
        <div key={label.id} className="flex items-center gap-2">
          <input
            type="radio"
            checked={active === label.id}
            onChange={() => setActive(label.id)}
          />
          <Input
            value={label.name}
            onChange={(event) =>
              onChange({
                payload: {
                  ...question.payload,
                  labels: question.payload.labels.map((item) =>
                    item.id === label.id ? { ...item, name: event.target.value } : item,
                  ),
                },
              })
            }
          />
          <select
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={label.color}
            onChange={(event) =>
              onChange({
                payload: {
                  ...question.payload,
                  labels: question.payload.labels.map((item) =>
                    item.id === label.id
                      ? { ...item, color: event.target.value as HighlightColor }
                      : item,
                  ),
                },
              })
            }
          >
            {HIGHLIGHT_COLORS.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          onChange({
            payload: {
              ...question.payload,
              labels: [
                ...question.payload.labels,
                {
                  id: crypto.randomUUID(),
                  name: "",
                  color: HIGHLIGHT_COLORS[
                    question.payload.labels.length % HIGHLIGHT_COLORS.length
                  ]!,
                },
              ],
            },
          })
        }
      >
        {copy.admin.lectures.fields.addLabel}
      </Button>
      <p className="flex flex-wrap gap-1">
        {words.map((word, index) => {
          const span = question.answer.spans.find(
            (item) => item.start <= index && item.end >= index,
          );
          const label = question.payload.labels.find((item) => item.id === span?.labelId);
          return (
            <button
              key={`${word}-${index}`}
              type="button"
              className={cn("rounded px-1", label && highlightClass[label.color])}
              onClick={() => {
                if (!active) return;
                onChange({
                  answer: {
                    ...question.answer,
                    spans: paintWord(question.answer.spans, index, active),
                  },
                });
              }}
            >
              {word}
            </button>
          );
        })}
      </p>
    </div>
  );
}

export function RewriteFields({
  question,
  onChange,
}: {
  question: LectureQuestionInsert;
  onChange: (patch: Partial<LectureQuestionInsert>) => void;
}) {
  const accepted = question.answer.accepted.length > 0 ? question.answer.accepted : [""];
  return (
    <div className="space-y-2">
      <Label>{copy.admin.lectures.fields.prompt}</Label>
      <Input
        value={question.payload.prompt}
        onChange={(event) =>
          onChange({
            payload: { ...question.payload, prompt: event.target.value },
            stem: event.target.value,
          })
        }
      />
      <Label>{copy.admin.lectures.fields.accepted}</Label>
      {accepted.map((sentence, index) => (
        <Input
          key={index}
          value={sentence}
          onChange={(event) => {
            const next = [...accepted];
            next[index] = event.target.value;
            onChange({ answer: { ...question.answer, accepted: next } });
          }}
        />
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          onChange({
            answer: { ...question.answer, accepted: [...accepted, ""] },
          })
        }
      >
        {copy.admin.lectures.fields.addAccepted}
      </Button>
    </div>
  );
}

export function FillFields({
  question,
  onChange,
}: {
  question: LectureQuestionInsert;
  onChange: (patch: Partial<LectureQuestionInsert>) => void;
}) {
  const template = fillTemplate(question.payload.parts);
  return (
    <div className="space-y-2">
      <Label>{copy.admin.lectures.fields.fillTemplate}</Label>
      <Input
        value={template}
        onChange={(event) => {
          const next = partsFromTemplate(event.target.value, question.answer.blanks);
          onChange({
            payload: { ...question.payload, parts: next.parts },
            answer: { ...question.answer, blanks: next.blanks },
            stem: event.target.value,
          });
        }}
      />
      <p className="text-sm text-muted-foreground">
        {copy.admin.lectures.fields.fillTemplateHint}
      </p>
      {question.answer.blanks.map((blank, index) => (
        <Input
          key={blank.id}
          value={blank.accepted[0] ?? ""}
          onChange={(event) =>
            onChange({
              answer: {
                ...question.answer,
                blanks: question.answer.blanks.map((item, current) =>
                  current === index
                    ? { ...item, accepted: [event.target.value] }
                    : item,
                ),
              },
            })
          }
        />
      ))}
    </div>
  );
}

function paintWord(spans: HighlightSpan[], index: number, labelId: string): HighlightSpan[] {
  const rest = spans.filter((span) => !(span.start === index && span.end === index));
  const current = spans.find((span) => span.start === index && span.end === index);
  if (current?.labelId === labelId) return rest;
  return [...rest, { start: index, end: index, labelId }];
}
