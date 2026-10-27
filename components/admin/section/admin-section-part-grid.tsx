import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminPartPath } from "@/lib/admin/admin-paths";
import {
  flattenSectionPartItems,
  type SectionPartMeta,
} from "@/lib/catalog/section-part-items";
import { copy } from "@/lib/copy/vi";
import type { AdminTestStats } from "@/lib/admin/content/stats";
import type { PublishSection } from "@/lib/content/validate-section-counts";
import { cn } from "@/lib/utils";
import type { BookCatalogEntry } from "@/types/test-data";

interface AdminSectionPartGridProps {
  books: BookCatalogEntry[];
  parts: SectionPartMeta[];
  section: PublishSection;
  testStatsMapByBook?: Record<string, Record<string, AdminTestStats>>;
  className?: string;
  emptyMessage?: string;
}

export function AdminSectionPartGrid({
  books,
  parts,
  section,
  testStatsMapByBook,
  className,
  emptyMessage = copy.admin.emptyTable,
}: AdminSectionPartGridProps) {
  const items = flattenSectionPartItems(books, parts);

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {items.map((item) => {
        const testStats = testStatsMapByBook?.[item.bookId]?.[item.testId];
        const sectionPublished =
          section === "listening"
            ? testStats?.listeningPublished
            : testStats?.readingPublished;

        return (
          <Card
            key={item.key}
            className="transition-calm hover:-translate-y-px hover:shadow-card"
          >
            <CardHeader className="pb-3">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline">{item.bookName}</Badge>
                <Badge variant="secondary">{item.testLabel}</Badge>
                <Badge>
                  {copy.common.part} {item.part.part}
                </Badge>
                {testStats && (
                  <Badge variant={sectionPublished ? "success" : "outline"}>
                    {sectionPublished
                      ? copy.admin.exams.published
                      : copy.admin.exams.unpublished}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-base leading-snug">{item.part.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Button asChild variant="secondary" size="sm" className="w-full">
                <Link
                  href={adminPartPath(
                    item.bookId,
                    item.testId,
                    item.part.part,
                    undefined,
                    section,
                  )}
                >
                  {copy.admin.actions.manage}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
