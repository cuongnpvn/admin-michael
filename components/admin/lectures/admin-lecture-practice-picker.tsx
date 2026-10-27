"use client";

import { useEffect, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { AdminLecturePart5SearchDialog } from "@/components/admin/lectures/admin-lecture-part5-bank";
import {
  listLectureBankQuestions,
  loadLectureBankCatalog,
  type LectureBankCatalog,
  type LectureBankQuestion,
} from "@/lib/admin/lectures/bank-actions";
import { copy } from "@/lib/copy/vi";
import type { LecturePracticeRef } from "@/lib/lectures/practice";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PARTS = ["1", "2", "3", "4", "5", "6", "7"] as const;

function stemPreview(stem: string): string {
  return stem.length > 140 ? `${stem.slice(0, 140)}…` : stem;
}

export function AdminLecturePracticePicker({
  selected,
  onChange,
}: {
  selected: LecturePracticeRef[];
  onChange: (next: LecturePracticeRef[]) => void;
}) {
  const [catalog, setCatalog] = useState<LectureBankCatalog | null>(null);
  const [bookId, setBookId] = useState("");
  const [testId, setTestId] = useState("");
  const [part, setPart] = useState("1");
  const [bank, setBank] = useState<LectureBankQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const selectedIds = new Set(selected.map((item) => item.questionId));
  const tests = bookId ? (catalog?.testsByBookId[bookId] ?? []) : [];

  useEffect(() => {
    startTransition(async () => {
      const result = await loadLectureBankCatalog();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCatalog(result.data);
    });
  }, []);

  useEffect(() => {
    if (!bookId || !testId || part === "1") {
      setBank([]);
      return;
    }
    startTransition(async () => {
      const result = await listLectureBankQuestions(testId, part, bookId);
      if (!result.ok) {
        setError(result.error);
        setBank([]);
        return;
      }
      setError(null);
      setBank(result.data);
    });
  }, [bookId, testId, part]);

  function addQuestion(question: LectureBankQuestion) {
    if (selectedIds.has(question.id)) return;
    onChange([
      ...selected,
      {
        questionId: question.id,
        part: question.part,
        globalItemNumber: question.globalItemNumber,
        stem: question.stem,
      },
    ]);
  }

  function removeQuestion(questionId: string) {
    onChange(selected.filter((item) => item.questionId !== questionId));
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= selected.length) return;
    const next = [...selected];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(nextIndex, 0, item);
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-[16px] border border-dashed border-border p-4">
        <h3 className="text-sm font-semibold">
          {copy.admin.lectures.fields.practiceBank}
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {part === "1" ? null : (
            <>
              <Select
                value={bookId || undefined}
                onValueChange={(value) => {
                  setBookId(value);
                  setTestId("");
                  setBank([]);
                }}
                disabled={!catalog || isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder={copy.classes.assignments.editor.bankBook} />
                </SelectTrigger>
                <SelectContent>
                  {(catalog?.books ?? []).map((book) => (
                    <SelectItem key={book.id} value={book.id}>
                      {book.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={testId || undefined}
                onValueChange={setTestId}
                disabled={!bookId || isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder={copy.classes.assignments.editor.bankTest} />
                </SelectTrigger>
                <SelectContent>
                  {tests.map((test) => (
                    <SelectItem key={test.id} value={test.id}>
                      {test.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
          <Select value={part} onValueChange={setPart} disabled={isPending}>
            <SelectTrigger>
              <SelectValue placeholder={copy.common.part} />
            </SelectTrigger>
            <SelectContent>
              {PARTS.map((value) => (
                <SelectItem key={value} value={value}>
                  {copy.common.part} {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {part === "1" ? (
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="size-3.5" />
              {copy.admin.lectures.fields.searchBank}
            </Button>
            <AdminLecturePart5SearchDialog
              part="1"
              open={searchOpen}
              onOpenChange={setSearchOpen}
              onFilled={(question) => {
                const id = question.payload.bankQuestionId;
                const number = question.payload.bankItemNumber;
                if (!id || number == null || selectedIds.has(id)) return false;
                onChange([
                  ...selected,
                  {
                    questionId: id,
                    part: "1",
                    globalItemNumber: number,
                    stem: question.stem,
                  },
                ]);
              }}
            />
          </div>
        ) : (
          <ul className="max-h-72 space-y-2 overflow-y-auto">
            {bank.map((question) => {
              const added = selectedIds.has(question.id);
              return (
                <li
                  key={question.id}
                  className="flex items-start justify-between gap-3 rounded-[12px] border border-border px-3 py-2"
                >
                  <p className="min-w-0 text-sm">
                    <span className="font-medium">{question.globalItemNumber}. </span>
                    {stemPreview(question.stem)}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={added}
                    onClick={() => addQuestion(question)}
                  >
                    {added
                      ? copy.admin.lectures.fields.practiceAdded
                      : copy.admin.lectures.fields.practiceAdd}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">{copy.admin.lectures.fields.exercise}</h3>
        {selected.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {copy.admin.lectures.fields.practiceEmpty}
          </p>
        ) : (
          <ol className="space-y-2">
            {selected.map((item, index) => (
              <li
                key={item.questionId}
                className="flex items-start justify-between gap-3 rounded-[12px] border border-border px-3 py-2"
              >
                <p className="min-w-0 text-sm">
                  <span className="font-medium">
                    {index + 1}. {copy.common.part} {item.part} · {item.globalItemNumber}
                  </span>
                  <span className="mt-1 block text-muted-foreground">
                    {stemPreview(item.stem)}
                  </span>
                </p>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={index === 0}
                    onClick={() => moveQuestion(index, -1)}
                  >
                    {copy.admin.lectures.fields.practiceMoveUp}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={index === selected.length - 1}
                    onClick={() => moveQuestion(index, 1)}
                  >
                    {copy.admin.lectures.fields.practiceMoveDown}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => removeQuestion(item.questionId)}
                  >
                    {copy.admin.lectures.fields.practiceRemove}
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
