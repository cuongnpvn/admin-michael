import { adminUsersPath } from "@/lib/admin/admin-paths";

export const ADMIN_USERS_PAGE_SIZE = 50;

export const ADMIN_USERS_COLUMN_SORT_KEYS = [
  "user",
  "plan",
  "periodEnd",
] as const;

export type AdminUsersColumnSortKey =
  (typeof ADMIN_USERS_COLUMN_SORT_KEYS)[number];

export type AdminUsersSortKey = AdminUsersColumnSortKey | "created_at";
export type AdminUsersSortDir = "asc" | "desc";
export type AdminUsersPlanFilter = "all" | "free" | "pro";

export type AdminUsersQuery = {
  page: number;
  pageSize: number;
  sort: AdminUsersSortKey;
  dir: AdminUsersSortDir;
  plan: AdminUsersPlanFilter;
  q: string;
};

export type AdminUsersSearchParams = {
  page?: string;
  sort?: string;
  dir?: string;
  plan?: string;
  q?: string;
};

const COLUMN_SORT_SET = new Set<string>(ADMIN_USERS_COLUMN_SORT_KEYS);

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
}

export function parseAdminUsersQuery(
  params: AdminUsersSearchParams,
): AdminUsersQuery {
  const sortParam = params.sort?.trim() ?? "";
  const sort: AdminUsersSortKey = COLUMN_SORT_SET.has(sortParam)
    ? (sortParam as AdminUsersColumnSortKey)
    : "created_at";

  return {
    page: parsePositiveInt(params.page, 1),
    pageSize: ADMIN_USERS_PAGE_SIZE,
    sort,
    dir: params.dir === "asc" ? "asc" : "desc",
    plan:
      params.plan === "free" || params.plan === "pro" ? params.plan : "all",
    q: params.q?.trim() ?? "",
  };
}

export function serializeAdminUsersQuery(
  query: AdminUsersQuery,
): URLSearchParams {
  const params = new URLSearchParams();
  if (query.page > 1) params.set("page", String(query.page));
  if (query.sort !== "created_at") params.set("sort", query.sort);
  if (query.dir === "asc") params.set("dir", "asc");
  if (query.plan !== "all") params.set("plan", query.plan);
  if (query.q) params.set("q", query.q);
  return params;
}

export function adminUsersHref(query: AdminUsersQuery): string {
  const params = serializeAdminUsersQuery(query);
  const search = params.toString();
  return search ? `${adminUsersPath()}?${search}` : adminUsersPath();
}

export function nextAdminUsersSort(
  current: AdminUsersQuery,
  key: AdminUsersColumnSortKey,
): Pick<AdminUsersQuery, "sort" | "dir" | "page"> {
  if (current.sort !== key) {
    return { sort: key, dir: "desc", page: 1 };
  }
  return {
    sort: key,
    dir: current.dir === "desc" ? "asc" : "desc",
    page: 1,
  };
}
