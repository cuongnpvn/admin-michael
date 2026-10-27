"use client";

import { DAILY_GOAL_TIMEZONE } from "@/lib/learning/daily-goals/date-key";
import { copy } from "@/lib/copy/vi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const TABLE_MAX_HEIGHT_CLASS = "max-h-[calc(2.5rem+12*3.25rem)]";

export type DashboardTodayListRow = {
  id: string;
  displayName: string;
  createdAt: string;
  subtitle?: string | null;
};

function formatTodayTime(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: DAILY_GOAL_TIMEZONE,
  }).format(new Date(value));
}

export function formatDashboardPeriodEnd(value: string | null): string {
  if (!value) return copy.admin.users.noExpiry;
  try {
    return new Date(value).toLocaleDateString("vi-VN");
  } catch {
    return value;
  }
}

export function DashboardTodayListDialog({
  open,
  onOpenChange,
  title,
  description,
  empty,
  rows,
  showSubtitleColumn = false,
  subtitleColumnLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  empty: string;
  rows: DashboardTodayListRow[];
  showSubtitleColumn?: boolean;
  subtitleColumnLabel?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {rows.length === 0 ? (
          <p className="rounded-[12px] border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
            {empty}
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
                    {copy.admin.overview.todayLists.columns.user}
                  </TableHead>
                  <TableHead>
                    {copy.admin.overview.todayLists.columns.time}
                  </TableHead>
                  {showSubtitleColumn ? (
                    <TableHead>{subtitleColumnLabel}</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap font-medium">
                      {row.displayName}
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                      {formatTodayTime(row.createdAt)}
                    </TableCell>
                    {showSubtitleColumn ? (
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {row.subtitle ?? copy.user.noData}
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
