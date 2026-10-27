"use client";

import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteBlogPost } from "@/lib/admin/blog/actions";
import { adminBlogEditPath, adminBlogNewPath } from "@/lib/admin/admin-paths";
import { formatBlogDate } from "@/lib/blog/format-blog-date";
import type { BlogPostSummary } from "@/lib/blog/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { copy } from "@/lib/copy/vi";

interface AdminBlogListProps {
  posts: BlogPostSummary[];
}

export function AdminBlogList({ posts }: AdminBlogListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete(postId: string) {
    if (!window.confirm(copy.admin.blog.deleteConfirm)) return;

    startTransition(async () => {
      const result = await deleteBlogPost(postId);
      if (!result.ok) {
        window.alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link href={adminBlogNewPath()}>
            <Plus className="size-4" />
            {copy.admin.blog.newPost}
          </Link>
        </Button>
      </div>

      {posts.length === 0 ? (
        <p className="rounded-[12px] border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
          {copy.admin.emptyTable}
        </p>
      ) : (
        <div className="overflow-hidden rounded-[16px] border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{copy.admin.blog.columns.title}</TableHead>
                <TableHead>{copy.admin.blog.columns.status}</TableHead>
                <TableHead>{copy.admin.blog.columns.tags}</TableHead>
                <TableHead>{copy.admin.blog.columns.engagement}</TableHead>
                <TableHead>{copy.admin.blog.columns.publishedAt}</TableHead>
                <TableHead className="text-right">
                  {copy.admin.blog.columns.actions}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="max-w-xs">
                    <div className="font-medium">{post.title}</div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">
                      /community/blog/{post.slug}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={post.published ? "success" : "secondary"}>
                      {post.published
                        ? copy.admin.blog.fields.published
                        : copy.admin.blog.fields.draft}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex max-w-[180px] flex-wrap gap-1">
                      {post.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {copy.admin.blog.engagementSummary(
                      post.likeCount,
                      post.commentCount,
                      post.shareCount,
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatBlogDate(post.publishedAt) || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={adminBlogEditPath(post.id)}>
                          <Pencil className="size-4" />
                          {copy.admin.actions.manage}
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleDelete(post.id)}
                      >
                        <Trash2 className="size-4" />
                        {copy.admin.blog.delete}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
