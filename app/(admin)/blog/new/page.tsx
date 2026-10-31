import { AdminBlogForm } from "@/components/admin/blog/admin-blog-form";
import { copy } from "@/lib/copy/vi";

export default function AdminBlogNewPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:px-10 lg:py-10">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">
          {copy.admin.blog.newPost}
        </h1>
        <p className="mt-2 text-muted-foreground">{copy.admin.blog.subtitle}</p>
      </div>
      <AdminBlogForm mode="create" />
    </div>
  );
}
