import { AdminUsersList } from "@/components/admin/users/admin-users-list";
import { parseAdminUsersQuery } from "@/lib/admin/users/admin-users-query";
import { fetchAdminUsers } from "@/lib/admin/users/fetch-admin-users";
import { copy } from "@/lib/copy/vi";

type UsersSearchParams = {
  page?: string;
  sort?: string;
  dir?: string;
  plan?: string;
  q?: string;
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<UsersSearchParams>;
}) {
  const query = parseAdminUsersQuery(await searchParams);
  const { users, total, page, pageSize } = await fetchAdminUsers(query);

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl px-4 py-8 lg:px-8 lg:py-10">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">
          {copy.admin.users.title}
        </h1>
        <p className="mt-2 text-muted-foreground">{copy.admin.users.subtitle}</p>
      </div>
      <AdminUsersList
        users={users}
        total={total}
        page={page}
        pageSize={pageSize}
        query={query}
      />
    </div>
  );
}
