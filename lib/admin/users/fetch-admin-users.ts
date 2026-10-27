import { requireAdminSession } from "@/lib/admin/auth/require-admin";
import type { AdminUsersQuery } from "@/lib/admin/users/admin-users-query";
import type { AdminUserRow } from "@/lib/admin/users/types";
import type { SubscriptionPlan } from "@/lib/entitlements/types";

type AdminListUsersRow = {
  id: string;
  display_name: string | null;
  is_admin: boolean;
  email: string | null;
  plan: SubscriptionPlan;
  subscription_status: "active" | "canceled" | "expired" | "past_due" | null;
  current_period_end: string | null;
  total_count: number | string;
};

export type AdminUsersPage = {
  users: AdminUserRow[];
  total: number;
  page: number;
  pageSize: number;
};

function mapRow(row: AdminListUsersRow): AdminUserRow {
  const email = row.email?.trim() || null;
  return {
    id: row.id,
    displayName: row.display_name?.trim() || email || row.id.slice(0, 8),
    email,
    isAdmin: Boolean(row.is_admin),
    plan: row.plan === "pro" ? "pro" : "free",
    subscriptionStatus: row.subscription_status,
    currentPeriodEnd: row.current_period_end,
  };
}

export async function fetchAdminUsers(
  query: AdminUsersQuery,
): Promise<AdminUsersPage> {
  const { supabase } = await requireAdminSession();
  const offset = (query.page - 1) * query.pageSize;

  const { data, error } = await supabase.rpc("admin_list_users", {
    p_offset: offset,
    p_limit: query.pageSize,
    p_sort: query.sort,
    p_ascending: query.dir === "asc",
    p_plan: query.plan,
    p_query: query.q,
  });

  if (error) throw error;

  const rows = (data ?? []) as AdminListUsersRow[];
  const total = Number(rows[0]?.total_count ?? 0);
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize));

  if (total > 0 && query.page > pageCount) {
    return fetchAdminUsers({ ...query, page: pageCount });
  }

  return {
    users: rows.map(mapRow),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
}
