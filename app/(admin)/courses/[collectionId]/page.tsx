import { notFound } from "next/navigation";
import { AdminLectureList } from "@/components/admin/lectures/admin-lecture-list";
import { fetchAdminCollectionLectures } from "@/lib/admin/lectures/load-admin-lectures";

export default async function AdminLectureCollectionPage({
  params,
}: {
  params: Promise<{ collectionId: string }>;
}) {
  const { collectionId } = await params;
  const { collection, lectures, stages } =
    await fetchAdminCollectionLectures(collectionId);
  if (!collection) notFound();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:px-8 lg:py-10">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">{collection.title}</h1>
        <p className="mt-2 text-muted-foreground">{collection.excerpt}</p>
      </div>
      <AdminLectureList
        collection={collection}
        lectures={lectures}
        stages={stages}
      />
    </div>
  );
}
