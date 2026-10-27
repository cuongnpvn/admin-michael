import type { Enums, Json } from "@/types/database";

export type NotificationCategory = Enums<"notification_category">;
export type NotificationKind = Enums<"notification_kind">;
export type NotificationCampaignStatus = Enums<"notification_campaign_status">;
export type NotificationAudience = Enums<"notification_audience">;

export type CampaignCategory = Extract<
  NotificationCategory,
  "content_release" | "marketing"
>;

export interface NotificationPreferences {
  learningReminder: boolean;
  contentRelease: boolean;
  marketing: boolean;
  timezone: string;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  learningReminder: true,
  contentRelease: true,
  marketing: true,
  timezone: "Asia/Ho_Chi_Minh",
};

export interface UserNotification {
  id: string;
  category: NotificationCategory;
  kind: NotificationKind;
  title: string;
  body: string;
  deepLink: string;
  payload: Record<string, unknown>;
  campaignId: string | null;
  dedupeKey: string | null;
  readAt: string | null;
  archivedAt: string | null;
  createdAt: string;
}

export interface NotificationCampaign {
  id: string;
  title: string;
  body: string;
  deepLink: string;
  category: CampaignCategory;
  audience: NotificationAudience;
  status: NotificationCampaignStatus;
  payload: Record<string, unknown>;
  createdBy: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignFormValues {
  title: string;
  body: string;
  deepLink: string;
  category: CampaignCategory;
  audience: NotificationAudience;
  payload?: Record<string, Json | undefined>;
}

export interface NotificationInsertRow {
  user_id: string;
  category: NotificationCategory;
  kind: NotificationKind;
  title: string;
  body: string;
  deep_link?: string;
  payload?: Record<string, unknown>;
  campaign_id?: string | null;
  dedupe_key?: string | null;
}
