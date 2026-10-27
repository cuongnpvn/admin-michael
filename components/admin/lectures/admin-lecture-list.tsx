"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AdminCollectionStagesField } from "@/components/admin/lectures/admin-collection-stages-field";
import { AdminReorderLecturesDialog } from "@/components/admin/lectures/admin-reorder-lectures-dialog";
import { UploadLecturePdfDialog } from "@/components/admin/lectures/upload-lecture-pdf-dialog";
import { NotebookRichTextField } from "@/components/notebook/notebook-rich-text-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateLectureCollection } from "@/lib/admin/lectures/collection-actions";
import { courseSkillLabel } from "@/lib/lectures/course-skills";
import { adminLectureEditorPath, adminLecturesPath } from "@/lib/lectures/paths";
import type { StageDraft } from "@/lib/lectures/schedule";
import type {
  LectureAccessTier,
  LectureCollectionStage,
  LectureCollectionSummary,
  LectureSummary,
} from "@/lib/lectures/types";
import { copy } from "@/lib/copy/vi";

function toStageDrafts(stages: LectureCollectionStage[]): StageDraft[] {
  return stages.map((stage) => ({
    title: stage.title,
    dayStart: stage.dayStart,
    dayEnd: stage.dayEnd,
  }));
}

export function AdminLectureList({
  collection,
  lectures,
  stages,
}: {
  collection: LectureCollectionSummary;
  lectures: LectureSummary[];
  stages: LectureCollectionStage[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(collection.title);
  const [excerpt, setExcerpt] = useState(collection.excerpt);
  const [descriptionHtml, setDescriptionHtml] = useState(
    collection.descriptionHtml,
  );
  const [accessTier, setAccessTier] = useState<LectureAccessTier>(
    collection.accessTier,
  );
  const [published, setPublished] = useState(collection.published);
  const [stageDrafts, setStageDrafts] = useState(() => toStageDrafts(stages));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateLectureCollection({
        collectionId: collection.id,
        title,
        excerpt,
        descriptionHtml,
        accessTier,
        published,
        stages: stageDrafts,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSave} className="space-y-4 rounded-[16px] border border-border p-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="col-title">{copy.admin.lectures.collectionTitle}</Label>
            <Input
              id="col-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="col-excerpt">{copy.admin.lectures.collectionExcerpt}</Label>
            <Input
              id="col-excerpt"
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="col-description">
              {copy.admin.lectures.collectionDescription}
            </Label>
            <p className="text-xs text-muted-foreground">
              {copy.admin.lectures.collectionDescriptionHint}
            </p>
            <div className="overflow-hidden rounded-[12px] border border-input bg-background">
              <NotebookRichTextField
                id="col-description"
                value={descriptionHtml}
                onChange={setDescriptionHtml}
                placeholder={copy.admin.lectures.collectionDescription}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="col-tier">{copy.admin.lectures.accessTier}</Label>
            <select
              id="col-tier"
              className="h-10 w-full rounded-[12px] border border-input bg-background px-3 text-sm"
              value={accessTier}
              onChange={(event) =>
                setAccessTier(event.target.value as LectureAccessTier)
              }
            >
              <option value="free">{copy.admin.lectures.accessFree}</option>
              <option value="pro">{copy.admin.lectures.accessPro}</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={published}
              onChange={(event) => setPublished(event.target.checked)}
            />
            {copy.admin.lectures.published}
          </label>
          <AdminCollectionStagesField
            stages={stageDrafts}
            onChange={setStageDrafts}
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" disabled={isPending}>
          {copy.admin.lectures.save}
        </Button>
      </form>

      <div className="flex flex-wrap justify-end gap-2">
        <AdminReorderLecturesDialog
          collectionId={collection.id}
          lectures={lectures}
        />
        <UploadLecturePdfDialog collectionId={collection.id} />
      </div>

      {lectures.length === 0 ? (
        <p className="rounded-[12px] border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
          {copy.admin.lectures.emptyLectures}
        </p>
      ) : (
        <div className="space-y-3">
          {lectures.map((lecture) => (
            <div
              key={lecture.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-border px-4 py-3"
            >
              <div>
                <Link
                  href={adminLectureEditorPath(collection.id, lecture.id)}
                  className="font-medium hover:text-primary"
                >
                  {lecture.title}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {lecture.dayNumber != null
                    ? `${copy.lectures.day(lecture.dayNumber)} · `
                    : ""}
                  {lecture.format === "vocab"
                    ? copy.lectures.vocabCount(lecture.vocabCount ?? 0)
                    : `${copy.admin.lectures.exerciseCount(lecture.questionCount)} · ${lecture.extractStatus}`}
                  {lecture.tags.length > 0
                    ? ` · ${lecture.tags.map(courseSkillLabel).join(", ")}`
                    : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={lecture.published ? "default" : "secondary"}>
                  {lecture.published
                    ? copy.admin.lectures.published
                    : copy.admin.lectures.draft}
                </Badge>
                <UploadLecturePdfDialog
                  collectionId={collection.id}
                  lectureId={lecture.id}
                  size="sm"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <Button asChild variant="outline">
        <Link href={adminLecturesPath()}>{copy.admin.lectures.backToCollections}</Link>
      </Button>
    </div>
  );
}
