"use client";

import { useMemo } from "react";
import { copy } from "@/lib/copy/vi";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DifficultyScaleBar } from "@/components/study/difficulty-scale-bar";
import type { AdminPartQuestionRow } from "@/types/admin-part-editor";
import { groupDifficultyStatKey } from "@/lib/practice/feedback/stat-keys";
import type { PracticeDifficultyStatsMap } from "@/lib/practice/feedback/types";
import { cn } from "@/lib/utils";

export interface ListeningGroupSummary {
  groupId: string;
  questions: AdminPartQuestionRow[];
  transcript: string;
  from: number;
  to: number;
  hasTurnMarks: boolean;
}

export function buildListeningGroupSummaries(
  questions: AdminPartQuestionRow[],
): ListeningGroupSummary[] {
  const map = new Map<string, AdminPartQuestionRow[]>();

  for (const question of questions) {
    if (!question.listeningGroupId) continue;
    const list = map.get(question.listeningGroupId) ?? [];
    list.push(question);
    map.set(question.listeningGroupId, list);
  }

  return Array.from(map.entries())
    .map(([groupId, groupQuestions]) => {
      const sorted = [...groupQuestions].sort(
        (a, b) => a.globalItemNumber - b.globalItemNumber,
      );
      const first = sorted[0];
      const last = sorted[sorted.length - 1];

      return {
        groupId,
        questions: sorted,
        transcript: first?.groupTranscript ?? "",
        from: first?.globalItemNumber ?? 0,
        to: last?.globalItemNumber ?? 0,
        hasTurnMarks: (first?.groupTranscriptSegments?.length ?? 0) > 0,
      };
    })
    .sort((a, b) => a.from - b.from);
}

interface AdminListeningGroupGridProps {
  questions: AdminPartQuestionRow[];
  difficultyStats?: PracticeDifficultyStatsMap;
  onSelectGroup: (groupId: string) => void;
  showTurnAlignmentStatus?: boolean;
}

export function AdminListeningGroupGrid({
  questions,
  difficultyStats,
  onSelectGroup,
  showTurnAlignmentStatus = false,
}: AdminListeningGroupGridProps) {
  const groups = useMemo(
    () => buildListeningGroupSummaries(questions),
    [questions],
  );

  if (groups.length === 0) {
    return (
      <div className="rounded-[14px] border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
        {copy.admin.cms.groupGridEmpty}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {groups.map((group) => {
        const title =
          group.from === group.to
            ? copy.admin.cms.questionDetailTitle(group.from)
            : copy.admin.cms.groupDetailTitle(group.from, group.to);
        const groupDifficultyStat = difficultyStats?.get(
          groupDifficultyStatKey(group.groupId),
        );

        return (
          <Card
            key={group.groupId}
            role="button"
            tabIndex={0}
            className={cn(
              "cursor-pointer rounded-[14px] shadow-none transition-calm",
              "hover:border-primary/30 hover:bg-muted/20",
            )}
            onClick={() => onSelectGroup(group.groupId)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelectGroup(group.groupId);
              }
            }}
          >
            <CardHeader className="gap-3 p-4 pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base font-semibold">{title}</CardTitle>
                <div className="flex shrink-0 flex-wrap justify-end gap-1">
                  {showTurnAlignmentStatus ? (
                    <Badge
                      variant={group.hasTurnMarks ? "success" : "outline"}
                      className="font-normal"
                    >
                      {group.hasTurnMarks
                        ? copy.admin.cms.turnAlignment.markedBadge
                        : copy.admin.cms.turnAlignment.unmarkedBadge}
                    </Badge>
                  ) : null}
                  <Badge variant="secondary" className="font-normal">
                    {copy.admin.cms.groupCardQuestionCount(group.questions.length)}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 p-4 pt-0">
              <DifficultyScaleBar score={groupDifficultyStat?.median ?? 0} />

              <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">
                {group.transcript.trim() || copy.admin.cms.emptyAnswer}
              </p>

              <ul className="space-y-1 border-t border-border pt-3">
                {group.questions.map((question) => (
                  <li
                    key={question.id}
                    className="line-clamp-1 text-xs text-foreground/80"
                  >
                    <span className="font-medium text-muted-foreground">
                      {question.globalItemNumber}.
                    </span>{" "}
                    {question.prompt.trim() || copy.admin.cms.emptyAnswer}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
