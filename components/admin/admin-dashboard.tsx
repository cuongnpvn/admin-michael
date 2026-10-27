import { fetchAdminDashboardStats } from "@/lib/admin/dashboard/fetch-admin-dashboard-stats";
import { fetchAdminExamAttemptStats } from "@/lib/admin/dashboard/fetch-admin-exam-attempt-stats";
import { fetchLiveExamSessions } from "@/lib/admin/dashboard/fetch-live-exam-sessions";
import { DashboardManageLinks } from "@/components/admin/dashboard/dashboard-manage-links";
import { DashboardStatCards } from "@/components/admin/dashboard/dashboard-stat-cards";
import { ExamAttemptsTable } from "@/components/admin/dashboard/exam-attempts-table";
import { LiveExamSessions } from "@/components/admin/dashboard/live-exam-sessions";
import { RegistrationsChart } from "@/components/admin/dashboard/registrations-chart";

export async function AdminDashboard() {
  const [stats, examAttemptStats, liveExamSessions] = await Promise.all([
    fetchAdminDashboardStats(),
    fetchAdminExamAttemptStats(),
    fetchLiveExamSessions(),
  ]);

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl space-y-8 px-4 py-8 lg:px-8 lg:py-10">
      <DashboardStatCards
        stats={stats}
        initialLiveExamCount={liveExamSessions.length}
      />
      <RegistrationsChart data={stats.registrationsByDay} />
      <LiveExamSessions initialSessions={liveExamSessions} />
      <ExamAttemptsTable statsByRange={examAttemptStats} />
      <DashboardManageLinks />
    </div>
  );
}
