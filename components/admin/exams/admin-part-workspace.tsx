"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AdminPartCmsTable } from "@/components/admin/exams/admin-part-cms-table";
import { AdminReadingPassageCms } from "@/components/admin/exams/admin-reading-passage-cms";
import { DifficultyScaleBar } from "@/components/study/difficulty-scale-bar";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { copy } from "@/lib/copy/vi";
import {
	ADMIN_ENTRANCE_TEST_PATH,
	adminExamsPath,
	adminSectionTestPath,
} from "@/lib/admin/admin-paths";
import { isEntranceTestBook } from "@/lib/content/catalog-ids";
import type { PublishSection } from "@/lib/content/publish-test";
import type { AdminPartStats, AdminTestStats } from "@/lib/admin/content/stats";
import type { BookCatalogEntry, TestCatalogEntry } from "@/types/test-data";
import type { AdminPartEditorData } from "@/types/admin-part-editor";
import { partDifficultyStatKey } from "@/lib/practice/feedback/stat-keys";
import type { PracticeDifficultyStatsMap } from "@/lib/practice/feedback/types";

interface AdminPartWorkspaceProps {
	book: BookCatalogEntry;
	test: TestCatalogEntry;
	part: number;
	partTitle: string;
	editorData: AdminPartEditorData | null;
	partStats: AdminPartStats | null;
	testStats?: AdminTestStats | null;
	difficultyStats?: PracticeDifficultyStatsMap;
	highlightedQuestion?: string;
	adminSection?: PublishSection;
}

export function AdminPartWorkspace({
	book,
	test,
	part,
	partTitle,
	editorData,
	partStats,
	testStats,
	difficultyStats,
	highlightedQuestion,
	adminSection,
}: AdminPartWorkspaceProps) {
	const section = adminSection ?? (part <= 4 ? "listening" : "reading");
	const partDifficultyStat = difficultyStats?.get(partDifficultyStatKey(part));
	const showPartDifficultyOverview =
		part === 1 || part === 2 || part === 5;
	const isEntrance = isEntranceTestBook(book.id);

	return (
		<div className="space-y-6">
			<nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
				<Link
					href={isEntrance ? ADMIN_ENTRANCE_TEST_PATH : "/admin/exams"}
					className="hover:text-primary"
				>
					{isEntrance
						? copy.admin.nav.entranceTest
						: copy.admin.exams.breadcrumbExams}
				</Link>
				{isEntrance ? null : (
					<>
						<ChevronRight className="size-4" />
						<Link
							href={adminExamsPath(book.id, test.id)}
							className="hover:text-primary"
						>
							{book.name}
						</Link>
					</>
				)}
				<ChevronRight className="size-4" />
				<Link
					href={adminSectionTestPath(section, book.id, test.id)}
					className="hover:text-primary"
				>
					{test.label}
				</Link>
				<ChevronRight className="size-4" />
				<span className="text-foreground">
					{copy.common.part} {part}
				</span>
			</nav>

			<div>
				<h1 className="text-2xl font-semibold tracking-tight">
					{partTitle}
				</h1>
				{highlightedQuestion && (
					<p className="mt-2 font-mono text-sm text-muted-foreground">
						question={highlightedQuestion}
					</p>
				)}
			</div>

			<Tabs defaultValue="questions">
				<TabsList>
					<TabsTrigger value="overview">
						{copy.admin.exams.tabs.overview}
					</TabsTrigger>
					<TabsTrigger value="questions">
						{part === 6 || part === 7
							? copy.common.passage
							: copy.admin.exams.tabs.questions}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="overview">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">
								{copy.admin.exams.tabs.overview}
							</CardTitle>
							<CardDescription>
								{copy.admin.cms.overviewHint}
							</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							<div className="rounded-[14px] bg-muted/50 p-4">
								<p className="text-sm text-muted-foreground">
									Draft
								</p>
								<p className="mt-1 text-lg font-semibold">
									{partStats
										? copy.admin.exams.draftCount(
												partStats.draftCount,
												partStats.targetCount,
											)
										: "—"}
								</p>
							</div>
							<div className="rounded-[14px] bg-muted/50 p-4">
								<p className="text-sm text-muted-foreground">
									{section === "listening"
										? "Listening"
										: "Reading"}{" "}
									publish
								</p>
								<p className="mt-1 font-medium">
									{(
										section === "listening"
											? testStats?.listeningPublished
											: testStats?.readingPublished
									)
										? copy.admin.exams.published
										: copy.admin.exams.unpublished}
								</p>
							</div>
							{showPartDifficultyOverview ? (
								<div className="rounded-[14px] bg-muted/50 p-4">
									<DifficultyScaleBar
										score={partDifficultyStat?.median ?? 0}
									/>
								</div>
							) : null}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="questions">
					{editorData ? (
						part === 6 || part === 7 ? (
							<AdminReadingPassageCms
								initialData={editorData}
								difficultyStats={difficultyStats}
							/>
						) : (
							<AdminPartCmsTable
								initialData={editorData}
								difficultyStats={difficultyStats}
							/>
						)
					) : (
						<Card>
							<CardContent className="py-10 text-center text-sm text-muted-foreground">
								{copy.admin.cms.noData}
							</CardContent>
						</Card>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}
