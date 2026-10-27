"use server";

import { revalidatePath } from "next/cache";
import {
  AdminAccessError,
  requireAdminSession,
} from "@/lib/admin/auth/require-admin";
import { copy } from "@/lib/copy/vi";
import {
  adminLectureCollectionPath,
  adminLecturesPath,
} from "@/lib/lectures/paths";
import { sanitizeCollectionDescriptionHtml } from "@/lib/lectures/sanitize-html";
import {
  ensureUniqueLectureSlug,
  slugifyLectureTitle,
} from "@/lib/lectures/slug";
import {
  normalizeCollectionStages,
  type StageDraft,
} from "@/lib/lectures/schedule";
import type { LectureAccessTier } from "@/lib/lectures/types";

export type AdminLectureActionResult =
  | { ok: true; collectionId?: string; lectureId?: string }
  | { ok: false; error: string };

function accessError(code: string): string {
  if (code === "not_signed_in") return copy.admin.lectures.errors.notSignedIn;
  if (code === "not_admin") return copy.admin.lectures.errors.notAdmin;
  return copy.admin.lectures.errors.generic;
}

function revalidateLectureAdmin(collectionId?: string, _collectionSlug?: string) {
  revalidatePath(adminLecturesPath());
  if (collectionId) {
    revalidatePath(adminLectureCollectionPath(collectionId));
  }
}

export async function createLectureCollection(input: {
  title: string;
  excerpt: string;
  accessTier: LectureAccessTier;
}): Promise<AdminLectureActionResult> {
  try {
    const title = input.title.trim();
    if (!title) return { ok: false, error: copy.admin.lectures.errors.titleRequired };

    const { supabase } = await requireAdminSession();
    const { data: existing, error: existingError } = await supabase
      .from("lecture_collections")
      .select("slug, sort_order");

    if (existingError) return { ok: false, error: existingError.message };

    const slug = ensureUniqueLectureSlug(
      slugifyLectureTitle(title) || `collection-${Date.now()}`,
      (existing ?? []).map((row) => row.slug as string),
    );
    const sortOrder =
      Math.max(0, ...(existing ?? []).map((row) => Number(row.sort_order) || 0)) +
      1;

    const { data, error } = await supabase
      .from("lecture_collections")
      .insert({
        title,
        excerpt: input.excerpt.trim(),
        slug,
        access_tier: input.accessTier,
        sort_order: sortOrder,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };

    revalidateLectureAdmin();
    return { ok: true, collectionId: data.id as string };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return { ok: false, error: copy.admin.lectures.errors.generic };
  }
}

async function replaceCollectionStages(
  supabase: Awaited<ReturnType<typeof requireAdminSession>>["supabase"],
  collectionId: string,
  drafts: StageDraft[],
): Promise<AdminLectureActionResult> {
  const normalized = normalizeCollectionStages(drafts);
  if (!normalized.ok) {
    return { ok: false, error: stageDraftError(normalized.error) };
  }

  const { error: deleteError } = await supabase
    .from("lecture_collection_stages")
    .delete()
    .eq("collection_id", collectionId);
  if (deleteError) return { ok: false, error: deleteError.message };

  if (normalized.stages.length === 0) return { ok: true };

  const { error } = await supabase.from("lecture_collection_stages").insert(
    normalized.stages.map((stage, index) => ({
      collection_id: collectionId,
      stage_number: index + 1,
      title: stage.title,
      day_start: stage.dayStart,
      day_end: stage.dayEnd,
    })),
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

function stageDraftError(code: string): string {
  if (code === "emptyTitle") return copy.admin.lectures.errors.stageTitleRequired;
  if (code === "invalidDay") return copy.admin.lectures.errors.stageDayInvalid;
  if (code === "invalidRange") return copy.admin.lectures.errors.stageRange;
  if (code === "overlap") return copy.admin.lectures.errors.stageOverlap;
  return copy.admin.lectures.errors.generic;
}

export async function updateLectureCollection(input: {
  collectionId: string;
  title: string;
  excerpt: string;
  descriptionHtml: string;
  accessTier: LectureAccessTier;
  published: boolean;
  stages: StageDraft[];
}): Promise<AdminLectureActionResult> {
  try {
    const title = input.title.trim();
    if (!title) return { ok: false, error: copy.admin.lectures.errors.titleRequired };

    const { supabase } = await requireAdminSession();
    const { data: current, error: currentError } = await supabase
      .from("lecture_collections")
      .select("published_at, slug")
      .eq("id", input.collectionId)
      .maybeSingle();

    if (currentError) return { ok: false, error: currentError.message };
    if (!current) return { ok: false, error: copy.admin.lectures.errors.generic };

    const { error } = await supabase
      .from("lecture_collections")
      .update({
        title,
        excerpt: input.excerpt.trim(),
        description_html: sanitizeCollectionDescriptionHtml(input.descriptionHtml),
        access_tier: input.accessTier,
        published: input.published,
        published_at: input.published
          ? ((current.published_at as string | null) ?? new Date().toISOString())
          : null,
      })
      .eq("id", input.collectionId);

    if (error) return { ok: false, error: error.message };

    const replaced = await replaceCollectionStages(
      supabase,
      input.collectionId,
      input.stages,
    );
    if (!replaced.ok) return replaced;

    revalidateLectureAdmin(input.collectionId, current.slug as string);
    return { ok: true, collectionId: input.collectionId };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return { ok: false, error: copy.admin.lectures.errors.generic };
  }
}

export async function deleteLectureCollection(
  collectionId: string,
): Promise<AdminLectureActionResult> {
  try {
    const { supabase } = await requireAdminSession();
    const { count, error: countError } = await supabase
      .from("lectures")
      .select("id", { count: "exact", head: true })
      .eq("collection_id", collectionId);

    if (countError) return { ok: false, error: countError.message };
    if ((count ?? 0) > 0) {
      return { ok: false, error: copy.admin.lectures.errors.collectionNotEmpty };
    }

    const { error } = await supabase
      .from("lecture_collections")
      .delete()
      .eq("id", collectionId);

    if (error) return { ok: false, error: error.message };

    revalidateLectureAdmin();
    return { ok: true };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return { ok: false, error: copy.admin.lectures.errors.generic };
  }
}
