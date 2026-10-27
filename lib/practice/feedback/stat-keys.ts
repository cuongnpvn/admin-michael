import type { StudyCatalogItem } from "@/lib/catalog/study-section-items";
import type { PracticeFeedbackScope } from "@/lib/practice/feedback/types";

export function partDifficultyStatKey(part: number): string {
  return `part:${part}`;
}

export function groupDifficultyStatKey(groupId: string): string {
  return `group:${groupId}`;
}

export function passageSetDifficultyStatKey(setId: string): string {
  return `set:${setId}`;
}

export function catalogItemDifficultyStatKey(item: StudyCatalogItem): string {
  if (item.kind === "part") {
    return partDifficultyStatKey(item.part);
  }

  if (item.kind === "listeningGroup") {
    return groupDifficultyStatKey(item.groupId);
  }

  return passageSetDifficultyStatKey(item.setId);
}

export function feedbackScopeStatKey(scope: PracticeFeedbackScope): string {
  if (scope.listeningGroupId) {
    return groupDifficultyStatKey(scope.listeningGroupId);
  }

  if (scope.readingPassageSetId) {
    return passageSetDifficultyStatKey(scope.readingPassageSetId);
  }

  return partDifficultyStatKey(scope.part);
}

export function rowToDifficultyStatKey(row: {
  part: string;
  listening_group_id: string | null;
  reading_passage_set_id: string | null;
}): string {
  if (row.listening_group_id) {
    return groupDifficultyStatKey(row.listening_group_id);
  }

  if (row.reading_passage_set_id) {
    return passageSetDifficultyStatKey(row.reading_passage_set_id);
  }

  return partDifficultyStatKey(Number.parseInt(row.part, 10));
}
