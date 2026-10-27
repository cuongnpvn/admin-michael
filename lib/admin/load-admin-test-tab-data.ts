"use server";

import { fetchAdminTestStats } from "@/lib/admin/content/stats";
import type { AdminTestStats } from "@/lib/admin/content/stats";
import { createClient } from "@/lib/supabase/server";

export interface AdminTestTabData {
  testStats: AdminTestStats | null;
}

export async function loadAdminTestTabData(
  bookId: string,
  testId: string,
): Promise<AdminTestTabData> {
  const supabase = await createClient();
  const testStats = await fetchAdminTestStats(supabase, bookId, testId);
  return { testStats };
}
