"use server";

import { requireAdminSession } from "@/lib/admin/auth/require-admin";
import { loadCatalog } from "@/lib/content/load-catalog";
import {
  buildCatalogDisplayLookup,
  catalogDisplayKey,
} from "@/lib/content/resolve-catalog-display";
import {
  EXAM_LIVE_STALE_MS,
  isExamLiveSection,
  isExamLiveSessionFresh,
  type ExamLiveSection,
} from "@/lib/exam/exam-live-session";

export type LiveExamSessionRow = {
  userId: string;
  displayName: string;
  bookId: string;
  testId: string;
  bookName: string;
  testLabel: string;
  section: ExamLiveSection;
  startedAt: string;
  lastSeenAt: string;
};

type LiveSessionDbRow = {
  user_id: string;
  book_id: string;
  test_id: string;
  section: string;
  started_at: string;
  last_seen_at: string;
};

function displayNameForUser(
  userId: string,
  namesByUserId: Map<string, string>,
): string {
  const name = namesByUserId.get(userId)?.trim();
  return name || userId.slice(0, 8);
}

export async function fetchLiveExamSessions(): Promise<LiveExamSessionRow[]> {
  const { supabase } = await requireAdminSession();
  const staleCutoff = new Date(Date.now() - EXAM_LIVE_STALE_MS).toISOString();

  const [sessionsResult, catalog] = await Promise.all([
    supabase
      .from("exam_live_sessions")
      .select("user_id, book_id, test_id, section, started_at, last_seen_at")
      .gt("last_seen_at", staleCutoff)
      .order("started_at", { ascending: true }),
    loadCatalog(supabase),
  ]);

  if (sessionsResult.error) throw sessionsResult.error;

  const rows = (sessionsResult.data ?? []) as LiveSessionDbRow[];
  if (rows.length === 0) return [];

  const displayLookup = buildCatalogDisplayLookup(catalog);
  const userIds = [...new Set(rows.map((row) => row.user_id))];
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", userIds);

  if (profilesError) throw profilesError;

  const namesByUserId = new Map<string, string>();
  for (const profile of profiles ?? []) {
    namesByUserId.set(
      profile.id as string,
      (profile.display_name as string | null) ?? "",
    );
  }

  return rows.flatMap((row) => {
    if (!isExamLiveSection(row.section)) return [];
    if (!isExamLiveSessionFresh(row.last_seen_at)) return [];

    const display = displayLookup.get(catalogDisplayKey(row.book_id, row.test_id));
    return [
      {
        userId: row.user_id,
        displayName: displayNameForUser(row.user_id, namesByUserId),
        bookId: row.book_id,
        testId: row.test_id,
        bookName: display?.bookName ?? row.book_id,
        testLabel: display?.testLabel ?? row.test_id,
        section: row.section,
        startedAt: row.started_at,
        lastSeenAt: row.last_seen_at,
      },
    ];
  });
}
