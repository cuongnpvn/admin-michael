import { AdminLectureTutorChat } from "@/components/admin/lectures/admin-lecture-tutor-chat";
import { fetchAdminPublishedTutorLectures } from "@/lib/admin/lectures/load-admin-lectures";

export default async function AdminLectureChatPage() {
  const lectures = await fetchAdminPublishedTutorLectures();
  return <AdminLectureTutorChat lectures={lectures} />;
}
