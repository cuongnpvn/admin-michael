import { AdminNotificationsWorkspace } from "@/components/admin/notifications/admin-notifications-workspace";
import { fetchNotificationCampaigns } from "@/lib/admin/notifications/fetch-campaigns";
import { copy } from "@/lib/copy/vi";

export default async function AdminNotificationsPage() {
  const campaigns = await fetchNotificationCampaigns();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:px-8 lg:py-10">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">
          {copy.admin.notifications.title}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {copy.admin.notifications.subtitle}
        </p>
      </div>
      <AdminNotificationsWorkspace campaigns={campaigns} />
    </div>
  );
}
