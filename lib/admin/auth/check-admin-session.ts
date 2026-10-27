import {
  AdminAccessError,
  requireAdminSession,
} from "@/lib/admin/auth/require-admin";

export async function hasAdminSession(): Promise<boolean> {
  try {
    await requireAdminSession();
    return true;
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return false;
    }

    throw error;
  }
}
