"use client";

import { useMemo, useState } from "react";
import type { ExamAttemptStatsRow } from "@/lib/admin/dashboard/aggregate-exam-attempt-stats";
import { formatAttemptRelativeTime } from "@/lib/admin/dashboard/format-attempt-relative-time";
import {
  filterAndSortExamAttemptStudents,
  type ExamAttemptStudentSortKey,
  type ExamAttemptStudentSortState,
} from "@/lib/admin/dashboard/filter-exam-attempt-students";
import { formatFinishedTime } from "@/lib/classes/activity-summary";
import { formatCatalogTitleReference } from "@/lib/content/resolve-catalog-display";
import { copy } from "@/lib/copy/vi";
import { SortableTableHead } from "@/components/admin/dashboard/sortable-table-head";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const TABLE_MAX_HEIGHT_CLASS = "max-h-[calc(2.5rem+12*3.25rem)]";

function formatScore(value: number | null): string {
  if (value == null) return copy.user.noData;
  return new Intl.NumberFormat("vi-VN").format(value);
}

function formatLastTakenAt(value: string | null): string {
  if (!value) return copy.user.noData;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function TwoLineCell({
  value,
  subtitle,
}: {
  value: string;
  subtitle: string | null;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-medium">{value}</span>
      {subtitle ? (
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      ) : null}
    </div>
  );
}

function ExamAttemptStudentsTable({
  students,
}: {
  students: NonNullable<ExamAttemptStatsRow["students"]>;
}) {
  const [nameQuery, setNameQuery] = useState("");
  const [sort, setSort] = useState<ExamAttemptStudentSortState | null>(null);
  const visibleStudents = useMemo(
    () => filterAndSortExamAttemptStudents(students, nameQuery, sort),
    [students, nameQuery, sort],
  );

  function toggleSort(key: ExamAttemptStudentSortKey) {
    setSort((current) => {
      if (current?.key !== key) return { key, dir: "desc" };
      return { key, dir: current.dir === "desc" ? "asc" : "desc" };
    });
  }

  return (
    <div
      className={cn(
        "min-w-0 overflow-x-auto overflow-y-auto rounded-[16px] border border-border",
        TABLE_MAX_HEIGHT_CLASS,
      )}
    >
      <table className="w-full min-w-max caption-bottom text-sm">
        <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/80">
          <TableRow>
            <TableHead className="h-auto py-2">
              <div className="flex flex-col gap-1.5">
                <span>
                  {copy.admin.overview.examAttempts.studentsDialog.columns.user}
                </span>
                <Input
                  value={nameQuery}
                  onChange={(event) => setNameQuery(event.target.value)}
                  placeholder={
                    copy.admin.overview.examAttempts.studentsDialog
                      .searchPlaceholder
                  }
                  className="h-8 min-w-[10rem] font-normal normal-case tracking-normal"
                  aria-label={
                    copy.admin.overview.examAttempts.studentsDialog
                      .searchPlaceholder
                  }
                />
              </div>
            </TableHead>
            <SortableTableHead
              label={
                copy.admin.overview.examAttempts.studentsDialog.columns.time
              }
              sortKey="lastTakenAt"
              sort={sort}
              onToggle={toggleSort}
            />
            <SortableTableHead
              label={
                copy.admin.overview.examAttempts.studentsDialog.columns
                  .totalScore
              }
              sortKey="totalScore"
              sort={sort}
              onToggle={toggleSort}
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleStudents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-muted-foreground">
                {copy.admin.overview.examAttempts.studentsDialog.searchEmpty}
              </TableCell>
            </TableRow>
          ) : (
            visibleStudents.map((student) => (
              <TableRow key={student.userId}>
                <TableCell className="whitespace-nowrap">
                  <TwoLineCell
                    value={student.displayName}
                    subtitle={formatAttemptRelativeTime(student.lastTakenAt)}
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">
                  <TwoLineCell
                    value={formatLastTakenAt(student.lastTakenAt)}
                    subtitle={formatFinishedTime(student.finishedTimeSeconds)}
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">
                  <TwoLineCell
                    value={formatScore(student.totalScore)}
                    subtitle={
                      student.listeningScore != null &&
                      student.readingScore != null
                        ? copy.classes.scoreDetail.examSections(
                            student.listeningScore,
                            student.readingScore,
                          )
                        : copy.user.noData
                    }
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </table>
    </div>
  );
}

export function ExamAttemptStudentsDialog({
  row,
  open,
  onOpenChange,
}: {
  row: ExamAttemptStatsRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const testName = row
    ? formatCatalogTitleReference(row.bookName, row.testLabel)
    : "";
  const students = row?.students ?? [];
  const tableKey = row ? `${row.bookId}::${row.testId}` : "empty";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{testName}</DialogTitle>
          <DialogDescription>
            {copy.admin.overview.examAttempts.studentsDialog.description(
              students.length,
            )}
          </DialogDescription>
        </DialogHeader>
        {students.length === 0 ? (
          <p className="rounded-[12px] border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
            {copy.admin.overview.examAttempts.studentsDialog.empty}
          </p>
        ) : (
          <ExamAttemptStudentsTable key={tableKey} students={students} />
        )}
      </DialogContent>
    </Dialog>
  );
}
