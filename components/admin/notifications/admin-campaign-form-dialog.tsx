"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createNotificationCampaign,
  updateNotificationCampaign,
} from "@/lib/admin/notifications/actions";
import { copy } from "@/lib/copy/vi";
import type {
  CampaignFormValues,
  NotificationAudience,
  NotificationCampaign,
  CampaignCategory,
} from "@/lib/notifications/types";

function toFormValues(campaign?: NotificationCampaign | null): CampaignFormValues {
  return {
    title: campaign?.title ?? "",
    body: campaign?.body ?? "",
    deepLink: campaign?.deepLink ?? "",
    category: campaign?.category ?? "content_release",
    audience: campaign?.audience ?? "all",
  };
}

export function AdminCampaignFormDialog({
  open,
  onOpenChange,
  campaign,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: NotificationCampaign | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState(() => toFormValues(campaign));
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    if (next) {
      setValues(toFormValues(campaign));
      setError(null);
    }
    onOpenChange(next);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = campaign
        ? await updateNotificationCampaign(campaign.id, values)
        : await createNotificationCampaign(values);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {campaign
              ? copy.admin.notifications.editCampaign
              : copy.admin.notifications.newCampaign}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaign-title">
              {copy.admin.notifications.fields.title}
            </Label>
            <Input
              id="campaign-title"
              value={values.title}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="campaign-body">
              {copy.admin.notifications.fields.body}
            </Label>
            <textarea
              id="campaign-body"
              value={values.body}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  body: event.target.value,
                }))
              }
              rows={4}
              className="flex w-full rounded-[12px] border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="campaign-link">
              {copy.admin.notifications.fields.deepLink}
            </Label>
            <Input
              id="campaign-link"
              value={values.deepLink}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  deepLink: event.target.value,
                }))
              }
              placeholder="/exam"
            />
            <p className="text-xs text-muted-foreground">
              {copy.admin.notifications.fields.deepLinkHint}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{copy.admin.notifications.fields.category}</Label>
              <Select
                value={values.category}
                onValueChange={(value) =>
                  setValues((current) => ({
                    ...current,
                    category: value as CampaignCategory,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="content_release">
                    {copy.admin.notifications.categories.content_release}
                  </SelectItem>
                  <SelectItem value="marketing">
                    {copy.admin.notifications.categories.marketing}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{copy.admin.notifications.fields.audience}</Label>
              <Select
                value={values.audience}
                onValueChange={(value) =>
                  setValues((current) => ({
                    ...current,
                    audience: value as NotificationAudience,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.keys(copy.admin.notifications.audiences) as Array<
                      keyof typeof copy.admin.notifications.audiences
                    >
                  ).map((key) => (
                    <SelectItem key={key} value={key}>
                      {copy.admin.notifications.audiences[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {copy.admin.notifications.saveDraft}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
