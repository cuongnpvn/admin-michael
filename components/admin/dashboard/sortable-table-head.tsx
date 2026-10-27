"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { copy } from "@/lib/copy/vi";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type TableSortDir = "asc" | "desc";
export type TableSortState<K extends string> = { key: K; dir: TableSortDir };

export function SortableTableHead<K extends string>({
  label,
  sortKey,
  sort,
  onToggle,
}: {
  label: string;
  sortKey: K;
  sort: TableSortState<K> | null;
  onToggle: (key: K) => void;
}) {
  const isActive = sort?.key === sortKey;
  const nextDir: TableSortDir =
    isActive && sort.dir === "desc" ? "asc" : "desc";
  const Icon = !isActive
    ? ArrowUpDown
    : sort.dir === "desc"
      ? ArrowDown
      : ArrowUp;

  return (
    <TableHead
      aria-sort={
        isActive ? (sort.dir === "asc" ? "ascending" : "descending") : "none"
      }
    >
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[8px] uppercase tracking-wide",
          "hover:text-foreground focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-ring focus-visible:ring-offset-2",
          isActive ? "text-foreground" : "text-muted-foreground",
        )}
        aria-label={copy.admin.overview.examAttempts.sortBy(label, nextDir)}
        onClick={() => onToggle(sortKey)}
      >
        {label}
        <Icon
          className={cn(
            "size-3.5 shrink-0",
            isActive ? "opacity-100" : "opacity-60",
          )}
          aria-hidden
        />
      </button>
    </TableHead>
  );
}
