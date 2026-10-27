import {
  mapBlogPostDetail,
  mapBlogPostSummary,
  type BlogPostRow,
} from "@/lib/blog/map-blog-post-row";
import type { BlogPostSummary } from "@/lib/blog/types";
import { createClient } from "@/lib/supabase/server";

const SUMMARY_COLUMNS =
  "id, slug, title, excerpt, tags, published, published_at, like_count, comment_count, share_count";

export async function fetchRecentBlogPosts(
  limit = 12,
): Promise<BlogPostSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select(SUMMARY_COLUMNS)
    .eq("published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map((row) => mapBlogPostSummary(row as BlogPostRow));
}

export async function fetchAllBlogPostsAdmin(): Promise<BlogPostSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select(SUMMARY_COLUMNS)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapBlogPostSummary(row as BlogPostRow));
}

export async function fetchBlogPostByIdAdmin(
  postId: string,
): Promise<import("@/lib/blog/types").BlogPostDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", postId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapBlogPostDetail(data as BlogPostRow);
}
