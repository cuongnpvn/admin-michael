import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy/vi";

export function AdminUsersPagination({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-end gap-3">
      <span className="text-sm text-muted-foreground">
        {copy.admin.users.pageOf(page, pageCount)}
      </span>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label={copy.admin.users.previousPage}
        >
          <ChevronLeft className="size-4" />
          {copy.admin.users.previousPage}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          aria-label={copy.admin.users.nextPage}
        >
          {copy.admin.users.nextPage}
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
