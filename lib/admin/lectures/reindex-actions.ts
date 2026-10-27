"use server";

import {
  AdminAccessError,
  requireAdminSession,
} from "@/lib/admin/auth/require-admin";
import { geminiError } from "@/lib/admin/gemini/gemini-log";
import { copy } from "@/lib/copy/vi";
import { reindexPublishedCatalog } from "@/lib/lectures/rag/reindex-lecture";

function accessError(code: string): string {
  if (code === "not_signed_in") return copy.admin.lectures.errors.notSignedIn;
  if (code === "not_admin") return copy.admin.lectures.errors.notAdmin;
  return copy.admin.lectures.errors.generic;
}

export type ReindexLectureCatalogResult =
  | { ok: true; indexed: number; skipped: number }
  | { ok: false; error: string };

export async function reindexPublishedLectureCatalog(): Promise<ReindexLectureCatalogResult> {
  try {
    await requireAdminSession();
    const result = await reindexPublishedCatalog();
    return { ok: true, ...result };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    geminiError("lecture_reindex_failed", { label: "lecture-reindex" }, error);
    const detail = error instanceof Error ? error.message.trim() : "";
    return {
      ok: false,
      error: detail
        ? `${copy.admin.lectures.errors.reindexFailed} ${detail}`
        : copy.admin.lectures.errors.reindexFailed,
    };
  }
}
