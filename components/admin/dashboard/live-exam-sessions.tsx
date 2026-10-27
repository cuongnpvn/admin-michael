"use client";

import { useEffect, useState } from "react";
import { formatCatalogTitleReference } from "@/lib/content/resolve-catalog-display";
import {
  EXAM_LIVE_ADMIN_POLL_MS,
  examLiveElapsedParts,
} from "@/lib/exam/exam-live-session";
import {
  fetchLiveExamSessions,
  type LiveExamSessionRow,
} from "@/lib/admin/dashboard/fetch-live-exam-sessions";
import { copy } from "@/lib/copy/vi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const TABLE_MAX_HEIGHT_CLASS = "max-h-[calc(2.5rem+12*3.25rem)]";

function formatElapsed(startedAt: string, nowMs: number): string {
  const { hours, minutes } = examLiveElapsedParts(startedAt, nowMs);
  if (hours === 0 && minutes === 0) {
    return copy.admin.overview.liveExams.elapsedUnderMinute;
  }
  if (hours === 0) {
    return copy.admin.overview.liveExams.elapsedMinutes(minutes);
  }
  return copy.admin.overview.liveExams.elapsedHoursMinutes(hours, minutes);
}

function sectionLabel(section: LiveExamSessionRow["section"]): string {
  return section === "listening"
    ? copy.admin.overview.liveExams.sectionListening
    : copy.admin.overview.liveExams.sectionReading;
}

export function LiveExamSessions({
  initialSessions,
}: {
  initialSessions: LiveExamSessionRow[];
}) {
  const [sessions, setSessions] = useState(initialSessions);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    setSessions(initialSessions);
  }, [initialSessions]);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const next = await fetchLiveExamSessions();
        if (!cancelled) {
          setSessions(next);
          setNowMs(Date.now());
        }
      } catch (error) {
        console.error("fetchLiveExamSessions poll failed:", error);
      }
    };

    const intervalId = window.setInterval(() => {
      void poll();
    }, EXAM_LIVE_ADMIN_POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 p-5 pb-2">
        <CardTitle className="text-base font-semibold">
          {copy.admin.overview.liveExams.title}
        </CardTitle>
        <p className="text-sm tabular-nums text-muted-foreground">
          {copy.admin.overview.liveExams.count(sessions.length)}
        </p>
      </CardHeader>
      <CardContent className="p-5 pt-2">
        {sessions.length === 0 ? (
          <p className="rounded-[12px] border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
            {copy.admin.overview.liveExams.empty}
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
                    {copy.admin.overview.liveExams.columns.name}
                  </TableHead>
                  <TableHead>
                    {copy.admin.overview.liveExams.columns.test}
                  </TableHead>
                  <TableHead>
                    {copy.admin.overview.liveExams.columns.section}
                  </TableHead>
                  <TableHead>
                    {copy.admin.overview.liveExams.columns.elapsed}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((row) => (
                  <TableRow key={row.userId}>
                    <TableCell className="whitespace-nowrap font-medium">
                      {row.displayName}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatCatalogTitleReference(row.bookName, row.testLabel)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {sectionLabel(row.section)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                      {formatElapsed(row.startedAt, nowMs)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
