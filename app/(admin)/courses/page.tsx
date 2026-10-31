import { AdminLectureCollectionList } from "@/components/admin/lectures/admin-lecture-collection-list";
import { fetchAdminLectureCollections } from "@/lib/admin/lectures/load-admin-lectures";
import { copy } from "@/lib/copy/vi";

export default async function AdminLecturesPage() {
  const collections = await fetchAdminLectureCollections();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:px-8 lg:py-10">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">
          {copy.admin.lectures.title}
        </h1>
        <p className="mt-2 text-muted-foreground">{copy.admin.lectures.subtitle}</p>
      </div>
      <AdminLectureCollectionList collections={collections} />
    </div>
  );
}
