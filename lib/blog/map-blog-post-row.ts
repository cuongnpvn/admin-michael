import type { BlogPostDetail, BlogPostSummary } from "@/lib/blog/types";

export type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content_md?: string;
  tags: string[] | null;
  published?: boolean;
  published_at: string | null;
  like_count: number;
  comment_count: number;
  share_count: number;
  created_at?: string;
  updated_at?: string;
};

export function mapBlogPostSummary(row: BlogPostRow): BlogPostSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    tags: row.tags ?? [],
    published: row.published ?? false,
    publishedAt: row.published_at,
    likeCount: row.like_count,
    commentCount: row.comment_count,
    shareCount: row.share_count,
  };
}

export function mapBlogPostDetail(row: BlogPostRow): BlogPostDetail {
  return {
    ...mapBlogPostSummary(row),
    content: row.content_md ?? "",
    published: row.published ?? false,
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
  };
}
