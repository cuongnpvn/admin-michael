"use server";

import {
  AdminAccessError,
  requireAdminSession,
} from "@/lib/admin/auth/require-admin";
import { loadListeningTestDictation } from "@/lib/admin/content/listening-test-dictation";
import type { ListeningDictationTarget } from "@/lib/admin/content/listening-test-dictation";
import { upsertListeningDictationUnits } from "@/lib/admin/content/upsert-listening-dictation-units";
import { revalidateAdminExamCatalogPaths } from "@/lib/admin/revalidate-admin-exam-catalog";
import { copy } from "@/lib/copy/vi";

export type ListListeningTestDictationResult =
  | {
      ok: true;
      pending: Array<Pick<ListeningDictationTarget, "kind" | "id" | "label">>;
      total: number;
    }
  | { ok: false; error: string };

export type SyncListeningTestDictationResult =
  | { ok: true; count: number }
  | { ok: false; error: string };

function accessError(code: string): string {
  if (code === "not_signed_in") return copy.admin.import.errors.notSignedIn;
  if (code === "not_admin") return copy.admin.import.errors.notAdmin;
  return copy.admin.cms.turnAlignment.errors.generic;
}

export async function listListeningTestDictationTargets(
  bookId: string,
  testId: string,
): Promise<ListListeningTestDictationResult> {
  try {
    const { supabase } = await requireAdminSession();
    const { targets } = await loadListeningTestDictation(
      supabase,
      bookId,
      testId,
    );
    return {
      ok: true,
      total: targets.length,
      pending: targets
        .filter((target) => !target.ready)
        .map(({ kind, id, label }) => ({ kind, id, label })),
    };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    const message = error instanceof Error ? error.message : "";
    return {
      ok: false,
      error: message.trim() || copy.admin.cms.turnAlignment.errors.generic,
    };
  }
}

export async function syncListeningTestDictation(
  bookId: string,
  testId: string,
): Promise<SyncListeningTestDictationResult> {
  try {
    const { supabase } = await requireAdminSession();
    const { units } = await loadListeningTestDictation(
      supabase,
      bookId,
      testId,
    );
    const count = await upsertListeningDictationUnits(supabase, units);
    revalidateAdminExamCatalogPaths(bookId, testId);
    return { ok: true, count };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    const message = error instanceof Error ? error.message : "";
    return {
      ok: false,
      error: message.trim() || copy.admin.cms.turnAlignment.errors.generic,
    };
  }
}
