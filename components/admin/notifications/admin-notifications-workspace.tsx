"use client";

import { Plus, Send, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AdminCampaignFormDialog } from "@/components/admin/notifications/admin-campaign-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  cancelNotificationCampaign,
  runLearningRemindersNow,
  sendNotificationCampaign,
} from "@/lib/admin/notifications/actions";
import { formatNotificationTime } from "@/lib/notifications/format-notification-time";
import type { NotificationCampaign } from "@/lib/notifications/types";
import { copy } from "@/lib/copy/vi";

function statusVariant(
  status: NotificationCampaign["status"],
): "secondary" | "success" | "outline" | "default" {
  if (status === "sent") return "success";
  if (status === "sending") return "default";
  if (status === "cancelled") return "outline";
  return "secondary";
}

export function AdminNotificationsWorkspace({
  campaigns,
}: {
  campaigns: NotificationCampaign[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<NotificationCampaign | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(campaign: NotificationCampaign) {
    if (campaign.status !== "draft") return;
    setEditing(campaign);
    setFormOpen(true);
  }

  function handleSend(campaignId: string) {
    if (!window.confirm(copy.admin.notifications.sendConfirm)) return;
    startTransition(async () => {
      const result = await sendNotificationCampaign(campaignId);
      if (!result.ok) {
        window.alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleCancel(campaignId: string) {
    if (!window.confirm(copy.admin.notifications.cancelConfirm)) return;
    startTransition(async () => {
      const result = await cancelNotificationCampaign(campaignId);
      if (!result.ok) {
        window.alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleRunReminders() {
    if (!window.confirm(copy.admin.notifications.runRemindersConfirm)) return;
    startTransition(async () => {
      const result = await runLearningRemindersNow();
      if (!result.ok) {
        window.alert(result.error);
        return;
      }
      window.alert(result.message ?? "OK");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={handleRunReminders}
        >
          {copy.admin.notifications.runReminders}
        </Button>
        <Button type="button" onClick={openCreate}>
          <Plus className="size-4" />
          {copy.admin.notifications.newCampaign}
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <p className="rounded-[12px] border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
          {copy.admin.notifications.empty}
        </p>
      ) : (
        <div className="overflow-hidden rounded-[16px] border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{copy.admin.notifications.columns.title}</TableHead>
                <TableHead>
                  {copy.admin.notifications.columns.category}
                </TableHead>
                <TableHead>
                  {copy.admin.notifications.columns.audience}
                </TableHead>
                <TableHead>{copy.admin.notifications.columns.status}</TableHead>
                <TableHead>{copy.admin.notifications.columns.sentAt}</TableHead>
                <TableHead className="text-right">
                  {copy.admin.notifications.columns.actions}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="max-w-xs">
                    <button
                      type="button"
                      className="text-left font-medium hover:underline disabled:no-underline"
                      disabled={campaign.status !== "draft"}
                      onClick={() => openEdit(campaign)}
                    >
                      {campaign.title}
                    </button>
                    {campaign.body ? (
                      <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {campaign.body}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {copy.admin.notifications.categories[campaign.category]}
                  </TableCell>
                  <TableCell>
                    {copy.admin.notifications.audiences[campaign.audience]}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(campaign.status)}>
                      {copy.admin.notifications.status[campaign.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {campaign.sentAt
                      ? formatNotificationTime(campaign.sentAt)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {campaign.status === "draft" ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleSend(campaign.id)}
                          >
                            <Send className="size-3.5" />
                            {copy.admin.notifications.sendNow}
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            disabled={isPending}
                            onClick={() => handleCancel(campaign.id)}
                            aria-label={copy.admin.notifications.cancel}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AdminCampaignFormDialog
        key={editing?.id ?? "new"}
        open={formOpen}
        onOpenChange={setFormOpen}
        campaign={editing}
      />
    </div>
  );
}
