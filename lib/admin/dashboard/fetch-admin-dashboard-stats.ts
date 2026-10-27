import {
  buildRegistrationDayBuckets,
  REGISTRATION_CHART_DAYS,
  shiftDateKey,
  todayRegistrationCount,
  vietnamDayStartIso,
  type RegistrationDay,
} from "@/lib/admin/dashboard/aggregate-registration-days";
import { getTodayDateKey } from "@/lib/learning/daily-goals/date-key";
import { createClient } from "@/lib/supabase/server";

export type { RegistrationDay };

export type AdminDashboardTodayUser = {
  userId: string;
  displayName: string;
  createdAt: string;
};

export type AdminDashboardTodayPro = {
  subscriptionId: string;
  userId: string;
  displayName: string;
  createdAt: string;
  currentPeriodEnd: string | null;
};

export type AdminDashboardStats = {
  totalUsers: number;
  newUsersToday: number;
  newUsersTodayList: AdminDashboardTodayUser[];
  activeProCount: number;
  newProToday: number;
  newProTodayList: AdminDashboardTodayPro[];
  publishedTests: number;
  registrationsByDay: RegistrationDay[];
};

type ProfileCreatedRow = {
  id: string;
  display_name: string | null;
  created_at: string;
};

type ProCreatedRow = {
  id: string;
  user_id: string;
  created_at: string;
  current_period_end: string | null;
};

const PAGE_SIZE = 1000;

function displayNameForUser(
  userId: string,
  displayName: string | null | undefined,
): string {
  const name = displayName?.trim();
  return name || userId.slice(0, 8);
}

async function countRows(
  query: PromiseLike<{ count: number | null; error: { message: string } | null }>,
): Promise<number> {
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

async function fetchAllPages<T>(
  fetchPage: (
    from: number,
    to: number,
  ) => PromiseLike<{
    data: unknown;
    error: { message: string } | null;
  }>,
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const page = (data ?? []) as T[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return rows;
}

export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
  const supabase = await createClient();
  const todayKey = getTodayDateKey();
  const todayStart = vietnamDayStartIso(todayKey);
  const chartStart = vietnamDayStartIso(
    shiftDateKey(todayKey, -(REGISTRATION_CHART_DAYS - 1)),
  );
  const nowIso = new Date().toISOString();

  const [
    totalUsers,
    activeProNullEnd,
    activeProFutureEnd,
    newUsersTodayRows,
    newProRows,
    publishedTests,
    registrationRows,
  ] = await Promise.all([
    countRows(
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ),
    countRows(
      supabase
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("plan", "pro")
        .eq("status", "active")
        .is("current_period_end", null),
    ),
    countRows(
      supabase
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("plan", "pro")
        .eq("status", "active")
        .gt("current_period_end", nowIso),
    ),
    fetchAllPages<ProfileCreatedRow>((from, to) =>
      supabase
        .from("profiles")
        .select("id, display_name, created_at")
        .gte("created_at", todayStart)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to),
    ),
    fetchAllPages<ProCreatedRow>((from, to) =>
      supabase
        .from("subscriptions")
        .select("id, user_id, created_at, current_period_end")
        .eq("plan", "pro")
        .gte("created_at", todayStart)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to),
    ),
    countRows(
      supabase
        .from("tests")
        .select("id", { count: "exact", head: true })
        .eq("published", true),
    ),
    fetchAllPages<{ created_at: string }>((from, to) =>
      supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", chartStart)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .range(from, to),
    ),
  ]);

  const newUsersTodayList: AdminDashboardTodayUser[] = newUsersTodayRows.map(
    (row) => ({
      userId: row.id,
      displayName: displayNameForUser(row.id, row.display_name),
      createdAt: row.created_at,
    }),
  );

  const buckets = buildRegistrationDayBuckets(
    registrationRows.map((row) => row.created_at),
    REGISTRATION_CHART_DAYS,
    todayKey,
  );

  const proUserIds = [...new Set(newProRows.map((row) => row.user_id))];
  const namesByUserId = new Map<string, string>();

  if (proUserIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", proUserIds);

    if (profilesError) throw profilesError;

    for (const profile of profiles ?? []) {
      namesByUserId.set(
        profile.id as string,
        (profile.display_name as string | null) ?? "",
      );
    }
  }

  const newProTodayList: AdminDashboardTodayPro[] = newProRows.map((row) => ({
    subscriptionId: row.id,
    userId: row.user_id,
    displayName: displayNameForUser(
      row.user_id,
      namesByUserId.get(row.user_id),
    ),
    createdAt: row.created_at,
    currentPeriodEnd: row.current_period_end,
  }));

  return {
    totalUsers,
    newUsersToday: todayRegistrationCount(buckets),
    newUsersTodayList,
    activeProCount: activeProNullEnd + activeProFutureEnd,
    newProToday: newProTodayList.length,
    newProTodayList,
    publishedTests,
    registrationsByDay: buckets,
  };
}
