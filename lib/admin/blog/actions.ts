"use server";

import { revalidatePath } from "next/cache";
import {
  AdminAccessError,
  requireAdminSession,
} from "@/lib/admin/auth/require-admin";
import {
  ensureUniqueBlogSlug,
  slugifyBlogTitle,
} from "@/lib/admin/blog/slug";
import { adminBlogEditPath, adminBlogPath } from "@/lib/admin/admin-paths";
import { mapBlogPostDetail } from "@/lib/blog/map-blog-post-row";
import type { BlogPostFormValues } from "@/lib/blog/types";
import { copy } from "@/lib/copy/vi";

export type AdminBlogActionResult =
  | { ok: true; postId?: string }
  | { ok: false; error: string };

function accessError(code: string): string {
  if (code === "not_signed_in") return copy.admin.blog.errors.notSignedIn;
  if (code === "not_admin") return copy.admin.blog.errors.notAdmin;
  return copy.admin.blog.errors.generic;
}

function validateFormValues(values: BlogPostFormValues): string | null {
  if (!values.title.trim()) return copy.admin.blog.errors.titleRequired;
  if (!values.content.trim()) return copy.admin.blog.errors.contentRequired;
  return null;
}

async function resolveUniqueSlug(
  supabase: Awaited<
    ReturnType<typeof import("@/lib/supabase/server").createClient>
  >,
  title: string,
  slugInput: string,
  excludePostId?: string,
): Promise<string> {
  const baseSlug = slugifyBlogTitle(slugInput.trim() || title);
  const fallbackSlug = baseSlug || `post-${Date.now()}`;

  const { data: existingRows, error } = await supabase
    .from("blog_posts")
    .select("id, slug");

  if (error) throw error;

  const takenSlugs = (existingRows ?? [])
    .filter((row) => row.id !== excludePostId)
    .map((row) => row.slug as string);

  return ensureUniqueBlogSlug(fallbackSlug, takenSlugs);
}

function revalidateBlogSurfaces(_slug: string, _published: boolean) {
  revalidatePath(adminBlogPath());
}

export async function createBlogPost(
  values: BlogPostFormValues,
): Promise<AdminBlogActionResult> {
  try {
    const validationError = validateFormValues(values);
    if (validationError) return { ok: false, error: validationError };

    const { supabase } = await requireAdminSession();
    const slug = await resolveUniqueSlug(supabase, values.title, values.slug);
    const publishedAt = values.published ? new Date().toISOString() : null;

    const { data, error } = await supabase
      .from("blog_posts")
      .insert({
        slug,
        title: values.title.trim(),
        excerpt: values.excerpt.trim(),
        content_md: values.content,
        tags: values.tags,
        published: values.published,
        published_at: publishedAt,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        return { ok: false, error: copy.admin.blog.errors.slugTaken };
      }
      return { ok: false, error: error.message };
    }

    revalidateBlogSurfaces(slug, values.published);
    revalidatePath(adminBlogEditPath(data.id as string));
    return { ok: true, postId: data.id as string };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : copy.admin.blog.errors.saveFailed,
    };
  }
}

export async function updateBlogPost(
  postId: string,
  values: BlogPostFormValues,
): Promise<AdminBlogActionResult> {
  try {
    const validationError = validateFormValues(values);
    if (validationError) return { ok: false, error: validationError };

    const { supabase } = await requireAdminSession();
    const { data: existing, error: existingError } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("id", postId)
      .maybeSingle();

    if (existingError) return { ok: false, error: existingError.message };
    if (!existing) return { ok: false, error: copy.admin.blog.errors.generic };

    const slug = await resolveUniqueSlug(
      supabase,
      values.title,
      values.slug,
      postId,
    );

    const wasPublished = Boolean(existing.published);
    const publishedAt =
      values.published && !existing.published_at
        ? new Date().toISOString()
        : values.published
          ? (existing.published_at as string | null)
          : null;

    const { error } = await supabase
      .from("blog_posts")
      .update({
        slug,
        title: values.title.trim(),
        excerpt: values.excerpt.trim(),
        content_md: values.content,
        tags: values.tags,
        published: values.published,
        published_at: publishedAt,
      })
      .eq("id", postId);

    if (error) {
      if (error.code === "23505") {
        return { ok: false, error: copy.admin.blog.errors.slugTaken };
      }
      return { ok: false, error: error.message };
    }

    revalidateBlogSurfaces(slug, values.published);
    if (existing.slug !== slug || wasPublished) {
    }
    revalidatePath(adminBlogEditPath(postId));
    return { ok: true, postId };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : copy.admin.blog.errors.saveFailed,
    };
  }
}

export async function deleteBlogPost(postId: string): Promise<AdminBlogActionResult> {
  try {
    const { supabase } = await requireAdminSession();
    const { data: existing, error: existingError } = await supabase
      .from("blog_posts")
      .select("slug, published")
      .eq("id", postId)
      .maybeSingle();

    if (existingError) return { ok: false, error: existingError.message };
    if (!existing) return { ok: false, error: copy.admin.blog.errors.generic };

    const { error } = await supabase.from("blog_posts").delete().eq("id", postId);
    if (error) return { ok: false, error: error.message };

    revalidatePath(adminBlogPath());
    if (existing.published) {
    }

    return { ok: true };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : copy.admin.blog.errors.deleteFailed,
    };
  }
}

export async function toggleBlogPublished(
  postId: string,
  published: boolean,
): Promise<AdminBlogActionResult> {
  try {
    const { supabase } = await requireAdminSession();
    const { data: existing, error: existingError } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("id", postId)
      .maybeSingle();

    if (existingError) return { ok: false, error: existingError.message };
    if (!existing) return { ok: false, error: copy.admin.blog.errors.generic };

    const post = mapBlogPostDetail(
      existing as Parameters<typeof mapBlogPostDetail>[0],
    );
    const publishedAt =
      published && !post.publishedAt
        ? new Date().toISOString()
        : published
          ? post.publishedAt
          : null;

    const { error } = await supabase
      .from("blog_posts")
      .update({ published, published_at: publishedAt })
      .eq("id", postId);

    if (error) return { ok: false, error: error.message };

    revalidateBlogSurfaces(post.slug, published);
    revalidatePath(adminBlogEditPath(postId));
    return { ok: true };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : copy.admin.blog.errors.saveFailed,
    };
  }
}
