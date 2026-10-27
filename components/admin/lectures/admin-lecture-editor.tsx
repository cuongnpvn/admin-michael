"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { AdminLectureHtmlField } from "@/components/admin/lectures/admin-lecture-html-field";
import { AdminLectureSkillTagsField } from "@/components/admin/lectures/admin-lecture-skill-tags-field";
import { AdminLecturePracticePicker } from "@/components/admin/lectures/admin-lecture-practice-picker";
import { AdminLectureQuestionEditor } from "@/components/admin/lectures/admin-lecture-question-editor";
import { AdminLectureTestEditor } from "@/components/admin/lectures/admin-lecture-test-editor";
import { AdminLectureVocabEditor } from "@/components/admin/lectures/admin-lecture-vocab-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteLecture, publishLecture, saveLectureEditor } from "@/lib/admin/lectures/editor-actions";
import { adminLectureCollectionPath } from "@/lib/lectures/paths";
import { prettyPrintLectureHtml } from "@/lib/lectures/pretty-print-html";
import { normalizeLectureTags } from "@/lib/lectures/tags";
import type { LecturePracticeRef } from "@/lib/lectures/practice";
import type { LectureVocabDraft, LectureVocabItem } from "@/lib/lectures/vocab";
import { lectureVocabDrafts } from "@/lib/lectures/vocab";
import type { LectureDetail, LectureFormat, LectureQuestionWithKey } from "@/lib/lectures/types";
import type { LectureQuestionInsert } from "@/lib/lectures/options";
import { copy } from "@/lib/copy/vi";

type LectureItemType = "normal" | "practice" | "test" | "final" | "rest" | "vocab";

function setLectureItemType(
  type: LectureItemType,
  apply: {
    setFormat: (format: LectureFormat) => void;
    setIsRestDay: (value: boolean) => void;
    setIsMiniTestDay: (value: boolean) => void;
    setIsFinalTestDay: (value: boolean) => void;
  },
) {
  if (type === "rest") {
    apply.setFormat("lesson");
    apply.setIsRestDay(true);
    apply.setIsMiniTestDay(false);
    apply.setIsFinalTestDay(false);
    return;
  }
  if (type === "test") {
    apply.setFormat("lesson");
    apply.setIsRestDay(false);
    apply.setIsMiniTestDay(true);
    apply.setIsFinalTestDay(false);
    return;
  }
  if (type === "final") {
    apply.setFormat("lesson");
    apply.setIsRestDay(false);
    apply.setIsMiniTestDay(false);
    apply.setIsFinalTestDay(true);
    return;
  }
  if (type === "practice") {
    apply.setFormat("practice");
    apply.setIsRestDay(false);
    apply.setIsMiniTestDay(false);
    apply.setIsFinalTestDay(false);
    return;
  }
  if (type === "vocab") {
    apply.setFormat("vocab");
    apply.setIsRestDay(false);
    apply.setIsMiniTestDay(false);
    apply.setIsFinalTestDay(false);
    return;
  }
  apply.setFormat("lesson");
  apply.setIsRestDay(false);
  apply.setIsMiniTestDay(false);
  apply.setIsFinalTestDay(false);
}

function toDraftQuestions(questions: LectureQuestionWithKey[]): LectureQuestionInsert[] {
  return questions.map((question) => ({
    sortOrder: question.sortOrder,
    kind: question.kind,
    stem: question.stem,
    options: question.options,
    payload: question.payload,
    correctOptionId: question.correctOptionId,
    explanation: question.explanation,
    answer: question.answer,
  }));
}

