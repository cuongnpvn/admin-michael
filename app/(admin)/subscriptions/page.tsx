import { AdminSubscriptionsWorkspace } from "@/components/admin/subscriptions/admin-subscriptions-workspace";
import {
  fetchAdminEntitlementBooks,
  fetchUniversalFreeExplanationSlots,
} from "@/lib/admin/subscriptions/fetch-admin-subscriptions";
import { copy } from "@/lib/copy/vi";

export default async function AdminSubscriptionsPage() {
  const [books, freeExplanationSlots] = await Promise.all([
    fetchAdminEntitlementBooks(),
    fetchUniversalFreeExplanationSlots(),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:px-8 lg:py-10">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">
          {copy.admin.subscriptions.title}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {copy.admin.subscriptions.subtitle}
        </p>
      </div>
      <AdminSubscriptionsWorkspace
        books={books}
        freeExplanationSlots={freeExplanationSlots}
      />
    </div>
  );
}
