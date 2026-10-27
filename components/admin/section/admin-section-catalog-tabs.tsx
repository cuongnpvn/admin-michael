"use client";

import { AdminCatalogItemCard } from "@/components/admin/section/admin-catalog-item-card";
import { SectionCatalogContent } from "@/components/catalog/section-catalog-content";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { StudySectionCatalog } from "@/lib/catalog/study-section-items";
import { copy } from "@/lib/copy/vi";
import type { AdminTestStats } from "@/lib/admin/content/stats";
import type { PublishSection } from "@/lib/content/validate-section-counts";
import { cn } from "@/lib/utils";

interface AdminSectionCatalogTabsProps {
  catalog: StudySectionCatalog;
  section: PublishSection;
  testStatsMapByBook?: Record<string, Record<string, AdminTestStats>>;
  className?: string;
  emptyMessage?: string;
}

function TestPanelHeader({
  section,
  testStats,
}: {
  section: PublishSection;
  testStats?: AdminTestStats;
}) {
  const sectionPublished =
    section === "listening"
      ? testStats?.listeningPublished
      : testStats?.readingPublished;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        {section === "listening"
          ? copy.study.sectionMetaListening
          : copy.study.sectionMetaReading}
      </p>
      {testStats ? (
        <Badge variant={sectionPublished ? "success" : "outline"}>
          {sectionPublished
            ? copy.admin.exams.published
            : copy.admin.exams.unpublished}
        </Badge>
      ) : null}
    </div>
  );
}

export function AdminSectionCatalogTabs({
  catalog,
  section,
  testStatsMapByBook,
  className,
  emptyMessage = copy.admin.emptyTable,
}: AdminSectionCatalogTabsProps) {
  const defaultBook = catalog.books[0]?.id;

  if (catalog.books.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className={cn("space-y-6", className)}>
      <Tabs defaultValue={defaultBook} className="gap-4">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-[16px] p-1.5">
          {catalog.books.map((book) => (
            <TabsTrigger
              key={book.id}
              value={book.id}
              className="shrink-0 px-4 py-2 text-sm"
            >
              {book.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {catalog.books.map((book) => {
          const testStatsMap = testStatsMapByBook?.[book.id];
          const bookDefaultTest = book.tests[0]?.id;

          return (
            <TabsContent key={book.id} value={book.id} className="mt-0">
              <Tabs defaultValue={bookDefaultTest} className="gap-6">
                <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-[14px] bg-muted/60 p-1">
                  {book.tests.map((test) => (
                    <TabsTrigger
                      key={test.id}
                      value={test.id}
                      className="shrink-0 px-3 py-1.5 text-xs sm:text-sm"
                    >
                      {test.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {book.tests.map((test) => {
                  const testStats = testStatsMap?.[test.id];

                  return (
                    <TabsContent key={test.id} value={test.id} className="mt-6">
                      <SectionCatalogContent
                        items={test.items}
                        header={
                          <TestPanelHeader
                            section={section}
                            testStats={testStats}
                          />
                        }
                        renderItem={(item) => (
                          <AdminCatalogItemCard
                            bookId={book.id}
                            testId={test.id}
                            item={item}
                            section={section}
                            className="h-auto"
                          />
                        )}
                      />
                    </TabsContent>
                  );
                })}
              </Tabs>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
