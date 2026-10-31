import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminDictationGroup } from "@/lib/admin/dictation/load-admin-dictation";
import { copy } from "@/lib/copy/vi";

function partLabel(itemType: string | null): string {
  if (!itemType) return "—";
  const labels = copy.dictation.partLabel;
  if (itemType in labels) {
    return labels[itemType as keyof typeof labels];
  }
  return itemType;
}

export function AdminDictationTable({
  groups,
}: {
  groups: AdminDictationGroup[];
}) {
  const labels = copy.admin.dictationManage;

  if (groups.length === 0) {
    return (
      <p className="rounded-[12px] border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
        {labels.empty}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.key} className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-medium">{group.heading}</h2>
            <p className="text-sm text-muted-foreground">
              {labels.groupCount(group.rows.length)}
            </p>
          </div>
          <div className="overflow-x-auto rounded-[16px] border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{labels.columns.audio}</TableHead>
                  <TableHead>{labels.columns.title}</TableHead>
                  <TableHead>{labels.columns.topic}</TableHead>
                  <TableHead>{labels.columns.part}</TableHead>
                  <TableHead>{labels.columns.level}</TableHead>
                  <TableHead>{labels.columns.status}</TableHead>
                  <TableHead className="text-right">
                    {labels.columns.segments}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="max-w-[14rem] font-mono text-xs text-muted-foreground">
                      <span className="break-all">{row.audioPath || "—"}</span>
                    </TableCell>
                    <TableCell className="max-w-xs font-medium">
                      {row.title}
                    </TableCell>
                    <TableCell>{row.topic}</TableCell>
                    <TableCell>{partLabel(row.itemType)}</TableCell>
                    <TableCell>{row.levelLabel}</TableCell>
                    <TableCell>
                      <Badge variant={row.published ? "default" : "secondary"}>
                        {row.published ? labels.published : labels.draft}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {row.segmentCount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      ))}
    </div>
  );
}
