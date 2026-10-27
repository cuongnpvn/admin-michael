"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { copy } from "@/lib/copy/vi";
import type { StageDraft } from "@/lib/lectures/schedule";

export function AdminCollectionStagesField({
  stages,
  onChange,
}: {
  stages: StageDraft[];
  onChange: (stages: StageDraft[]) => void;
}) {
  function update(index: number, patch: Partial<StageDraft>) {
    onChange(
      stages.map((stage, stageIndex) =>
        stageIndex === index ? { ...stage, ...patch } : stage,
      ),
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>{copy.admin.lectures.stages}</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          {copy.admin.lectures.stagesHint}
        </p>
      </div>
      {stages.map((stage, index) => (
        <div
          key={`stage-${index}`}
          className="grid gap-3 rounded-[12px] border border-border p-3 sm:grid-cols-[1fr_6rem_6rem_auto]"
        >
          <div className="space-y-1">
            <Label htmlFor={`stage-title-${index}`}>
              {copy.admin.lectures.stageTitle}
            </Label>
            <Input
              id={`stage-title-${index}`}
              value={stage.title}
              onChange={(event) => update(index, { title: event.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`stage-start-${index}`}>
              {copy.admin.lectures.dayStart}
            </Label>
            <Input
              id={`stage-start-${index}`}
              type="number"
              min={1}
              value={stage.dayStart || ""}
              onChange={(event) =>
                update(index, { dayStart: Number(event.target.value) || 0 })
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`stage-end-${index}`}>
              {copy.admin.lectures.dayEnd}
            </Label>
            <Input
              id={`stage-end-${index}`}
              type="number"
              min={1}
              value={stage.dayEnd || ""}
              onChange={(event) =>
                update(index, { dayEnd: Number(event.target.value) || 0 })
              }
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                onChange(stages.filter((_, stageIndex) => stageIndex !== index))
              }
            >
              {copy.admin.lectures.removeStage}
            </Button>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          const lastEnd = stages[stages.length - 1]?.dayEnd ?? 0;
          onChange([
            ...stages,
            {
              title: `Giai đoạn ${stages.length + 1}`,
              dayStart: lastEnd + 1,
              dayEnd: lastEnd + 7,
            },
          ]);
        }}
      >
        {copy.admin.lectures.addStage}
      </Button>
    </div>
  );
}
