import type { ReactNode } from "react";
import { BlogEngagementBar } from "@/components/blog/blog-engagement-bar";
import { BlogTagList } from "@/components/blog/blog-tag-list";
import { BlogHtmlContent } from "@/lib/blog/blog-html";
import { formatBlogDate } from "@/lib/blog/format-blog-date";

interface BlogArticleViewProps {
  title: string;
  tags: string[];
  excerpt: string;
  publishedAt: string | null;
  content: string;
  postId: string;
  slug: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  initialLiked?: boolean;
  isSignedIn?: boolean;
  preview?: boolean;
  footer?: ReactNode;
}

export function BlogArticleView({
  title,
  tags,
  excerpt,
  publishedAt,
  content,
  postId,
  slug,
  likeCount,
  commentCount,
  shareCount,
  initialLiked = false,
  isSignedIn = false,
  preview = false,
  footer,
}: BlogArticleViewProps) {
  const engagement = {
    postId,
    slug,
    likeCount,
    commentCount,
    shareCount,
    initialLiked,
    isSignedIn,
    preview,
  };

  return (
    <div className="relative mx-auto w-full max-w-3xl">
      <article className="min-w-0 space-y-8">
        <header className="space-y-4 border-b border-border pb-8">
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
            {title}
          </h1>
          <BlogTagList tags={tags} />
          {excerpt ? (
            <p className="text-lg leading-relaxed text-muted-foreground">
              {excerpt}
            </p>
          ) : null}
          {publishedAt ? (
            <time
              className="block text-right text-sm text-muted-foreground"
              dateTime={publishedAt}
            >
              {formatBlogDate(publishedAt)}
            </time>
          ) : null}
          <div className="lg:hidden">
            <BlogEngagementBar {...engagement} layout="row" />
          </div>
        </header>

        <BlogHtmlContent html={content} />
      </article>

      <aside className="pointer-events-none absolute top-0 -right-20 hidden h-full lg:block xl:-right-24">
        <div className="pointer-events-auto sticky top-28">
          <BlogEngagementBar {...engagement} layout="rail" />
        </div>
      </aside>

      {footer}
    </div>
  );
}
