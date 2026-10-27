import { copy } from "@/lib/copy/vi";
import { listeningParts, readingParts } from "@/lib/mock";
import type {
  ListeningFormat,
  ListeningPartData,
  ListeningStimulusKind,
  ReadingPartData,
} from "@/types/test-data";
import type { PublishSection } from "@/lib/content/validate-section-counts";

export interface StudyCatalogPartItem {
  kind: "part";
  key: string;
  part: number;
  title: string;
  description: string;
  questionCount: number;
  estimatedMinutes: number;
  /** Aggregated question tags for reading Part 5 cards. */
  tags?: string[];
}

export interface StudyCatalogListeningGroupItem {
  kind: "listeningGroup";
  key: string;
  part: 3 | 4;
  groupId: string;
  title: string;
  format: ListeningFormat;
  stimulusKind: ListeningStimulusKind;
  questionIds: string[];
  from: number;
  to: number;
  questionCount: number;
  tags: string[];
}

export interface StudyCatalogReadingPassageSetItem {
  kind: "readingPassageSet";
  key: string;
  part: 6 | 7;
  setId: string;
  title: string;
  snippet: string;
  questionIds: string[];
  from: number;
  to: number;
  questionCount: number;
  layout: "single" | "double" | "triple";
  tags: string[];
}

export type StudyCatalogItem =
  | StudyCatalogPartItem
  | StudyCatalogListeningGroupItem
  | StudyCatalogReadingPassageSetItem;

export interface StudyCatalogTestEntry {
  id: string;
  label: string;
  available: boolean;
  items: StudyCatalogItem[];
}

export interface StudyCatalogBookEntry {
  id: string;
  name: string;
  tests: StudyCatalogTestEntry[];
}

export interface StudySectionCatalog {
  books: StudyCatalogBookEntry[];
}

function truncateSnippet(text: string, maxLength = 120): string {
  const snippet = text.replace(/\s+/g, " ").trim();
  if (snippet.length <= maxLength) return snippet;
  return `${snippet.slice(0, maxLength).trim()}…`;
}

function partMetaFor(section: PublishSection, part: number) {
  const parts = section === "listening" ? listeningParts : readingParts;
  return parts.find((entry) => entry.part === part);
}

function buildPartItem(part: number, section: PublishSection): StudyCatalogPartItem | null {
  const meta = partMetaFor(section, part);
  if (!meta) return null;

  return {
    kind: "part",
    key: `part-${part}`,
    part: meta.part,
    title: meta.title,
    description: meta.description,
    questionCount: meta.questionCount,
    estimatedMinutes: meta.estimatedMinutes,
  };
}

function unionQuestionTags(questions: Array<{ tags?: string[] }>): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const question of questions) {
    for (const tag of question.tags ?? []) {
      if (seen.has(tag)) continue;
      seen.add(tag);
      tags.push(tag);
    }
  }

  return tags;
}

function buildListeningGroupItems(partData: ListeningPartData): StudyCatalogListeningGroupItem[] {
  if (partData.part !== 3 && partData.part !== 4) return [];

  return partData.groups.map((group) => {
    const sorted = [...group.questions].sort(
      (a, b) => a.globalItemNumber - b.globalItemNumber,
    );
    const from = sorted[0]?.globalItemNumber ?? 0;
    const to = sorted[sorted.length - 1]?.globalItemNumber ?? from;

    return {
      kind: "listeningGroup",
      key: `group-${group.id}`,
      part: partData.part,
      groupId: group.id,
      title:
        group.topic?.trim() ||
        copy.session.questionRange(from, to),
      format: group.format ?? (partData.part === 3 ? "dialogue" : "monologue"),
      stimulusKind: group.stimulusKind ?? "other",
      questionIds: sorted.map((question) => question.id),
      from,
      to,
      questionCount: sorted.length,
      tags: unionQuestionTags(sorted),
    };
  });
}

function buildReadingPassageSetItems(
  partData: ReadingPartData,
): StudyCatalogReadingPassageSetItem[] {
  if (partData.part !== 6 && partData.part !== 7) return [];

  return partData.passageSets.map((set) => {
    const sorted = [...set.questions].sort(
      (a, b) => a.globalItemNumber - b.globalItemNumber,
    );
    const from = sorted[0]?.globalItemNumber ?? 0;
    const to = sorted[sorted.length - 1]?.globalItemNumber ?? from;
    const primaryPassage = set.passages[0];

    return {
      kind: "readingPassageSet",
      key: `set-${set.id}`,
      part: partData.part,
      setId: set.id,
      title: set.topic?.trim() || primaryPassage?.title?.trim() || set.id,
      snippet: truncateSnippet(primaryPassage?.content ?? ""),
      questionIds: sorted.map((question) => question.id),
      from,
      to,
      questionCount: sorted.length,
      layout: set.layout,
      tags: unionQuestionTags(sorted),
    };
  });
}

export function buildListeningCatalogItems(
  parts: Partial<Record<1 | 2 | 3 | 4, ListeningPartData>>,
): StudyCatalogItem[] {
  const items: StudyCatalogItem[] = [];

  for (const part of [1, 2] as const) {
    const partItem = buildPartItem(part, "listening");
    if (partItem) items.push(partItem);
  }

  for (const part of [3, 4] as const) {
    const partData = parts[part];
    if (partData) {
      items.push(...buildListeningGroupItems(partData));
    }
  }

  return items;
}

export function buildReadingCatalogItems(
  parts: Partial<Record<5 | 6 | 7, ReadingPartData>>,
): StudyCatalogItem[] {
  const items: StudyCatalogItem[] = [];

  const part5Data = parts[5];
  const part5 = buildPartItem(5, "reading");
  if (part5) {
    items.push({
      ...part5,
      tags:
        part5Data?.part === 5
          ? unionQuestionTags(part5Data.items.map((item) => item.question))
          : undefined,
    });
  }

  for (const part of [6, 7] as const) {
    const partData = parts[part];
    if (partData) {
      items.push(...buildReadingPassageSetItems(partData));
    }
  }

  return items;
}

export function getCatalogItemPart(item: StudyCatalogItem): number {
  return item.part;
}

export function getCatalogItemQuestionCount(item: StudyCatalogItem): number {
  return item.questionCount;
}

export function getCatalogItemTitle(item: StudyCatalogItem): string {
  return item.title;
}

export function groupCatalogItemsByPart(
  items: StudyCatalogItem[],
): { part: number; partTitle: string; items: StudyCatalogItem[] }[] {
  const partMetas = [...listeningParts, ...readingParts];
  const grouped = new Map<number, StudyCatalogItem[]>();

  for (const item of items) {
    const list = grouped.get(item.part) ?? [];
    list.push(item);
    grouped.set(item.part, list);
  }

  return partMetas
    .filter((meta) => grouped.has(meta.part))
    .map((meta) => ({
      part: meta.part,
      partTitle: meta.title,
      items: grouped.get(meta.part) ?? [],
    }));
}

export function buildStudySessionHref(
  sessionPath: "/listening/session" | "/reading/session",
  bookId: string,
  testId: string,
  item: StudyCatalogItem,
  mode?: "exam" | "practice",
): string {
  const params = new URLSearchParams({
    book: bookId,
    test: testId,
    part: String(item.part),
  });

  if (item.kind === "listeningGroup") {
    params.set("group", item.groupId);
  } else if (item.kind === "readingPassageSet") {
    params.set("set", item.setId);
  }

  if (mode) {
    params.set("mode", mode);
  }

  return `${sessionPath}?${params.toString()}`;
}
