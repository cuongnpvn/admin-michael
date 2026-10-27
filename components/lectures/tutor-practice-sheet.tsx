"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { submitTutorPractice } from "@/lib/lectures/tutor/submit-tutor-practice";
import type {
  TutorPracticeQuestion,
  TutorPracticeResultItem,
  TutorPracticeSet,
} from "@/lib/lectures/tutor/types";
import { copy } from "@/lib/copy/vi";
import { cn } from "@/lib/utils";

type ResultMap = Record<string, TutorPracticeResultItem>;

function optionReviewClass(
  selected: boolean,
  result: TutorPracticeResultItem | undefined,
  optionId: string,
) {
  if (!result) {
    return selected ? "border-primary bg-primary/5" : undefined;
  }
  if (optionId === result.correctOptionId) {
    return "border-success bg-success/10 ring-1 ring-success/25";
  }
  if (selected) {
    return "border-destructive bg-destructive/10 ring-1 ring-destructive/25";
  }
  return undefined;
}

function PracticeQuestions({
  questions,
  answers,
  results,
  reviewing,
  onSelect,
}: {
  questions: TutorPracticeQuestion[];
  answers: Record<string, string>;
  results: ResultMap | null;
  reviewing: boolean;
  onSelect: (questionId: string, optionId: string) => void;
}) {
  return (
    <div className="space-y-6">
      {questions.map((question, index) => {
        const result = results?.[question.id];
        return (
          <div key={question.id} className="space-y-3">
            <p className="font-medium">
              {index + 1}. {question.stem}
            </p>
            <div className="space-y-2">
              {question.options.map((option) => {
                const selected = answers[question.id] === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      if (reviewing) return;
                      onSelect(question.id, option.id);
                    }}
                    className={cn(
                      "flex w-full rounded-[12px] border px-3 py-2 text-left text-sm",
                      optionReviewClass(selected, result, option.id),
                    )}
                  >
                    <span className="mr-2 font-semibold">{option.label}.</span>
                    {option.text}
                  </button>
                );
              })}
            </div>
            {result?.explanation ? (
              <p className="text-sm text-muted-foreground">{result.explanation}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function TutorPracticeSheet({
  open,
  onOpenChange,
  practiceSet,
  error,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  practiceSet: TutorPracticeSet | null;
  error: string | null;
  loading: boolean;
}) {
  const questions = practiceSet?.questions ?? [];
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<ResultMap | null>(null);
  const [score, setScore] = useState<{ correct: number; total: number } | null>(
    null,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const reviewing = results !== null;
  const setKey = practiceSet?.questionIds.join(",") ?? "";

  useEffect(() => {
    setAnswers({});
    setResults(null);
    setScore(null);
    setSubmitError(null);
  }, [setKey]);

  function handleSubmit() {
    if (!practiceSet) return;
    setSubmitError(null);
    startTransition(async () => {
      try {
        const result = await submitTutorPractice({
          questionIds: practiceSet.questionIds,
          answers,
        });
        if (!result.ok) {
          setSubmitError(result.error);
          return;
        }
        setScore({ correct: result.correctCount, total: result.totalCount });
        setResults(
          Object.fromEntries(
            result.results.map((item) => [item.questionId, item]),
          ),
        );
      } catch {
        setSubmitError(copy.lectures.submitFailed);
      }
    });
  }

  const status = submitError ?? error;
  const canSubmit = questions.length > 0 && !loading && !reviewing;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side="right"
        hideClose
        className="z-[70] flex w-full flex-col gap-0 overflow-y-auto sm:max-w-3xl"
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        onFocusOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <SheetHeader className="flex min-w-0 flex-1 flex-row items-center justify-between space-y-0 text-left">
              <SheetTitle>{copy.lectures.tutorPractice}</SheetTitle>
            </SheetHeader>
            <div className="flex shrink-0 gap-2">
              {reviewing ? (
                <Button
                  type="button"
                  onClick={() => {
                    setResults(null);
                    setScore(null);
                    setSubmitError(null);
                  }}
                >
                  {copy.lectures.retry}
                </Button>
              ) : canSubmit ? (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isPending}
                >
                  {copy.lectures.tutorPracticeSubmit}
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {copy.lectures.closeExercise}
              </Button>
            </div>
          </div>
          <p className="min-h-6 text-sm leading-6" aria-live="polite">
            {status ? (
              <span className="text-destructive">{status}</span>
            ) : score ? (
              <span className="font-medium">
                {copy.lectures.score(score.correct, score.total)}
              </span>
            ) : (
              <span className="invisible">{"\u00a0"}</span>
            )}
          </p>
          {questions.length > 0 ? (
            <PracticeQuestions
              questions={questions}
              answers={answers}
              results={results}
              reviewing={reviewing}
              onSelect={(questionId, optionId) => {
                setAnswers((current) => ({ ...current, [questionId]: optionId }));
                setResults(null);
                setScore(null);
                setSubmitError(null);
              }}
            />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
