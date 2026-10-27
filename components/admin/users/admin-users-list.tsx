"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AdminUsersPagination } from "@/components/admin/users/admin-users-pagination";
import { AdminUsersTableHeader } from "@/components/admin/users/admin-users-table-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import {
  setUserSubscriptionPlan,
  upgradeUsersToPro,
} from "@/lib/admin/users/actions";
import {
  adminUsersHref,
  type AdminUsersQuery,
} from "@/lib/admin/users/admin-users-query";
import type { AdminUserRow } from "@/lib/admin/users/types";
import { copy } from "@/lib/copy/vi";

const EMAIL_SEARCH_DEBOUNCE_MS = 400;

interface AdminUsersListProps {
  users: AdminUserRow[];
  total: number;
  page: number;
  pageSize: number;
  query: AdminUsersQuery;
}

function formatPeriodEnd(value: string | null): string {
  if (!value) return copy.admin.users.noExpiry;
  try {
    return new Date(value).toLocaleDateString("vi-VN");
  } catch {
    return value;
  }
}

export function AdminUsersList({
  users,
  total,
  page,
  pageSize,
  query,
}: AdminUsersListProps) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);
  const [emailQuery, setEmailQuery] = useState(query.q);
  const [emailSearchOpen, setEmailSearchOpen] = useState(query.q.length > 0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const emailInputRef = useRef<HTMLInputElement>(null);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const hasFilters = query.plan !== "all" || query.q.length > 0;

  useEffect(() => {
    setEmailQuery(query.q);
    setEmailSearchOpen((open) => open || query.q.length > 0);
  }, [query.q]);

  useEffect(() => {
    if (emailSearchOpen) emailInputRef.current?.focus();
  }, [emailSearchOpen]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [query.page, query.sort, query.dir, query.plan, query.q]);

  useEffect(() => {
    if (emailQuery.trim() === query.q) return;
    const timeout = window.setTimeout(() => {
      router.replace(
        adminUsersHref({ ...query, q: emailQuery.trim(), page: 1 }),
      );
    }, EMAIL_SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timeout);
  }, [emailQuery, query, router]);

  const selectedFreeCount = useMemo(() => {
    let count = 0;
    for (const user of users) {
      if (selectedIds.has(user.id) && user.plan === "free") count += 1;
    }
    return count;
  }, [selectedIds, users]);

  const allPageSelected =
    users.length > 0 && users.every((user) => selectedIds.has(user.id));

  function navigate(next: AdminUsersQuery) {
    router.replace(adminUsersHref(next));
  }

  async function handleSetPlan(userId: string, plan: "free" | "pro") {
    setIsBusy(true);
    try {
      const result = await setUserSubscriptionPlan(userId, plan);
      if (!result.ok) {
        window.alert(result.error);
        return;
      }
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  function toggleRow(userId: string, checked: boolean) {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (checked) next.add(userId);
      else next.delete(userId);
      return next;
    });
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (checked) {
        for (const user of users) next.add(user.id);
      } else {
        for (const user of users) next.delete(user.id);
      }
      return next;
    });
  }

  async function handleUpgradeSelected() {
    const freeIds = users
      .filter((user) => selectedIds.has(user.id) && user.plan === "free")
      .map((user) => user.id);

    if (freeIds.length === 0) {
      window.alert(copy.admin.users.errors.noFreeSelected);
      return;
    }

    setIsBusy(true);
    try {
      const result = await upgradeUsersToPro(freeIds);
      if (!result.ok) {
        window.alert(result.error);
        return;
      }
      setSelectedIds(new Set());
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  if (total === 0 && !hasFilters) {
    return (
      <p className="rounded-[12px] border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
        {copy.admin.emptyTable}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex h-9 items-center justify-end gap-3">
        {selectedIds.size > 1 ? (
          <>
            <span className="text-sm text-muted-foreground">
              {copy.admin.users.selectedCount(selectedIds.size)}
            </span>
            <Button
              type="button"
              size="sm"
              disabled={isBusy || selectedFreeCount === 0}
              onClick={handleUpgradeSelected}
            >
              {copy.admin.users.upPro}
            </Button>
          </>
        ) : null}
      </div>

      <div className="min-w-0 overflow-x-auto rounded-[16px] border border-border">
        <Table className="min-w-max">
          <colgroup>
            <col className="w-12" />
            <col />
            <col className="w-28" />
            <col className="w-32" />
            <col className="w-36" />
          </colgroup>
          <AdminUsersTableHeader
            query={query}
            emailQuery={emailQuery}
            emailSearchOpen={emailSearchOpen}
            emailInputRef={emailInputRef}
            allPageSelected={allPageSelected}
            hasRows={users.length > 0}
            onToggleSelectAll={toggleSelectAll}
            onToggleEmailSearch={() => setEmailSearchOpen((open) => !open)}
            onEmailQueryChange={setEmailQuery}
            onCloseEmailSearch={() => setEmailSearchOpen(false)}
            onQueryChange={navigate}
          />
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  {copy.admin.emptyTable}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(user.id)}
                      onChange={(event) =>
                        toggleRow(user.id, event.target.checked)
                      }
                      className="size-4 rounded border-border"
                      aria-label={copy.admin.users.selectRow}
                    />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="font-medium">{user.displayName}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {user.email ?? user.id}
                    </div>
                    {user.isAdmin ? (
                      <Badge variant="outline" className="mt-2 text-xs">
                        {copy.admin.users.adminBadge}
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.plan === "pro" ? "success" : "secondary"}
                    >
                      {user.plan === "pro"
                        ? copy.admin.users.planPro
                        : copy.admin.users.planFree}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {user.plan === "pro"
                      ? formatPeriodEnd(user.currentPeriodEnd)
                      : "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      {user.plan === "pro" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isBusy || user.isAdmin}
                          onClick={() => handleSetPlan(user.id, "free")}
                        >
                          {copy.admin.users.setFree}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => handleSetPlan(user.id, "pro")}
                        >
                          {copy.admin.users.setPro}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AdminUsersPagination
        page={page}
        pageCount={pageCount}
        onPageChange={(nextPage) =>
          navigate({ ...query, q: emailQuery.trim(), page: nextPage })
        }
      />
    </div>
  );
}
