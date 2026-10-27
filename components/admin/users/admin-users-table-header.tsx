"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import type { ReactNode, RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  nextAdminUsersSort,
  type AdminUsersColumnSortKey,
  type AdminUsersPlanFilter,
  type AdminUsersQuery,
} from "@/lib/admin/users/admin-users-query";
import { copy } from "@/lib/copy/vi";
import { cn } from "@/lib/utils";

function sortState(query: AdminUsersQuery, key: AdminUsersColumnSortKey) {
  if (query.sort !== key) return "none" as const;
  return query.dir === "asc" ? "ascending" : "descending";
}

function HeaderIconButton({
  active,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  label: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "size-7 rounded-[8px]",
        active && "bg-muted text-foreground",
      )}
    >
      {children}
    </Button>
  );
}

function SortButton({
  columnKey,
  label,
  query,
  onSort,
}: {
  columnKey: AdminUsersColumnSortKey;
  label: string;
  query: AdminUsersQuery;
  onSort: (key: AdminUsersColumnSortKey) => void;
}) {
  const isActive = query.sort === columnKey;
  const nextDir = isActive && query.dir === "desc" ? "asc" : "desc";
  const Icon = !isActive
    ? ArrowUpDown
    : query.dir === "desc"
      ? ArrowDown
      : ArrowUp;

  return (
    <HeaderIconButton
      active={isActive}
      label={copy.admin.users.sortBy(label, nextDir)}
      onClick={() => onSort(columnKey)}
    >
      <Icon className="size-3.5" />
    </HeaderIconButton>
  );
}

export function AdminUsersTableHeader({
  query,
  emailQuery,
  emailSearchOpen,
  emailInputRef,
  allPageSelected,
  hasRows,
  onToggleSelectAll,
  onToggleEmailSearch,
  onEmailQueryChange,
  onCloseEmailSearch,
  onQueryChange,
}: {
  query: AdminUsersQuery;
  emailQuery: string;
  emailSearchOpen: boolean;
  emailInputRef: RefObject<HTMLInputElement | null>;
  allPageSelected: boolean;
  hasRows: boolean;
  onToggleSelectAll: (checked: boolean) => void;
  onToggleEmailSearch: () => void;
  onEmailQueryChange: (value: string) => void;
  onCloseEmailSearch: () => void;
  onQueryChange: (query: AdminUsersQuery) => void;
}) {
  function handleSort(key: AdminUsersColumnSortKey) {
    onQueryChange({
      ...query,
      q: emailQuery.trim(),
      ...nextAdminUsersSort(query, key),
    });
  }

  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-12">
          <input
            type="checkbox"
            checked={allPageSelected}
            onChange={(event) => onToggleSelectAll(event.target.checked)}
            className="size-4 rounded border-border"
            aria-label={copy.admin.users.selectAll}
            disabled={!hasRows}
          />
        </TableHead>
        <TableHead aria-sort={sortState(query, "user")}>
          <div className="space-y-2 py-1">
            <div className="flex items-center gap-1">
              <span>{copy.admin.users.columns.user}</span>
              <HeaderIconButton
                active={emailSearchOpen || emailQuery.trim().length > 0}
                label={copy.admin.users.searchEmail}
                onClick={onToggleEmailSearch}
              >
                <Search className="size-3.5" />
              </HeaderIconButton>
              <SortButton
                columnKey="user"
                label={copy.admin.users.columns.user}
                query={query}
                onSort={handleSort}
              />
            </div>
            {emailSearchOpen ? (
              <Input
                ref={emailInputRef}
                value={emailQuery}
                onChange={(event) => onEmailQueryChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") onCloseEmailSearch();
                }}
                placeholder={copy.admin.users.searchEmail}
                className="h-8 w-full max-w-sm font-normal"
                aria-label={copy.admin.users.searchEmail}
              />
            ) : null}
          </div>
        </TableHead>
        <TableHead className="w-28" aria-sort={sortState(query, "plan")}>
          <div className="flex items-center gap-1 py-1">
            <span>{copy.admin.users.columns.plan}</span>
            <Select
              value={query.plan}
              onValueChange={(value) =>
                onQueryChange({
                  ...query,
                  q: emailQuery.trim(),
                  plan: value as AdminUsersPlanFilter,
                  page: 1,
                })
              }
            >
              <SelectTrigger
                aria-label={copy.admin.users.columns.plan}
                className={cn(
                  "size-7 shrink-0 justify-center gap-0 rounded-[8px] border-0 bg-transparent p-0 shadow-none",
                  "hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                  "[&>span]:sr-only [&>svg]:size-3.5 [&>svg]:opacity-100",
                  query.plan !== "all" && "bg-muted text-foreground",
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="all">{copy.admin.users.filterAll}</SelectItem>
                <SelectItem value="free">{copy.admin.users.planFree}</SelectItem>
                <SelectItem value="pro">{copy.admin.users.planPro}</SelectItem>
              </SelectContent>
            </Select>
            <SortButton
              columnKey="plan"
              label={copy.admin.users.columns.plan}
              query={query}
              onSort={handleSort}
            />
          </div>
        </TableHead>
        <TableHead className="w-32" aria-sort={sortState(query, "periodEnd")}>
          <div className="flex items-center gap-1 py-1">
            <span>{copy.admin.users.columns.periodEnd}</span>
            <SortButton
              columnKey="periodEnd"
              label={copy.admin.users.columns.periodEnd}
              query={query}
              onSort={handleSort}
            />
          </div>
        </TableHead>
        <TableHead className="w-36 text-right">
          {copy.admin.users.columns.actions}
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
