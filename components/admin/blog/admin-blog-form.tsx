"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { BlogArticleView } from "@/components/blog/blog-article-view";
import {
  createBlogPost,
  updateBlogPost,
} from "@/lib/admin/blog/actions";
import { adminBlogEditPath, adminBlogPath } from "@/lib/admin/admin-paths";
import type { BlogPostDetail, BlogPostFormValues } from "@/lib/blog/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { copy } from "@/lib/copy/vi";
import { cn } from "@/lib/utils";

interface AdminBlogFormProps {
  mode: "create" | "edit";
  post?: BlogPostDetail;
}

function toTagsInput(tags: string[]): string {
  return tags.join(", ");
}

export function AdminBlogForm({ mode, post }: AdminBlogFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<BlogPostFormValues>({
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    excerpt: post?.excerpt ?? "",
    content: post?.content ?? "",
    tags: post?.tags ?? [],
    published: post?.published ?? false,
  });
  const [tagsInput, setTagsInput] = useState(toTagsInput(post?.tags ?? []));

  function patchValues(patch: Partial<BlogPostFormValues>) {
    setValues((current) => ({ ...current, ...patch }));
  }

  function parsedTags() {
    return tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const payload: BlogPostFormValues = {
      ...values,
      tags: parsedTags(),
    };

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createBlogPost(payload)
          : await updateBlogPost(post!.id, payload);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (mode === "create" && result.postId) {
        router.push(adminBlogEditPath(result.postId));
        router.refresh();
        return;
      }

      router.refresh();
    });
  }

  const previewPublishedAt = values.published
    ? (post?.publishedAt ?? new Date().toISOString())
    : post?.publishedAt;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="outline">
          <Link href={adminBlogPath()}>{copy.admin.blog.backToList}</Link>
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <Tabs
            value={viewMode}
            onValueChange={(value) => setViewMode(value as "edit" | "preview")}
          >
            <TabsList>
              <TabsTrigger value="edit">{copy.admin.blog.editTab}</TabsTrigger>
              <TabsTrigger value="preview">
                {copy.admin.blog.previewTab}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button type="submit" disabled={isPending}>
            {mode === "create" ? copy.admin.blog.create : copy.admin.blog.save}
          </Button>
        </div>
      </div>

      {error ? (
        <p className="rounded-[12px] border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {viewMode === "preview" ? (
        <div className="rounded-[16px] border border-border bg-background px-4 py-10 lg:px-16">
          <BlogArticleView
            title={values.title || copy.admin.blog.newPost}
            tags={parsedTags()}
            excerpt={values.excerpt}
            publishedAt={previewPublishedAt ?? null}
            content={values.content}
            postId={post?.id ?? "preview"}
            slug={values.slug || "preview"}
            likeCount={post?.likeCount ?? 0}
            commentCount={post?.commentCount ?? 0}
            shareCount={post?.shareCount ?? 0}
            preview
          />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="blog-title">{copy.admin.blog.fields.title}</Label>
              <Input
                id="blog-title"
                value={values.title}
                onChange={(event) => patchValues({ title: event.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="blog-slug">{copy.admin.blog.fields.slug}</Label>
              <Input
                id="blog-slug"
                value={values.slug}
                onChange={(event) => patchValues({ slug: event.target.value })}
                placeholder="auto-from-title"
              />
              <p className="text-xs text-muted-foreground">
                {copy.admin.blog.fields.slugHint}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="blog-excerpt">
                {copy.admin.blog.fields.excerpt}
              </Label>
              <textarea
                id="blog-excerpt"
                value={values.excerpt}
                onChange={(event) =>
                  patchValues({ excerpt: event.target.value })
                }
                rows={3}
                className={cn(
                  "w-full rounded-[12px] border border-border bg-background px-3 py-2 text-sm",
                  "text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              />
              <p className="text-xs text-muted-foreground">
                {copy.admin.blog.fields.excerptHint}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="blog-tags">{copy.admin.blog.fields.tags}</Label>
              <Input
                id="blog-tags"
                value={tagsInput}
                onChange={(event) => setTagsInput(event.target.value)}
                placeholder="listening, mẹo thi"
              />
              <p className="text-xs text-muted-foreground">
                {copy.admin.blog.fields.tagsHint}
              </p>
            </div>

            <div className="flex items-center justify-between rounded-[12px] border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">
                  {copy.admin.blog.fields.published}
                </p>
                <p className="text-xs text-muted-foreground">
                  {values.published
                    ? copy.admin.blog.fields.published
                    : copy.admin.blog.fields.draft}
                </p>
              </div>
              <input
                type="checkbox"
                checked={values.published}
                onChange={(event) =>
                  patchValues({ published: event.target.checked })
                }
                className="size-4 rounded border-border"
                aria-label={copy.admin.blog.fields.published}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>{copy.admin.blog.fields.content}</Label>
            <div className="rounded-[16px] border border-border bg-surface">
              <textarea
                value={values.content}
                onChange={(event) =>
                  patchValues({ content: event.target.value })
                }
                spellCheck={false}
                className={cn(
                  "min-h-[min(72vh,900px)] w-full resize-y bg-transparent p-6 font-mono text-sm leading-relaxed",
                  "text-foreground outline-none",
                )}
                aria-label={copy.admin.blog.htmlEditorLabel(
                  values.title || "Blog",
                )}
              />
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
