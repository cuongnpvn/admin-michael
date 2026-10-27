"use server";

import { AdminAccessError, requireAdminSession } from "@/lib/admin/auth/require-admin";
import { upsertMediaAssetByPath } from "@/lib/admin/content/media-asset-upsert";
import { revalidateAdminExamCatalogPaths } from "@/lib/admin/revalidate-admin-exam-catalog";
import { isEntranceTestBook } from "@/lib/content/catalog-ids";
import { canonicalListeningImageStoragePath } from "@/lib/content/listening-image-paths";
import {
  buildPublicAssetUrlForBucket,
  IMAGES_BUCKET,
  normalizeMediaStorageInput,
} from "@/lib/content/media-storage-paths";
import { copy } from "@/lib/copy/vi";

type LinkInput = {
  bookId: string;
  testId: string;
  storagePath: string;
  questionId: string;
} & ({ part: 1 } | { part: 3 | 4 });

export type LinkListeningImageResult =
  | { ok: true; publicUrl: string; storagePath: string }
  | { ok: false; error: string };

function accessError(code: string): string {
  if (code === "not_signed_in") return copy.admin.import.errors.notSignedIn;
  if (code === "not_admin") return copy.admin.import.errors.notAdmin;
  return copy.admin.cms.errors.generic;
}

export async function linkAdminListeningImage(
  input: LinkInput,
): Promise<LinkListeningImageResult> {
  try {
    if (!isEntranceTestBook(input.bookId)) {
      return { ok: false, error: copy.admin.cms.listeningImage.entranceOnly };
    }

    const { supabase } = await requireAdminSession();
    const expected = await expectedImageTarget(supabase, input);
    const uploaded = normalizeMediaStorageInput(input.storagePath, "image");
    if (
      !expected ||
      !uploaded ||
      uploaded.storageBucket !== IMAGES_BUCKET ||
      uploaded.storagePath !== expected.storagePath
    ) {
      return { ok: false, error: copy.admin.cms.listeningImage.pathMismatch };
    }

    const assetId = await upsertMediaAssetByPath(
      supabase,
      input.bookId,
      input.testId,
      "image",
      expected.storagePath,
      "image/png",
    );
    if (!assetId) {
      return { ok: false, error: copy.admin.cms.listeningImage.pathMismatch };
    }

    switch (input.part) {
      case 1: {
        const { error } = await supabase.from("listening_part1_items").upsert(
          {
            question_id: input.questionId,
            image_asset_id: assetId,
          },
          { onConflict: "question_id" },
        );
        if (error) throw error;
        break;
      }
      case 3:
      case 4: {
        const { error } = await supabase
          .from("questions")
          .update({ context_image_asset_id: assetId })
          .eq("id", expected.anchorQuestionId)
          .eq("book_id", input.bookId)
          .eq("test_id", input.testId)
          .eq("part", String(input.part));
        if (error) throw error;
        break;
      }
    }

    revalidateAdminExamCatalogPaths();

    const publicUrl = buildPublicAssetUrlForBucket(
      IMAGES_BUCKET,
      expected.storagePath,
    );
    if (!publicUrl) {
      return { ok: false, error: copy.admin.cms.errors.generic };
    }

    return { ok: true, publicUrl, storagePath: expected.storagePath };
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

async function expectedImageTarget(
  supabase: Awaited<ReturnType<typeof requireAdminSession>>["supabase"],
  input: LinkInput,
): Promise<{ storagePath: string; anchorQuestionId: string } | null> {
  const { data: question, error } = await supabase
    .from("questions")
    .select("id, global_item_number, listening_group_id")
    .eq("id", input.questionId)
    .eq("book_id", input.bookId)
    .eq("test_id", input.testId)
    .eq("part", String(input.part))
    .maybeSingle();
  if (error) throw error;
  if (!question) return null;

  switch (input.part) {
    case 1: {
      const globalItemNumber = Number(question.global_item_number);
      if (!Number.isFinite(globalItemNumber)) return null;
      return {
        anchorQuestionId: String(question.id),
        storagePath: canonicalListeningImageStoragePath({
          part: 1,
          bookId: input.bookId,
          testId: input.testId,
          globalItemNumber,
        }),
      };
    }
    case 3:
    case 4: {
      if (!question.listening_group_id) return null;
      const { data: siblings, error: siblingsError } = await supabase
        .from("questions")
        .select("id, global_item_number")
        .eq("listening_group_id", question.listening_group_id)
        .eq("book_id", input.bookId)
        .eq("test_id", input.testId)
        .eq("part", String(input.part));
      if (siblingsError) throw siblingsError;

      let anchorId = String(question.id);
      let groupStart = Number(question.global_item_number);
      for (const sibling of siblings ?? []) {
        const globalItemNumber = Number(sibling.global_item_number);
        if (!Number.isFinite(globalItemNumber)) continue;
        if (globalItemNumber < groupStart) {
          groupStart = globalItemNumber;
          anchorId = String(sibling.id);
        }
      }
      if (!Number.isFinite(groupStart) || anchorId !== input.questionId) {
        return null;
      }

      return {
        anchorQuestionId: anchorId,
        storagePath: canonicalListeningImageStoragePath({
          part: input.part,
          bookId: input.bookId,
          testId: input.testId,
          groupStartGlobalItemNumber: groupStart,
        }),
      };
    }
  }
}