export function AdminLectureEditor({
  lecture,
  questions,
  practiceQuestions,
  vocabItems,
}: {
  lecture: LectureDetail;
  questions: LectureQuestionWithKey[];
  practiceQuestions: LecturePracticeRef[];
  vocabItems: LectureVocabItem[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(lecture.title);
  const [excerpt, setExcerpt] = useState(lecture.excerpt);
  const [bodyHtml, setBodyHtml] = useState(() =>
    prettyPrintLectureHtml(lecture.bodyHtml),
  );
  const [tags, setTags] = useState(lecture.tags);
  const [minutes, setMinutes] = useState(
    lecture.estimatedMinutes != null ? String(lecture.estimatedMinutes) : "",
  );
  const [dayNumber, setDayNumber] = useState(
    lecture.dayNumber != null ? String(lecture.dayNumber) : "",
  );
  const [reviewGoal, setReviewGoal] = useState(lecture.reviewGoal);
  const [isRestDay, setIsRestDay] = useState(lecture.isRestDay);
  const [isMiniTestDay, setIsMiniTestDay] = useState(lecture.isMiniTestDay);
  const [isFinalTestDay, setIsFinalTestDay] = useState(lecture.isFinalTestDay);
  const [format, setFormat] = useState<LectureFormat>(lecture.format);
  const [draftQuestions, setDraftQuestions] = useState(toDraftQuestions(questions));
  const [draftPractice, setDraftPractice] = useState(practiceQuestions);
  const [draftVocab, setDraftVocab] = useState<LectureVocabDraft[]>(() =>
    lectureVocabDrafts(vocabItems),
  );
  const [error, setError] = useState<string | null>(null);
  const [contentPending, setContentPending] = useState(false);
  const [isPending, startTransition] = useTransition();
  const insertHtml = useRef<(snippet: string) => void>(() => {});
  const itemType: LectureItemType = isRestDay
    ? "rest"
    : isFinalTestDay
      ? "final"
      : isMiniTestDay
        ? "test"
        : format === "practice"
          ? "practice"
          : format === "vocab"
            ? "vocab"
            : "normal";

  useEffect(() => {
    setTitle(lecture.title);
    setExcerpt(lecture.excerpt);
    setBodyHtml(prettyPrintLectureHtml(lecture.bodyHtml));
    setTags(lecture.tags);
    setMinutes(
      lecture.estimatedMinutes != null ? String(lecture.estimatedMinutes) : "",
    );
    setDayNumber(lecture.dayNumber != null ? String(lecture.dayNumber) : "");
    setReviewGoal(lecture.reviewGoal);
    setIsRestDay(lecture.isRestDay);
    setIsMiniTestDay(lecture.isMiniTestDay);
    setIsFinalTestDay(lecture.isFinalTestDay);
    setFormat(lecture.format);
    setDraftQuestions(toDraftQuestions(questions));
    setDraftPractice(practiceQuestions);
    setDraftVocab(lectureVocabDrafts(vocabItems));
  }, [lecture, questions, practiceQuestions, vocabItems]);

  function editorPayload() {
    return {
      lectureId: lecture.id,
      collectionId: lecture.collectionId,
      title,
      excerpt,
      bodyHtml,
      tags: normalizeLectureTags(tags),
      estimatedMinutes: minutes ? Number(minutes) : null,
      dayNumber: dayNumber ? Number(dayNumber) : null,
      reviewGoal,
      isRestDay,
      isMiniTestDay,
      isFinalTestDay,
      format,
      questions: draftQuestions,
      practiceQuestionIds:
        itemType === "test" || itemType === "final"
          ? []
          : draftPractice.map((item) => item.questionId),
      vocabItems: draftVocab,
    };
  }

  function handleSave() {
    if (contentPending) {
      setError(copy.admin.lectures.fields.unsavedBlock);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await saveLectureEditor(editorPayload());
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handlePublish(published: boolean) {
    if (contentPending) {
      setError(copy.admin.lectures.fields.unsavedBlock);
      return;
    }
    setError(null);
    startTransition(async () => {
      const saved = await saveLectureEditor(editorPayload());
      if (!saved.ok) {
        setError(saved.error);
        return;
      }
      const result = await publishLecture({
        lectureId: lecture.id,
        collectionId: lecture.collectionId,
        published,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleDelete() {
    if (!window.confirm(copy.admin.lectures.deleteConfirm)) return;
    startTransition(async () => {
      const result = await deleteLecture({
        lectureId: lecture.id,
        collectionId: lecture.collectionId,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(adminLectureCollectionPath(lecture.collectionId));
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href={adminLectureCollectionPath(lecture.collectionId)}>
            {copy.admin.lectures.backToCollections}
          </Link>
        </Button>
        <Button type="button" onClick={handleSave} disabled={isPending}>
          {copy.admin.lectures.save}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => handlePublish(!lecture.published)}
        >
          {lecture.published ? copy.admin.lectures.unpublish : copy.admin.lectures.publish}
        </Button>
        <Button type="button" variant="outline" disabled={isPending} onClick={handleDelete}>
          {copy.admin.lectures.delete}
        </Button>
      </div>

      {lecture.extractStatus === "failed" && lecture.extractError ? (
        <p className="rounded-[12px] border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {lecture.extractError}
        </p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>{copy.admin.lectures.fields.title}</Label>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{copy.admin.lectures.fields.excerpt}</Label>
          <Input value={excerpt} onChange={(event) => setExcerpt(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lecture-review">{copy.admin.lectures.fields.reviewGoal}</Label>
          <Input
            id="lecture-review"
            value={reviewGoal}
            onChange={(event) => setReviewGoal(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            {copy.admin.lectures.fields.reviewGoalHint}
          </p>
        </div>
        <AdminLectureSkillTagsField selectedTags={tags} onChange={setTags} />
        <div className="space-y-2">
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-24 space-y-2">
              <Label>{copy.admin.lectures.fields.minutes}</Label>
              <Input
                type="number"
                min={1}
                className="tabular-nums"
                value={minutes}
                onChange={(event) => setMinutes(event.target.value)}
              />
            </div>
            <div className="w-36 space-y-2">
              <Label htmlFor="lecture-day">{copy.admin.lectures.fields.dayNumber}</Label>
              <Input
                id="lecture-day"
                type="number"
                min={1}
                className="tabular-nums"
                aria-describedby="lecture-day-hint"
                value={dayNumber}
                onChange={(event) => setDayNumber(event.target.value)}
              />
            </div>
            <div className="w-full space-y-2 sm:w-52">
              <Label htmlFor="lecture-type">{copy.admin.lectures.fields.itemType}</Label>
              <select
                id="lecture-type"
                className="flex h-9 w-full rounded-[10px] border border-border bg-surface px-3 text-sm shadow-sm"
                value={itemType}
                onChange={(event) =>
                  setLectureItemType(event.target.value as LectureItemType, {
                    setFormat,
                    setIsRestDay,
                    setIsMiniTestDay,
                    setIsFinalTestDay,
                  })
                }
              >
                {(["normal", "practice", "test", "final", "rest", "vocab"] as const).map((type) => (
                  <option key={type} value={type}>
                    {copy.admin.lectures.fields.itemTypes[type]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p id="lecture-day-hint" className="text-xs text-muted-foreground">
            {copy.admin.lectures.fields.dayNumberHint}
          </p>
        </div>
      </div>

      {itemType === "vocab" ? (
        <AdminLectureVocabEditor items={draftVocab} onChange={setDraftVocab} />
      ) : (
        <AdminLectureHtmlField
          lectureId={lecture.id}
          value={bodyHtml}
          onChange={setBodyHtml}
          insertRef={insertHtml}
        />
      )}

      {itemType === "vocab" ? null : itemType === "test" || itemType === "final" ? (
        <AdminLectureTestEditor
          questions={draftQuestions}
          onChange={setDraftQuestions}
          onPendingChange={setContentPending}
        />
      ) : (
        <>
          <AdminLectureQuestionEditor
            questions={draftQuestions}
            onChange={setDraftQuestions}
            onPendingChange={setContentPending}
            onInsertLink={(section) =>
              insertHtml.current(`<a href="#exercise-${section}">luyện tập</a>`)
            }
          />
          <AdminLecturePracticePicker
            selected={draftPractice}
            onChange={setDraftPractice}
          />
        </>
      )}
    </div>
  );
}
