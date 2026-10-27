import { requireAdminSession } from "@/lib/admin/auth/require-admin";
import type { NotificationCampaign } from "@/lib/notifications/types";

interface CampaignDbRow {
  id: string;
  title: string;
  body: string;
  deep_link: string;
  category: NotificationCampaign["category"];
  audience: NotificationCampaign["audience"];
  status: NotificationCampaign["status"];
  payload: Record<string, unknown>;
  created_by: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export function mapCampaignRow(row: CampaignDbRow): NotificationCampaign {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    deepLink: row.deep_link ?? "",
    category: row.category,
    audience: row.audience,
    status: row.status,
    payload: row.payload ?? {},
    createdBy: row.created_by,
    sentAt: row.sent_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchNotificationCampaigns(): Promise<
  NotificationCampaign[]
> {
  const { supabase } = await requireAdminSession();
  const { data, error } = await supabase
    .from("notification_campaigns")
    .select(
      "id, title, body, deep_link, category, audience, status, payload, created_by, sent_at, created_at, updated_at",
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as CampaignDbRow[]).map(mapCampaignRow);
}
