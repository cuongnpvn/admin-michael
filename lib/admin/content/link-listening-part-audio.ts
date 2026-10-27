"use server";

import { AdminAccessError, requireAdminSession } from "@/lib/admin/auth/require-admin";
import { linkListeningPartAudioAsset } from "@/lib/admin/content/upload-test-media";
import type { CreateExamStepResult } from "@/lib/admin/content/create-exam-test-pipeline";
import { copy } from "@/lib/copy/vi";

function accessError(code: string): string {
  if (code === "not_signed_in") return copy.admin.import.errors.notSignedIn;
  if (code === "not_admin") return copy.admin.import.errors.notAdmin;
  return copy.admin.cms.errors.generic;
}

export async function linkListeningPartAudio(
  bookId: string,
  testId: string,
  part: 1 | 2 | 3 | 4,
  storagePath: string,
  contentType: string,
): Promise<CreateExamStepResult> {
  try {
    const { supabase } = await requireAdminSession();
    await linkListeningPartAudioAsset(
      supabase,
      bookId,
      testId,
      part,
      storagePath,
      contentType || "audio/mpeg",
    );
    return { ok: true };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : accessError("generic"),
    };
  }
}
