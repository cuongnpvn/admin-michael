"use client";

import { useMemo, useState } from "react";
import { ExamAttemptStudentsDialog } from "@/components/admin/dashboard/exam-attempt-students-dialog";
import {
  SortableTableHead,
  type TableSortDir,
  type TableSortState,
} from "@/components/admin/dashboard/sortable-table-head";
import type {
  ExamAttemptStatsByRange,
  ExamAttemptStatsRow,
  ExamScoreHolder,
} from "@/lib/admin/dashboard/fetch-admin-exam-attempt-stats";
import {
  catalogDisplayKey,
  formatCatalogTitleReference,
} from "@/lib/content/resolve-catalog-display";
import { copy } from "@/lib/copy/vi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type RangeKey = 7 | 30;
type SortKey = "totalAttempts" | "lastTakenAt" | "highest" | "lowest";
type SortDir = TableSortDir;
type SortState = TableSortState<SortKey>;

/** Header (~2.5rem) + ~20 body rows (~3.25rem each). */
const TABLE_MAX_HEIGHT_CLASS = "max-h-[calc(2.5rem+20*3.25rem)]";

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

function compareNullable(
  a: number | string | null,
  b: number | string | null,
  dir: SortDir,
): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (a === b) return 0;
  const cmp = a < b ? -1 : 1;
  return dir === "asc" ? cmp : -cmp;
}

function sortValue(
  row: ExamAttemptStatsRow,
  key: SortKey,
): number | string | null {
  if (key === "totalAttempts") return row.totalAttempts;
  if (key === "lastTakenAt") return row.lastTakenAt;
  if (key === "highest") return row.highest?.score ?? null;
  return row.lowest?.score ?? null;
}

function sortRows(
  rows: ExamAttemptStatsRow[],
  sort: SortState | null,
): ExamAttemptStatsRow[] {
  if (!sort) return rows;
  return [...rows].sort((a, b) => {
    const cmp = compareNullable(
      sortValue(a, sort.key),
      sortValue(b, sort.key),
      sort.dir,
    );
    if (cmp !== 0) return cmp;
    return formatCatalogTitleReference(a.bookName, a.testLabel).localeCompare(
      formatCatalogTitleReference(b.bookName, b.testLabel),
    );
  });
}

function ScoreHolderCell({ holder }: { holder: ExamScoreHolder | null }) {
  if (!holder) {
    return <span className="text-muted-foreground">{copy.user.noData}</span>;
  }

  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-medium tabular-nums">
        {formatScore(holder.score)}
      </span>
      <span className="text-xs text-muted-foreground">
        {holder.displayName}
      </span>
    </div>
  );
}

export function ExamAttemptsTable({
  statsByRange,
}: {
  statsByRange: ExamAttemptStatsByRange;
}) {
  const [range, setRange] = useState<RangeKey>(7);
  const [sort, setSort] = useState<SortState | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const rows = useMemo(
    () => (range === 7 ? statsByRange.days7 : statsByRange.days30),
    [range, statsByRange],
  );
  const sortedRows = useMemo(() => sortRows(rows, sort), [rows, sort]);
  const selectedRow =
    sortedRows.find(
      (row) => catalogDisplayKey(row.bookId, row.testId) === selectedKey,
    ) ?? null;

  function openStudents(row: ExamAttemptStatsRow) {
    setSelectedKey(catalogDisplayKey(row.bookId, row.testId));
  }

  function toggleSort(key: SortKey) {
    setSort((current) => {
      if (current?.key !== key) return { key, dir: "desc" };
      return { key, dir: current.dir === "desc" ? "asc" : "desc" };
    });
  }

  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 p-5 pb-2">
        <CardTitle className="text-base font-semibold">
          {copy.admin.overview.examAttempts.title}
        </CardTitle>
        <div className="flex rounded-[14px] border border-border-subtle p-0.5">
          {([7, 30] as const).map((days) => (
            <Button
              key={days}
              type="button"
              size="sm"
              variant="ghost"
              className={cn(
                "h-8 rounded-[12px] px-3 text-xs",
                range === days && "bg-muted text-foreground hover:bg-muted",
              )}
              onClick={() => {
                setRange(days);
                setSelectedKey(null);
              }}
            >
              {days === 7
                ? copy.admin.overview.chart.range7
                : copy.admin.overview.chart.range30}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-2">
        {sortedRows.length === 0 ? (
          <p className="rounded-[12px] border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
            {copy.admin.overview.examAttempts.empty}
          </p>
        ) : (
          <div
            className={cn(
              "min-w-0 overflow-x-auto overflow-y-auto rounded-[16px] border border-border",
              TABLE_MAX_HEIGHT_CLASS,
            )}
          >
            <table className="w-full min-w-max caption-bottom text-sm">
              <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/80">
                <TableRow>
                  <TableHead>
                    {copy.admin.overview.examAttempts.columns.test}
                  </TableHead>
                  <SortableTableHead
                    label={copy.admin.overview.examAttempts.columns.attempts}
                    sortKey="totalAttempts"
                    sort={sort}
                    onToggle={toggleSort}
                  />
                  <SortableTableHead
                    label={copy.admin.overview.examAttempts.columns.lastTakenAt}
                    sortKey="lastTakenAt"
                    sort={sort}
                    onToggle={toggleSort}
                  />
                  <SortableTableHead
                    label={copy.admin.overview.examAttempts.columns.highest}
                    sortKey="highest"
                    sort={sort}
                    onToggle={toggleSort}
                  />
                  <SortableTableHead
                    label={copy.admin.overview.examAttempts.columns.lowest}
                    sortKey="lowest"
                    sort={sort}
                    onToggle={toggleSort}
                  />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRows.map((row) => {
                  const testName = formatCatalogTitleReference(
                    row.bookName,
                    row.testLabel,
                  );
                  return (
                    <TableRow
                      key={`${row.bookId}::${row.testId}`}
                      className="cursor-pointer"
                      tabIndex={0}
                      aria-haspopup="dialog"
                      aria-label={copy.admin.overview.examAttempts.studentsDialog.openDetails(
                        testName,
                      )}
                      onClick={() => openStudents(row)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openStudents(row);
                        }
                      }}
                    >
                      <TableCell className="whitespace-nowrap font-medium">
                        {testName}
                      </TableCell>
                      <TableCell className="whitespace-nowrap tabular-nums">
                        {new Intl.NumberFormat("vi-VN").format(
                          row.totalAttempts,
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                        {formatLastTakenAt(row.lastTakenAt)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <ScoreHolderCell holder={row.highest} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <ScoreHolderCell holder={row.lowest} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </table>
          </div>
        )}
      </CardContent>
      <ExamAttemptStudentsDialog
        row={selectedRow}
        open={selectedRow != null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setSelectedKey(null);
        }}
      />
    </Card>
  );
}
