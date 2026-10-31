import { notFound } from "next/navigation";
import { AdminBlogForm } from "@/components/admin/blog/admin-blog-form";
import { fetchBlogPostByIdAdmin } from "@/lib/blog/fetch-recent-posts";
import { copy } from "@/lib/copy/vi";

interface AdminBlogEditPageProps {
  params: Promise<{ postId: string }>;
}

export default async function AdminBlogEditPage({
  params,
}: AdminBlogEditPageProps) {
  const { postId } = await params;
  const post = await fetchBlogPostByIdAdmin(postId);

  if (!post) notFound();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:px-10 lg:py-10">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">
          {copy.admin.blog.editPost}
        </h1>
        <p className="mt-2 text-muted-foreground">{post.title}</p>
      </div>
      <AdminBlogForm mode="edit" post={post} />
    </div>
  );
}
