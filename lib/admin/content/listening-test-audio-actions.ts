"use server";

import { revalidateAdminExamCatalogPaths } from "@/lib/admin/revalidate-admin-exam-catalog";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildListeningTestAudioStoragePath,
  resolvePublicAssetRef,
} from "@/lib/content/media-storage-paths";
import { upsertMediaAssetByPath } from "@/lib/admin/content/media-asset-upsert";
import { uploadListeningTestAudioFile } from "@/lib/admin/content/upload-test-media";
import { AdminAccessError, requireAdminSession } from "@/lib/admin/auth/require-admin";
import { copy } from "@/lib/copy/vi";

type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

function accessError(code: string): string {
  if (code === "not_signed_in") return copy.admin.import.errors.notSignedIn;
  if (code === "not_admin") return copy.admin.import.errors.notAdmin;
  return copy.admin.cms.errors.generic;
}

function revalidateExamAdminPaths(_bookId: string, _testId: string) {
  revalidateAdminExamCatalogPaths();
}

export type ListeningTestAudioState = {
  storagePath: string | null;
  publicUrl: string | null;
  defaultPath: string;
};

export async function fetchListeningTestAudioState(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
): Promise<ListeningTestAudioState> {
  const defaultPath = buildListeningTestAudioStoragePath(bookId, testId);

  const { data, error } = await supabase
    .from("tests")
    .select("listening_audio_asset_id")
    .eq("book_id", bookId)
    .eq("id", testId)
    .maybeSingle();

  if (error) throw error;

  const assetId = data?.listening_audio_asset_id as string | null | undefined;
  if (!assetId) {
    return { storagePath: null, publicUrl: null, defaultPath };
  }

  const { data: asset, error: assetError } = await supabase
    .from("media_assets")
    .select("storage_path, storage_bucket")
    .eq("id", assetId)
    .maybeSingle();

  if (assetError) throw assetError;
  if (!asset) {
    return { storagePath: null, publicUrl: null, defaultPath };
  }

  const publicUrl = resolvePublicAssetRef(
    {
      storageBucket: asset.storage_bucket as string,
      storagePath: asset.storage_path as string,
    },
    undefined,
    "audio",
  );

  return {
    storagePath: asset.storage_path as string,
    publicUrl,
    defaultPath,
  };
}

export async function loadAdminListeningTestAudio(
  bookId: string,
  testId: string,
): Promise<ListeningTestAudioState> {
  const { supabase } = await requireAdminSession();
  return fetchListeningTestAudioState(supabase, bookId, testId);
}

export async function setAdminListeningTestAudioPath(
  bookId: string,
  testId: string,
  storagePath: string,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminSession();
    const assetId = await upsertMediaAssetByPath(
      supabase,
      bookId,
      testId,
      "audio",
      storagePath,
    );

    const { error } = await supabase
      .from("tests")
      .update({ listening_audio_asset_id: assetId })
      .eq("book_id", bookId)
      .eq("id", testId);

    if (error) throw error;

    revalidateExamAdminPaths(bookId, testId);
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

export async function clearAdminListeningTestAudio(
  bookId: string,
  testId: string,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminSession();

    const { error } = await supabase
      .from("tests")
      .update({ listening_audio_asset_id: null })
      .eq("book_id", bookId)
      .eq("id", testId);

    if (error) throw error;

    revalidateExamAdminPaths(bookId, testId);
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

export async function uploadAdminListeningTestAudio(
  bookId: string,
  testId: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "Chọn file audio (.mp3, .m4a, .wav)." };
    }

    const { supabase } = await requireAdminSession();
    await uploadListeningTestAudioFile(supabase, bookId, testId, file);

    revalidateExamAdminPaths(bookId, testId);
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
