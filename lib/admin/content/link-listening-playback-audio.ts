"use server";

import { AdminAccessError, requireAdminSession } from "@/lib/admin/auth/require-admin";
import { revalidateAdminExamCatalogPaths } from "@/lib/admin/revalidate-admin-exam-catalog";
import { upsertMediaAssetByPath } from "@/lib/admin/content/media-asset-upsert";
import { canonicalListeningPlaybackStoragePath } from "@/lib/content/listening-audio-paths";
import {
  AUDIOS_BUCKET,
  buildPublicAssetUrlForBucket,
  normalizeMediaStorageInput,
} from "@/lib/content/media-storage-paths";
import { copy } from "@/lib/copy/vi";

const AUDIO_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
]);

type LinkInput = {
  bookId: string;
  testId: string;
  storagePath: string;
  contentType: string;
} & (
  | { part: 1 | 2; questionId: string }
  | { part: 3 | 4; groupId: string }
);

export type LinkListeningPlaybackAudioResult =
  | { ok: true; publicUrl: string; storagePath: string }
  | { ok: false; error: string };

function accessError(code: string): string {
  if (code === "not_signed_in") return copy.admin.import.errors.notSignedIn;
  if (code === "not_admin") return copy.admin.import.errors.notAdmin;
  return copy.admin.cms.errors.generic;
}

export async function linkAdminListeningPlaybackAudio(
  input: LinkInput,
): Promise<LinkListeningPlaybackAudioResult> {
  try {
    const contentType = input.contentType.trim() || "audio/mpeg";
    if (!AUDIO_TYPES.has(contentType)) {
      return { ok: false, error: copy.admin.cms.listeningAudio.invalidType };
    }

    const { supabase } = await requireAdminSession();
    const expectedPath = await expectedStoragePath(supabase, input);
    const uploaded = normalizeMediaStorageInput(input.storagePath, "audio");
    if (
      !expectedPath ||
      !uploaded ||
      uploaded.storageBucket !== AUDIOS_BUCKET ||
      uploaded.storagePath !== expectedPath
    ) {
      return { ok: false, error: copy.admin.cms.listeningAudio.pathMismatch };
    }

    const assetId = await upsertMediaAssetByPath(
      supabase,
      input.bookId,
      input.testId,
      "audio",
      expectedPath,
      contentType,
    );
    if (!assetId) {
      return { ok: false, error: copy.admin.cms.listeningAudio.pathMismatch };
    }

    if (input.part === 1) {
      const { error } = await supabase
        .from("questions")
        .update({ audio_asset_id: assetId })
        .eq("id", input.questionId)
        .eq("book_id", input.bookId)
        .eq("test_id", input.testId)
        .eq("part", "1");
      if (error) throw error;
    } else if (input.part === 2) {
      const { error } = await supabase.from("listening_part2_items").upsert(
        {
          question_id: input.questionId,
          audio_asset_id: assetId,
        },
        { onConflict: "question_id" },
      );
      if (error) throw error;
    } else if (input.part === 3 || input.part === 4) {
      const { error } = await supabase
        .from("listening_groups")
        .update({ audio_asset_id: assetId })
        .eq("id", input.groupId)
        .eq("book_id", input.bookId)
        .eq("test_id", input.testId)
        .eq("part", String(input.part));
      if (error) throw error;
    }

    revalidateAdminExamCatalogPaths();

    const publicUrl = buildPublicAssetUrlForBucket(AUDIOS_BUCKET, expectedPath);
    if (!publicUrl) {
      return { ok: false, error: copy.admin.cms.errors.generic };
    }

    return { ok: true, publicUrl, storagePath: expectedPath };
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

async function expectedStoragePath(
  supabase: Awaited<ReturnType<typeof requireAdminSession>>["supabase"],
  input: LinkInput,
): Promise<string | null> {
  if (input.part === 1 || input.part === 2) {
    const { data, error } = await supabase
      .from("questions")
      .select("global_item_number")
      .eq("id", input.questionId)
      .eq("book_id", input.bookId)
      .eq("test_id", input.testId)
      .eq("part", String(input.part))
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const globalItemNumber = Number(data.global_item_number);
    if (!Number.isFinite(globalItemNumber)) return null;
    return canonicalListeningPlaybackStoragePath({
      bookId: input.bookId,
      testId: input.testId,
      part: input.part,
      globalItemNumber,
    });
  }

  if (input.part !== 3 && input.part !== 4) return null;

  const { data: group, error: groupError } = await supabase
    .from("listening_groups")
    .select("id")
    .eq("id", input.groupId)
    .eq("book_id", input.bookId)
    .eq("test_id", input.testId)
    .eq("part", String(input.part))
    .maybeSingle();
  if (groupError) throw groupError;
  if (!group) return null;

  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select("global_item_number")
    .eq("listening_group_id", input.groupId)
    .eq("book_id", input.bookId)
    .eq("test_id", input.testId)
    .eq("part", String(input.part));
  if (questionsError) throw questionsError;

  return canonicalListeningPlaybackStoragePath({
    bookId: input.bookId,
    testId: input.testId,
    part: input.part,
    groupGlobalNumbers: (questions ?? [])
      .map((question) => Number(question.global_item_number))
      .filter((value) => Number.isFinite(value)),
  });
}
