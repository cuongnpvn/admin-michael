"use server";

import { copy } from "@/lib/copy/vi";
import { UserAccessError, requireUserSession } from "@/lib/learning/require-user";
import { fetchUserDisplayName } from "@/lib/user/resolve-display-name";
import { createClient } from "@/lib/supabase/server";

export type BlogEngagementResult =
  | { ok: true; likeCount: number; liked: boolean }
  | { ok: false; error: string };

export type BlogShareResult =
  | { ok: true; shareCount: number }
  | { ok: false; error: string };

export type BlogCommentResult =
  | { ok: true }
  | { ok: false; error: string };

function revalidateBlogPaths(_slug: string) {}

export async function toggleBlogLike(
  postId: string,
  slug: string,
): Promise<BlogEngagementResult> {
  try {
    const { supabase, user } = await requireUserSession();

    const { data: existingLike, error: likeLookupError } = await supabase
      .from("blog_likes")
      .select("post_id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (likeLookupError) {
      return { ok: false, error: likeLookupError.message };
    }

    if (existingLike) {
      const { error: deleteError } = await supabase
        .from("blog_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);

      if (deleteError) {
        return { ok: false, error: deleteError.message };
      }
    } else {
      const { error: insertError } = await supabase.from("blog_likes").insert({
        post_id: postId,
        user_id: user.id,
      });

      if (insertError) {
        return { ok: false, error: insertError.message };
      }
    }

    const { data: post, error: postError } = await supabase
      .from("blog_posts")
      .select("like_count")
      .eq("id", postId)
      .maybeSingle();

    if (postError || !post) {
      return { ok: false, error: postError?.message ?? copy.home.blog.errors.generic };
    }

    revalidateBlogPaths(slug);

    return {
      ok: true,
      likeCount: post.like_count as number,
      liked: !existingLike,
    };
  } catch (error) {
    if (error instanceof UserAccessError) {
      return { ok: false, error: copy.user.errors.notSignedIn };
    }

    return {
      ok: false,
      error: error instanceof Error ? error.message : copy.home.blog.errors.generic,
    };
  }
}

export async function incrementBlogShare(
  postId: string,
  slug: string,
): Promise<BlogShareResult> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("increment_blog_share_count", {
      p_post_id: postId,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidateBlogPaths(slug);
    return { ok: true, shareCount: data as number };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : copy.home.blog.errors.generic,
    };
  }
}

export async function addBlogComment(
  postId: string,
  slug: string,
  body: string,
): Promise<BlogCommentResult> {
  try {
    const trimmed = body.trim();
    if (!trimmed) {
      return { ok: false, error: copy.home.blog.errors.commentRequired };
    }

    const { supabase, user } = await requireUserSession();
    const authorDisplayName = await fetchUserDisplayName(
      supabase,
      user.id,
      user.user_metadata,
    );

    const { error } = await supabase.from("blog_comments").insert({
      post_id: postId,
      user_id: user.id,
      author_display_name: authorDisplayName,
      body: trimmed,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidateBlogPaths(slug);
    return { ok: true };
  } catch (error) {
    if (error instanceof UserAccessError) {
      return { ok: false, error: copy.user.errors.notSignedIn };
    }

    return {
      ok: false,
      error: error instanceof Error ? error.message : copy.home.blog.errors.generic,
    };
  }
}
