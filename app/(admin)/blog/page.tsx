import { AdminBlogList } from "@/components/admin/blog/admin-blog-list";
import { fetchAllBlogPostsAdmin } from "@/lib/blog/fetch-recent-posts";
import { copy } from "@/lib/copy/vi";

export default async function AdminBlogPage() {
  const posts = await fetchAllBlogPostsAdmin();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:px-8 lg:py-10">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">
          {copy.admin.blog.title}
        </h1>
        <p className="mt-2 text-muted-foreground">{copy.admin.blog.subtitle}</p>
      </div>
      <AdminBlogList posts={posts} />
    </div>
  );
}
