import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  AdminAccessError,
  requireAdminSession,
} from "@/lib/admin/auth/require-admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdminSession();
  } catch (error) {
    if (error instanceof AdminAccessError) {
      if (error.message === "not_signed_in") {
        redirect("/login");
      }

      return null;
    }

    throw error;
  }

  return <AdminShell>{children}</AdminShell>;
}

/** Admin imports and uploads may run several minutes. */
export const maxDuration = 300;
