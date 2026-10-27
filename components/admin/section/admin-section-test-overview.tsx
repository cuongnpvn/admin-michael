"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ExportPassageTranslationsGroup } from "@/components/admin/export/export-passage-translations-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { copy } from "@/lib/copy/vi";
import { adminPartPath } from "@/lib/admin/admin-paths";
import type { AdminTestStats } from "@/lib/admin/content/stats";
import type { PublishSection } from "@/lib/content/validate-section-counts";
import type { BookCatalogEntry, TestCatalogEntry } from "@/types/test-data";
import { listeningParts, readingParts } from "@/lib/mock";
import type { ListeningPart, ReadingPart } from "@/types/ui";

function PartSection({
  book,
  test,
  parts,
  section,
}: {
  book: BookCatalogEntry;
  test: TestCatalogEntry;
  parts: (ListeningPart | ReadingPart)[];
  section: PublishSection;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {parts.map((part) => (
        <Card key={part.part}>
          <CardHeader className="pb-3">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{book.name}</Badge>
              <Badge variant="secondary">{test.label}</Badge>
              <Badge>
                {copy.common.part} {part.part}
              </Badge>
            </div>
            <CardTitle className="text-base leading-snug">{part.title}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Button asChild variant="secondary" size="sm" className="w-full">
              <Link
                href={adminPartPath(book.id, test.id, part.part, undefined, section)}
              >
                {copy.admin.actions.manage}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface AdminSectionTestOverviewProps {
  book: BookCatalogEntry;
  test: TestCatalogEntry;
  testTitle: string;
  testStats?: AdminTestStats;
  section: PublishSection;
  backHref: string;
  backLabel: string;
  /** Hide back link when overview is embedded in section catalog tabs. */
  showBackLink?: boolean;
}

export function AdminSectionTestOverview({
  book,
  test,
  testTitle,
  testStats,
  section,
  backHref,
  backLabel,
  showBackLink = true,
}: AdminSectionTestOverviewProps) {
  const sectionCopy =
    section === "listening" ? copy.admin.listening : copy.admin.reading;

  const displayParts = section === "listening" ? listeningParts : readingParts;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge variant="outline">{book.name}</Badge>
            <Badge>{test.label}</Badge>
            {testStats && (
              <Badge variant={testStats.published ? "success" : "secondary"}>
                {testStats.published
                  ? copy.admin.exams.published
                  : copy.admin.exams.unpublished}
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{testTitle}</h1>
          <p className="mt-2 text-muted-foreground">{sectionCopy.subtitle}</p>
          {testStats?.publishedAt && (
            <p className="mt-1 text-sm text-muted-foreground">
              {copy.admin.exams.publishedAt(testStats.publishedAt)}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {showBackLink ? (
            <Button asChild variant="outline">
              <Link href={backHref}>{backLabel}</Link>
            </Button>
          ) : null}
          {section === "reading" ? (
            <ExportPassageTranslationsGroup
              bookId={book.id}
              testId={test.id}
            />
          ) : null}
        </div>
      </div>

      <PartSection book={book} test={test} parts={displayParts} section={section} />
    </div>
  );
}
