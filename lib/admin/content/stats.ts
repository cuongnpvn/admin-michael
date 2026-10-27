import type { SupabaseClient } from "@supabase/supabase-js";
import type { ToeicPartDb } from "@/types/content-db";

const PARTS: ToeicPartDb[] = ["1", "2", "3", "4", "5", "6", "7"];

export interface AdminPartStats {
  part: ToeicPartDb;
  draftCount: number;
  targetCount: number;
}

export interface AdminTestStats {
  bookId: string;
  testId: string;
  published: boolean;
  publishedAt: string | null;
  listeningPublished: boolean;
  listeningPublishedAt: string | null;
  readingPublished: boolean;
  readingPublishedAt: string | null;
  examPublished: boolean;
  accessTier: "free" | "pro";
  parts: AdminPartStats[];
}

export function isPartCountComplete(draftCount: number, targetCount: number): boolean {
  return targetCount > 0 && draftCount === targetCount;
}

export async function fetchAdminTestStats(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
): Promise<AdminTestStats | null> {
  const { data: testRow, error: testError } = await supabase
    .from("tests")
    .select(
      "published, published_at, listening_published, listening_published_at, reading_published, reading_published_at, access_tier",
    )
    .eq("book_id", bookId)
    .eq("id", testId)
    .maybeSingle();

  if (testError) throw testError;
  if (!testRow) return null;

  const { data: testParts, error: partsError } = await supabase
    .from("test_parts")
    .select("part, question_count_target")
    .eq("book_id", bookId)
    .eq("test_id", testId);

  if (partsError) throw partsError;

  const targets = new Map(
    (testParts ?? []).map((row) => [row.part as ToeicPartDb, row.question_count_target]),
  );

  const partStats: AdminPartStats[] = [];

  for (const part of PARTS) {
    const { count, error: countError } = await supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("book_id", bookId)
      .eq("test_id", testId)
      .eq("part", part);

    if (countError) throw countError;

    const draftCount = count ?? 0;
    const targetCount = targets.get(part) ?? 0;

    partStats.push({
      part,
      draftCount,
      targetCount,
    });
  }

  const listeningPublished = Boolean(testRow.listening_published);
  const readingPublished = Boolean(testRow.reading_published);
  const published = Boolean(testRow.published);

  return {
    bookId,
    testId,
    published,
    publishedAt: (testRow.published_at as string | null) ?? null,
    listeningPublished,
    listeningPublishedAt: (testRow.listening_published_at as string | null) ?? null,
    readingPublished,
    readingPublishedAt: (testRow.reading_published_at as string | null) ?? null,
    examPublished: published,
    accessTier: testRow.access_tier === "pro" ? "pro" : "free",
    parts: partStats,
  };
}

export async function fetchAdminPartStats(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  part: number,
): Promise<AdminPartStats | null> {
  const stats = await fetchAdminTestStats(supabase, bookId, testId);
  return stats?.parts.find((entry) => entry.part === String(part)) ?? null;
}

export async function fetchAdminTestsStats(
  supabase: SupabaseClient,
  bookId: string,
): Promise<Record<string, AdminTestStats>> {
  const { data: tests, error } = await supabase
    .from("tests")
    .select("id")
    .eq("book_id", bookId);

  if (error) throw error;

  const map: Record<string, AdminTestStats> = {};
  for (const row of tests ?? []) {
    const stats = await fetchAdminTestStats(supabase, bookId, String(row.id));
    if (stats) map[String(row.id)] = stats;
  }
  return map;
}
