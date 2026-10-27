"use client";

import { useEffect, useState, useTransition } from "react";
import {
  PART1_QUESTION_NUMBERS,
  PART5_QUESTION_NUMBERS,
} from "@/lib/classes/assignments/bank-types";
import {
  copyPart1QuestionByNumber,
  copyPart5QuestionByNumber,
  loadLectureBankCatalog,
  type LectureBankCatalog,
  type Part5QuestionCopy,
} from "@/lib/admin/lectures/bank-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { copy } from "@/lib/copy/vi";
import { emptyLectureQuestion } from "@/lib/lectures/options";
import type { LectureQuestionInsert } from "@/lib/lectures/options";

function questionFromCopy(source: Part5QuestionCopy): LectureQuestionInsert {
  const question = emptyLectureQuestion(1);
  const options = source.options.map((option) => ({
    id: crypto.randomUUID(),
    label: option.label,
    text: option.text,
  }));
  const correct = options.find((option) => option.label === source.correctLabel);
  return {
    ...question,
    stem: source.stem,
    options,
    correctOptionId: correct?.id ?? options[0]?.id ?? null,
    explanation: source.explanation,
    payload: {
      ...question.payload,
      bankQuestionId: source.bankQuestionId,
      ...(source.part ? { part: source.part } : {}),
      ...(source.bankBookId ? { bankBookId: source.bankBookId } : {}),
      ...(source.bankTestId ? { bankTestId: source.bankTestId } : {}),
      ...(source.bankItemNumber != null
        ? { bankItemNumber: source.bankItemNumber }
        : {}),
    },
  };
}

export function AdminLecturePart5SearchDialog({
  open,
  onOpenChange,
  onFilled,
  part = "5",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFilled: (question: LectureQuestionInsert) => void | false;
  part?: "1" | "5";
}) {
  const [catalog, setCatalog] = useState<LectureBankCatalog | null>(null);
  const [bookId, setBookId] = useState("");
  const [testId, setTestId] = useState("");
  const [questionNo, setQuestionNo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const tests = bookId ? (catalog?.testsByBookId[bookId] ?? []) : [];
  const fields = copy.admin.lectures.fields;
  const bank = copy.classes.assignments.editor;
  const numbers = part === "1" ? PART1_QUESTION_NUMBERS : PART5_QUESTION_NUMBERS;
  const parsed = Number(questionNo);
  const canSearch =
    Boolean(bookId && testId) &&
    Number.isInteger(parsed) &&
    (numbers as readonly number[]).includes(parsed);

  useEffect(() => {
    if (!open || catalog) return;
    startTransition(async () => {
      const result = await loadLectureBankCatalog();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCatalog(result.data);
    });
  }, [open, catalog]);

  function confirmSearch() {
    if (!canSearch) return;
    setError(null);
    startTransition(async () => {
      const result =
        part === "1"
          ? await copyPart1QuestionByNumber(bookId, testId, parsed)
          : await copyPart5QuestionByNumber(bookId, testId, parsed);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (onFilled(questionFromCopy(result.data)) === false) {
        setError(fields.practiceAdded);
        return;
      }
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{fields.searchBank}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <Select
            value={bookId || undefined}
            onValueChange={(value) => {
              setBookId(value);
              setTestId("");
              setQuestionNo("");
              setError(null);
            }}
            disabled={!catalog || isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder={bank.bankBook} />
            </SelectTrigger>
            <SelectContent className="z-[80]">
              {(catalog?.books ?? []).map((book) => (
                <SelectItem key={book.id} value={book.id}>
                  {book.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={testId || undefined}
            onValueChange={(value) => {
              setTestId(value);
              setQuestionNo("");
              setError(null);
            }}
            disabled={!bookId || isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder={bank.bankTest} />
            </SelectTrigger>
            <SelectContent className="z-[80]">
              {tests.map((test) => (
                <SelectItem key={test.id} value={test.id}>
                  {test.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={questionNo || undefined}
            onValueChange={(value) => {
              setQuestionNo(value);
              setError(null);
            }}
            disabled={!testId || isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder={fields.bankQuestionNo} />
            </SelectTrigger>
            <SelectContent className="z-[80]">
              {numbers.map((number) => (
                <SelectItem key={number} value={String(number)}>
                  {number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter>
          <Button
            type="button"
            disabled={!canSearch || isPending}
            onClick={confirmSearch}
          >
            {fields.searchConfirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
