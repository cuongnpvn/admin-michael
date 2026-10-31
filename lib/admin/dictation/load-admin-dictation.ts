import { createClient } from "@/lib/supabase/server";
import { copy } from "@/lib/copy/vi";

const PAGE_SIZE = 1000;
const AUDIO_ITEM_PATH = /^([^/]+)\/([^/]+)\/(\d+)(?:-(\d+))?\.mp3$/;

export interface AdminDictationRow {
  id: string;
  title: string;
  topic: string;
  levelLabel: string;
  published: boolean;
  itemType: string | null;
  audioPath: string;
  segmentCount: number;
}

export interface AdminDictationGroup {
  key: string;
  bookId: string | null;
  testId: string | null;
  heading: string;
  rows: AdminDictationRow[];
}

interface SetRow {
  id: string;
  title: string;
  topic: string;
  level_label: string;
  published: boolean;
  sort_order: number;
}

interface ItemRow {
  id: string;
  set_id: string;
  item_type: string;
  sort_order: number;
  audio_path: string;
  segments: unknown;
}

interface BookRow {
  id: string;
  name: string;
  sort_order: number;
}

interface TestRow {
  book_id: string;
  id: string;
  label: string;
  sort_order: number;
}

interface AudioLocation {
  bookId: string;
  testId: string;
  sort: number;
}

async function fetchPages<T>(
  loadPage: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await loadPage(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

export function dictationAudioLocation(path: string): AudioLocation | null {
  const match = AUDIO_ITEM_PATH.exec(path.trim());
  const bookId = match?.[1];
  const testId = match?.[2];
  const start = Number(match?.[3]);
  if (!bookId || !testId || !Number.isInteger(start)) return null;
  return { bookId, testId, sort: start };
}

function segmentCount(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function groupHeading(
  bookId: string,
  testId: string,
  bookName: string | undefined,
  testLabel: string | undefined,
): string {
  const book = bookName ?? bookId;
  const test = testLabel ?? testId;
  return `${book} · ${test}`;
}

export async function loadAdminDictation(): Promise<AdminDictationGroup[]> {
  const supabase = await createClient();

  const [sets, items, books, tests] = await Promise.all([
    fetchPages<SetRow>((from, to) =>
      supabase
        .from("dictation_sets")
        .select("id, title, topic, level_label, published, sort_order")
        .order("id", { ascending: true })
        .range(from, to)
        .then((result) => ({
          data: (result.data ?? null) as SetRow[] | null,
          error: result.error,
        })),
    ),
    fetchPages<ItemRow>((from, to) =>
      supabase
        .from("dictation_items")
        .select("id, set_id, item_type, sort_order, audio_path, segments")
        .order("id", { ascending: true })
        .range(from, to)
        .then((result) => ({
          data: (result.data ?? null) as ItemRow[] | null,
          error: result.error,
        })),
    ),
    fetchPages<BookRow>((from, to) =>
      supabase
        .from("books")
        .select("id, name, sort_order")
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true })
        .range(from, to)
        .then((result) => ({
          data: (result.data ?? null) as BookRow[] | null,
          error: result.error,
        })),
    ),
    fetchPages<TestRow>((from, to) =>
      supabase
        .from("tests")
        .select("book_id, id, label, sort_order")
        .order("book_id", { ascending: true })
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true })
        .range(from, to)
        .then((result) => ({
          data: (result.data ?? null) as TestRow[] | null,
          error: result.error,
        })),
    ),
  ]);

  const bookById = new Map(books.map((book) => [book.id, book]));
  const testByKey = new Map(
    tests.map((test) => [`${test.book_id}/${test.id}`, test]),
  );
  const itemsBySet = new Map<string, ItemRow[]>();
  for (const item of items) {
    const list = itemsBySet.get(item.set_id) ?? [];
    list.push(item);
    itemsBySet.set(item.set_id, list);
  }

  const drafts = new Map<
    string,
    {
      bookId: string | null;
      testId: string | null;
      bookSort: number;
      testSort: number;
      heading: string;
      rows: Array<AdminDictationRow & { sort: number }>;
    }
  >();

  function bucket(location: AudioLocation | null) {
    if (!location) {
      const key = "unknown";
      const current = drafts.get(key) ?? {
        bookId: null,
        testId: null,
        bookSort: Number.MAX_SAFE_INTEGER,
        testSort: Number.MAX_SAFE_INTEGER,
        heading: copy.admin.dictationManage.unknownSource,
        rows: [],
      };
      drafts.set(key, current);
      return current;
    }

    const key = `${location.bookId}/${location.testId}`;
    const current = drafts.get(key);
    if (current) return current;

    const book = bookById.get(location.bookId);
    const test = testByKey.get(key);
    const created = {
      bookId: location.bookId,
      testId: location.testId,
      bookSort: book?.sort_order ?? Number.MAX_SAFE_INTEGER - 1,
      testSort: test?.sort_order ?? Number.MAX_SAFE_INTEGER - 1,
      heading: groupHeading(
        location.bookId,
        location.testId,
        book?.name,
        test?.label,
      ),
      rows: [],
    };
    drafts.set(key, created);
    return created;
  }

  for (const set of sets) {
    const setItems = itemsBySet.get(set.id) ?? [];
    if (setItems.length === 0) {
      bucket(null).rows.push({
        id: `set:${set.id}`,
        title: set.title,
        topic: set.topic,
        levelLabel: set.level_label,
        published: set.published,
        itemType: null,
        audioPath: "",
        segmentCount: 0,
        sort: set.sort_order,
      });
      continue;
    }

    for (const item of setItems) {
      const location = dictationAudioLocation(item.audio_path);
      bucket(location).rows.push({
        id: item.id,
        title: set.title,
        topic: set.topic,
        levelLabel: set.level_label,
        published: set.published,
        itemType: item.item_type,
        audioPath: item.audio_path,
        segmentCount: segmentCount(item.segments),
        sort: location?.sort ?? item.sort_order,
      });
    }
  }

  return [...drafts.values()]
    .sort((left, right) => {
      if (left.bookSort !== right.bookSort) return left.bookSort - right.bookSort;
      if (left.testSort !== right.testSort) return left.testSort - right.testSort;
      return left.heading.localeCompare(right.heading);
    })
    .map((group) => ({
      key: group.bookId && group.testId ? `${group.bookId}/${group.testId}` : "unknown",
      bookId: group.bookId,
      testId: group.testId,
      heading: group.heading,
      rows: group.rows
        .sort(
          (left, right) =>
            left.sort - right.sort || left.title.localeCompare(right.title),
        )
        .map((row) => ({
          id: row.id,
          title: row.title,
          topic: row.topic,
          levelLabel: row.levelLabel,
          published: row.published,
          itemType: row.itemType,
          audioPath: row.audioPath,
          segmentCount: row.segmentCount,
        })),
    }));
}
