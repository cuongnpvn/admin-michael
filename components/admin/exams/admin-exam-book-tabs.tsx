"use client";

import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { copy } from "@/lib/copy/vi";
import { adminExamsPath } from "@/lib/admin/admin-paths";
import type { AdminTestStats } from "@/lib/admin/content/stats";
import { cn } from "@/lib/utils";
import type { BookCatalogEntry, TestCatalogEntry } from "@/types/test-data";
import type { ListeningPart, ReadingPart } from "@/types/ui";

type StudyPart = ListeningPart | ReadingPart;

interface AdminExamBookTabsProps {
	book: BookCatalogEntry;
	parts: StudyPart[];
	layout?: "grid-2" | "stack";
	className?: string;
	testStatsMap?: Record<string, AdminTestStats>;
}

function AdminPartCardFooter({
	bookId,
	testId,
	part,
	testStats,
}: {
	bookId: string;
	testId: string;
	part: StudyPart;
	testStats?: AdminTestStats;
}) {
	return (
		<>
			<Button
				asChild
				className="w-[10.25rem] shrink-0"
				variant="secondary"
			>
				<Link
					href={`${adminExamsPath(bookId, testId)}/parts/${part.part}`}
				>
					{copy.admin.actions.manage}
					<ArrowRight className="size-4" />
				</Link>
			</Button>
		</>
	);
}

function TestPartCards({
	book,
	test,
	parts,
	layout,
	testStats,
}: {
	book: BookCatalogEntry;
	test: TestCatalogEntry;
	parts: StudyPart[];
	layout: "grid-2" | "stack";
	testStats?: AdminTestStats;
}) {
	return (
		<div
			className={cn(
				"grid gap-6",
				layout === "grid-2" && "md:grid-cols-2",
			)}
		>
			{parts.map((part) => (
				<Card
					key={`${book.id}-${test.id}-${part.part}`}
					className="transition-calm hover:-translate-y-px hover:shadow-card"
				>
					<CardHeader>
						<CardTitle>{part.title}</CardTitle>
						<CardDescription
							className={
								layout === "stack"
									? "mt-2 max-w-2xl"
									: undefined
							}
						>
							{part.description}
						</CardDescription>
					</CardHeader>
					<CardContent className="flex items-center justify-between gap-4">
						<AdminPartCardFooter
							bookId={book.id}
							testId={test.id}
							part={part}
							testStats={testStats}
						/>
					</CardContent>
				</Card>
			))}
		</div>
	);
}

export function AdminExamBookTabs({
	book,
	parts,
	layout = "grid-2",
	className,
	testStatsMap,
}: AdminExamBookTabsProps) {
	const defaultTest = book.tests[0]?.id;

	return (
		<div className={cn("space-y-6", className)}>
			<Tabs defaultValue={book.id} className="gap-4">
				<TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-[16px] p-1.5 sm:flex-nowrap">
					<TabsTrigger
						value={book.id}
						className="shrink-0 px-4 py-2 text-sm"
					>
						{book.name}
					</TabsTrigger>
				</TabsList>
				<TabsContent value={book.id} className="mt-0">
					<Tabs defaultValue={defaultTest} className="gap-6">
						<TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-[14px] bg-muted/60 p-1">
							{book.tests.map((test) => (
								<TabsTrigger
									key={test.id}
									value={test.id}
									className="shrink-0 px-3 py-1.5 text-xs sm:text-sm"
								>
									{test.label}
								</TabsTrigger>
							))}
						</TabsList>
						{book.tests.map((test) => {
							const testStats = testStatsMap?.[test.id];

							return (
								<TabsContent
									key={test.id}
									value={test.id}
									className="mt-6 space-y-4"
								>
									{testStats && (
										<div className="flex flex-wrap gap-2">
											<Badge
												variant={
													testStats.published
														? "success"
														: "secondary"
												}
											>
												{testStats.published
													? copy.admin.exams.published
													: copy.admin.exams
															.unpublished}
											</Badge>
											{testStats.published &&
												testStats.publishedAt && (
													<Badge variant="outline">
														{copy.admin.exams.publishedAt(
															testStats.publishedAt,
														)}
													</Badge>
												)}
										</div>
									)}
									<TestPartCards
										book={book}
										test={test}
										parts={parts.filter((p) => p.part <= 4)}
										layout={layout}
										testStats={testStats}
									/>
									<TestPartCards
										book={book}
										test={test}
										parts={parts.filter((p) => p.part >= 5)}
										layout="stack"
										testStats={testStats}
									/>
								</TabsContent>
							);
						})}
					</Tabs>
				</TabsContent>
			</Tabs>
		</div>
	);
}
