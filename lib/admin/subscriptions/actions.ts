"use server";

import { revalidatePath } from "next/cache";
import { revalidateAdminExamCatalogPaths } from "@/lib/admin/revalidate-admin-exam-catalog";
import {
  AdminAccessError,
  requireAdminSession,
} from "@/lib/admin/auth/require-admin";
import { copy } from "@/lib/copy/vi";

export type AdminSubscriptionActionResult =
  | { ok: true }
  | { ok: false; error: string };

type AdminSupabase = Awaited<
  ReturnType<typeof requireAdminSession>
>["supabase"];

function accessError(code: string): string {
  if (code === "not_signed_in") {
    return copy.admin.subscriptions.errors.notSignedIn;
  }
  if (code === "not_admin") {
    return copy.admin.subscriptions.errors.notAdmin;
  }
  return copy.admin.subscriptions.errors.generic;
}

async function revalidateAfterUniversalChange(
  supabase: AdminSupabase,
): Promise<void> {
  const { data, error } = await supabase.from("tests").select("book_id, id");
  if (error) throw error;

  const tests = ((data ?? []) as Array<{ book_id: string; id: string }>).map(
    (row) => ({ bookId: row.book_id, testId: row.id }),
  );

  revalidatePath("/admin/subscriptions");
  revalidateAdminExamCatalogPaths();
}

export async function setUniversalFreeExplanation(input: {
  part: number;
  slotKey: number;
  freeExplanation: boolean;
}): Promise<AdminSubscriptionActionResult> {
  try {
    const { supabase } = await requireAdminSession();

    const part = Number(input.part);
    const slotKey = Number(input.slotKey);
    if (
      !Number.isFinite(part) ||
      !Number.isFinite(slotKey) ||
      part < 1 ||
      part > 7
    ) {
      return { ok: false, error: copy.admin.subscriptions.errors.unitRequired };
    }

    const { data, error } = await supabase
      .from("questions")
      .update({ free_explanation: Boolean(input.freeExplanation) })
      .eq("part", String(part))
      .eq("global_item_number", slotKey)
      .select("id");

    if (error) throw error;
    if (!data?.length) {
      return {
        ok: false,
        error: copy.admin.subscriptions.errors.unitNotFound,
      };
    }

    await revalidateAfterUniversalChange(supabase);
    return { ok: true };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    console.error("setUniversalFreeExplanation failed", error);
    return { ok: false, error: copy.admin.subscriptions.errors.generic };
  }
}
