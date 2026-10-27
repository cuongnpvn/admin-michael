"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Crown, Radio, Users } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import {
  DashboardTodayListDialog,
  formatDashboardPeriodEnd,
} from "@/components/admin/dashboard/dashboard-today-list-dialog";
import type { AdminDashboardStats } from "@/lib/admin/dashboard/fetch-admin-dashboard-stats";
import { fetchLiveExamSessions } from "@/lib/admin/dashboard/fetch-live-exam-sessions";
import { EXAM_LIVE_ADMIN_POLL_MS } from "@/lib/exam/exam-live-session";
import { copy } from "@/lib/copy/vi";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DialogKey = "users" | "pro";

type StatCard = {
	title: string;
	value: number;
	icon: ComponentType<{ className?: string }>;
	primarySubtitle?: ReactNode;
	secondarySubtitle?: ReactNode;
	onClick?: () => void;
	ariaLabel?: string;
};

function formatNumber(value: number): string {
	return new Intl.NumberFormat("vi-VN").format(value);
}

export function DashboardStatCards({
	stats,
	initialLiveExamCount,
}: {
	stats: AdminDashboardStats;
	initialLiveExamCount: number;
}) {
	const [liveExamCount, setLiveExamCount] = useState(initialLiveExamCount);
	const [openDialog, setOpenDialog] = useState<DialogKey | null>(null);

	useEffect(() => {
		setLiveExamCount(initialLiveExamCount);
	}, [initialLiveExamCount]);

	useEffect(() => {
		let cancelled = false;

		const poll = async () => {
			try {
				const next = await fetchLiveExamSessions();
				if (!cancelled) setLiveExamCount(next.length);
			} catch (error) {
				console.error("fetchLiveExamSessions poll failed:", error);
			}
		};

		const intervalId = window.setInterval(() => {
			void poll();
		}, EXAM_LIVE_ADMIN_POLL_MS);

		return () => {
			cancelled = true;
			window.clearInterval(intervalId);
		};
	}, []);

	const cards: StatCard[] = [
		{
			title: copy.admin.overview.metrics.users,
			value: stats.totalUsers,
			icon: Users,
			primarySubtitle: copy.admin.overview.metrics.newRegistrationsToday(
				stats.newUsersToday,
			),
			onClick: () => setOpenDialog("users"),
			ariaLabel: copy.admin.overview.todayLists.openRegistrations,
		},
		{
			title: copy.admin.overview.metrics.pro,
			value: stats.activeProCount,
			icon: Crown,
			primarySubtitle: copy.admin.overview.metrics.newProToday(
				stats.newProToday,
			),
			onClick: () => setOpenDialog("pro"),
			ariaLabel: copy.admin.overview.todayLists.openPro,
		},
		{
			title: copy.admin.overview.metrics.tests,
			value: stats.publishedTests,
			icon: ClipboardList,
			secondarySubtitle: copy.admin.overview.metrics.testsAvailable,
		},
		{
			title: copy.admin.overview.metrics.liveExam,
			value: liveExamCount,
			icon: Radio,
			secondarySubtitle: copy.admin.overview.metrics.liveExamInProgress,
		},
	];

	return (
		<>
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{cards.map((card) => {
					const Icon = card.icon;
					const clickable = Boolean(card.onClick);
					return (
						<Card
							key={card.title}
							className={cn(
								"relative min-h-[160px] shadow-soft",
								clickable && "transition-calm hover:bg-muted/40",
							)}
						>
							{clickable ? (
								<button
									type="button"
									className="absolute inset-0 z-10 cursor-pointer rounded-[24px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
									aria-haspopup="dialog"
									aria-label={card.ariaLabel}
									onClick={card.onClick}
								/>
							) : null}
							<CardHeader className="flex flex-row items-center gap-2.5 space-y-0 p-6 pb-3">
								<Icon className="size-5 shrink-0 text-muted-foreground" />
								<CardTitle className="truncate text-sm font-medium text-muted-foreground">
									{card.title}
								</CardTitle>
							</CardHeader>
							<CardContent className="flex flex-col gap-3 p-6 pt-0">
								<p className="text-4xl font-semibold tracking-tight tabular-nums">
									{formatNumber(card.value)}
								</p>
								<div className="space-y-0.5">
									{card.primarySubtitle ? (
										<p className="truncate text-sm font-medium leading-snug">
											{card.primarySubtitle}
										</p>
									) : null}
									{card.secondarySubtitle ? (
										<p className="truncate text-sm leading-snug text-muted-foreground">
											{card.secondarySubtitle}
										</p>
									) : null}
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>
			<DashboardTodayListDialog
				open={openDialog === "users"}
				onOpenChange={(open) => setOpenDialog(open ? "users" : null)}
				title={copy.admin.overview.todayLists.registrationsTitle}
				description={copy.admin.overview.todayLists.description(
					stats.newUsersToday,
				)}
				empty={copy.admin.overview.todayLists.emptyRegistrations}
				rows={stats.newUsersTodayList.map((row) => ({
					id: row.userId,
					displayName: row.displayName,
					createdAt: row.createdAt,
				}))}
			/>
			<DashboardTodayListDialog
				open={openDialog === "pro"}
				onOpenChange={(open) => setOpenDialog(open ? "pro" : null)}
				title={copy.admin.overview.todayLists.proTitle}
				description={copy.admin.overview.todayLists.description(
					stats.newProTodayList.length,
				)}
				empty={copy.admin.overview.todayLists.emptyPro}
				showSubtitleColumn
				subtitleColumnLabel={
					copy.admin.overview.todayLists.columns.periodEnd
				}
				rows={stats.newProTodayList.map((row) => ({
					id: row.subscriptionId,
					displayName: row.displayName,
					createdAt: row.createdAt,
					subtitle: formatDashboardPeriodEnd(row.currentPeriodEnd),
				}))}
			/>
		</>
	);
}
