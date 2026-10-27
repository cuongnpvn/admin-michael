import { StudyPartSectionHeader } from "@/components/study/study-part-section-header";
import {
  groupCatalogItemsByPart,
  type StudyCatalogItem,
} from "@/lib/catalog/study-section-items";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface SectionCatalogContentProps {
  items: StudyCatalogItem[];
  header?: ReactNode;
  renderItem: (item: StudyCatalogItem) => ReactNode;
}

export function SectionCatalogContent({
  items,
  header,
  renderItem,
}: SectionCatalogContentProps) {
  const grouped = groupCatalogItemsByPart(items);
  const part12Groups = grouped.filter(
    ({ part }) => part === 1 || part === 2,
  );
  const remainingGroups = grouped.filter(
    ({ part }) => part !== 1 && part !== 2,
  );

  function renderPartColumn({
    part,
    partTitle,
    items: partItems,
  }: (typeof grouped)[number]) {
    const questionCount = partItems.reduce(
      (sum, item) => sum + item.questionCount,
      0,
    );

    return (
      <div key={part} className="min-w-0 flex-1 space-y-4">
        <StudyPartSectionHeader
          part={part}
          title={partTitle}
          questionCount={questionCount}
        />
        {partItems.map((item) => (
          <div key={item.key} className="h-auto">
            {renderItem(item)}
          </div>
        ))}
      </div>
    );
  }

  function renderPartItems(
    partItems: StudyCatalogItem[],
    layout: "flex" | "grid",
  ) {
    return (
      <div
        className={cn(
          "gap-4",
          layout === "flex"
            ? "flex flex-col md:flex-row"
            : "grid sm:grid-cols-2 xl:grid-cols-3",
        )}
      >
        {partItems.map((item) => (
          <div
            key={item.key}
            className={layout === "flex" ? "min-w-0 flex-1" : undefined}
          >
            {renderItem(item)}
          </div>
        ))}
      </div>
    );
  }

  function renderPartSection({
    part,
    partTitle,
    items: partItems,
  }: (typeof grouped)[number]) {
    const isGroupPart = part === 3 || part === 4 || part === 6 || part === 7;
    const questionCount = partItems.reduce(
      (sum, item) => sum + item.questionCount,
      0,
    );

    return (
      <section key={part} className="space-y-4 pt-2">
        <StudyPartSectionHeader
          part={part}
          title={partTitle}
          questionCount={questionCount}
        />

        {renderPartItems(partItems, isGroupPart ? "grid" : "flex")}
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {header}

      {part12Groups.length > 0 ? (
        <div className="flex flex-col gap-4 md:flex-row">
          {part12Groups.map(renderPartColumn)}
        </div>
      ) : null}

      {remainingGroups.map(renderPartSection)}
    </div>
  );
}
