import { CardDescription } from "@/components/ui/card";
import type { StudyCatalogItem } from "@/lib/catalog/study-section-items";
import { copy } from "@/lib/copy/vi";

function showsQuestionCountSubtitle(item: StudyCatalogItem): boolean {
  return (
    item.kind === "listeningGroup" ||
    item.kind === "readingPassageSet" ||
    (item.kind === "part" && item.part === 5)
  );
}

export function CatalogItemSubtitle({ item }: { item: StudyCatalogItem }) {
  if (showsQuestionCountSubtitle(item)) {
    return (
      <CardDescription className="mt-1">
        {copy.study.catalogQuestionCount(item.questionCount)}
      </CardDescription>
    );
  }

  if (item.kind === "readingPassageSet" && item.part === 7 && item.snippet) {
    return (
      <CardDescription className="mt-1 line-clamp-2">{item.snippet}</CardDescription>
    );
  }

  if (item.kind === "part") {
    return (
      <CardDescription className="mt-1 line-clamp-2">{item.description}</CardDescription>
    );
  }

  if (item.kind === "readingPassageSet" && item.snippet) {
    return (
      <CardDescription className="mt-1 line-clamp-2">{item.snippet}</CardDescription>
    );
  }

  return null;
}

export function catalogItemShowsSubtitle(item: StudyCatalogItem): boolean {
  return showsQuestionCountSubtitle(item);
}
