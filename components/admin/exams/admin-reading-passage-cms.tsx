"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { ExportPassageTranslationsButton } from "@/components/admin/export/export-passage-translations-button";
import { ImportContentVocabularyDialog } from "@/components/admin/import/import-content-vocabulary-dialog";
import { ImportPassageTranslationsDialog } from "@/components/admin/import/import-passage-translations-dialog";
import { DifficultyScaleBar } from "@/components/study/difficulty-scale-bar";
import {
  AdminPassageDetailDialog,
  type PassageSetDraft,
} from "@/components/admin/exams/admin-passage-detail-dialog";
import type { QuestionDraft } from "@/components/admin/exams/admin-question-detail-dialog";
import {
  saveAdminPassageSet,
  saveAdminQuestionRow,
} from "@/lib/admin/content/part-editor-actions";
import { draftFieldsToExplanation } from "@/lib/content/question-explanation";
import { copy } from "@/lib/copy/vi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  AdminPartEditorData,
  AdminPassageSetRow,
} from "@/types/admin-part-editor";
import type { OptionLabelDb } from "@/types/content-db";
import { stripPassageHtml } from "@/lib/reading/passage-html";
import { cn } from "@/lib/utils";
import { passageSetDifficultyStatKey } from "@/lib/practice/feedback/stat-keys";
import type { PracticeDifficultyStatsMap } from "@/lib/practice/feedback/types";

interface AdminReadingPassageCmsProps {
  initialData: AdminPartEditorData;
  difficultyStats?: PracticeDifficultyStatsMap;
}

const ALL_LABELS: OptionLabelDb[] = ["A", "B", "C", "D"];

function questionRangeLabel(set: AdminPassageSetRow, questionById: Map<string, { globalItemNumber: number }>) {
  const numbers = set.questionIds
    .map((id) => questionById.get(id)?.globalItemNumber)
    .filter((value): value is number => value != null)
    .sort((a, b) => a - b);

  if (numbers.length === 0) return copy.admin.cms.passageCardQuestions(0);
  const start = numbers[0];
  const end = numbers[numbers.length - 1];
  return copy.session.questionRange(start, end);
}

function passagePreview(set: AdminPassageSetRow): string {
  const primary = set.passages[0];
  if (!primary) return copy.admin.cms.emptyAnswer;

  const text = stripPassageHtml(primary.content);
  const snippet = text.replace(/\s+/g, " ").trim();
  return snippet.slice(0, 160) || primary.title || copy.admin.cms.emptyAnswer;
}

export function AdminReadingPassageCms({
  initialData,
  difficultyStats,
}: AdminReadingPassageCmsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);

  const partNum = Number.parseInt(initialData.part, 10);

  const questionById = useMemo(
    () => new Map(initialData.questions.map((question) => [question.id, question])),
    [initialData.questions],
  );

  const selectedSet = selectedSetId
    ? initialData.passageSets.find((set) => set.id === selectedSetId) ?? null
    : null;

  const selectedQuestions = useMemo(() => {
    if (!selectedSet) return [];
    return selectedSet.questionIds
      .map((id) => questionById.get(id))
      .filter((question): question is NonNullable<typeof question> => question != null)
      .sort((a, b) => a.globalItemNumber - b.globalItemNumber);
  }, [questionById, selectedSet]);

  function runAction(
    action: () => Promise<{ ok: boolean; error?: string }>,
    onSuccess?: () => void,
  ) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast.error(result.error ?? copy.admin.cms.errors.generic);
        return;
      }
      toast.success(copy.admin.cms.saved);
      onSuccess?.();
      router.refresh();
    });
  }

  function savePassageSet(setId: string, draft: PassageSetDraft) {
    runAction(
      () =>
        saveAdminPassageSet(
          initialData.bookId,
          initialData.testId,
          partNum,
          setId,
          draft,
        ),
      () => setSelectedSetId(null),
    );
  }

  function saveQuestionRow(questionId: string, draft: QuestionDraft) {
    const source = questionById.get(questionId);
    if (!source) return;

    const options = ALL_LABELS.map((label) => draft.options[label])
      .filter((option): option is NonNullable<typeof option> => Boolean(option))
      .map((option) => ({
        id: option.id,
        text: option.text,
      }));

    const correctOption = draft.correctLabel
      ? source.options.find((option) => option.label === draft.correctLabel)
      : null;

    runAction(() =>
      saveAdminQuestionRow(
        initialData.bookId,
        initialData.testId,
        partNum,
        questionId,
        {
          globalItemNumber: draft.globalItemNumber,
          prompt: draft.prompt,
          correctOptionId: correctOption?.id ?? null,
          options,
          hint: draft.hint.trim() ? draft.hint.trim() : null,
          explanation: draftFieldsToExplanation(
            draft.explanationReasoning,
            draft.explanationReferences,
          ),
          freeExplanation: draft.freeExplanation,
          tags: draft.tags,
        },
      ),
    );
  }

  const partForImport = partNum === 6 || partNum === 7 ? partNum : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {copy.admin.cms.passageSetCount(
            initialData.passageSets.length,
            initialData.questions.length,
          )}
        </p>
        {partForImport ? (
          <div className="flex flex-wrap items-center gap-2">
            <ExportPassageTranslationsButton
              bookId={initialData.bookId}
              testId={initialData.testId}
              part={partForImport}
              disabled={isPending}
            />
            <ImportPassageTranslationsDialog
              bookId={initialData.bookId}
              testId={initialData.testId}
              part={partForImport}
              disabled={isPending}
            />
            <ImportContentVocabularyDialog
              bookId={initialData.bookId}
              testId={initialData.testId}
              part={partForImport}
              disabled={isPending}
            />
          </div>
        ) : null}
      </div>

      {initialData.passageSets.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {copy.admin.cms.noPassageSets}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {initialData.passageSets.map((set) => {
            const primaryPassage = set.passages[0];
            const title =
              primaryPassage?.title.trim() ||
              set.topic?.trim() ||
              copy.admin.cms.emptyAnswer;
            const setDifficultyStat = difficultyStats?.get(
              passageSetDifficultyStatKey(set.id),
            );

            return (
              <button
                key={set.id}
                type="button"
                onClick={() => setSelectedSetId(set.id)}
                className="text-left"
              >
                <Card
                  className={cn(
                    "h-full transition-calm hover:-translate-y-px hover:border-primary/30 hover:shadow-card",
                  )}
                >
                  <CardHeader className="space-y-3 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
                        <FileText className="size-5" />
                      </div>
                      <Badge variant="outline">{set.layout}</Badge>
                    </div>
                    <CardTitle className="line-clamp-2 text-lg">{title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <DifficultyScaleBar score={setDifficultyStat?.median ?? 0} />
                    <p className="line-clamp-4 text-sm text-muted-foreground">
                      {passagePreview(set)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        {questionRangeLabel(set, questionById)}
                      </Badge>
                      {set.passages.length > 1 ? (
                        <Badge variant="outline">
                          {set.passages.length} passages
                        </Badge>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      <AdminPassageDetailDialog
        open={selectedSetId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedSetId(null);
        }}
        bookId={initialData.bookId}
        testId={initialData.testId}
        passageSet={selectedSet}
        questions={selectedQuestions}
        partNum={partNum}
        optionLabels={ALL_LABELS}
        isPending={isPending}
        onSavePassageSet={savePassageSet}
        onSaveQuestion={saveQuestionRow}
      />
    </div>
  );
}
