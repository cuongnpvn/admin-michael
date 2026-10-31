"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { AdminCheckAnswerKeyDialog } from "@/components/admin/exams/admin-check-answer-key-dialog";
import { ImportExamTagsDialog } from "@/components/admin/import/import-exam-tags-dialog";
import { AdminCreateExamTestDialog } from "@/components/admin/exams/admin-create-exam-test-dialog";
import { AdminDeleteExamTestDialog } from "@/components/admin/exams/admin-delete-exam-test-dialog";
import { AdminEditCatalogLabelsDialog } from "@/components/admin/exams/admin-edit-catalog-labels-dialog";
import { AdminUpdateExamModuleDialog } from "@/components/admin/exams/admin-update-exam-module-dialog";
import { AlignListeningTestDictationButton } from "@/components/admin/exams/align-listening-test-dictation-button";
import {
	publishAdminExam,
	unpublishAdminExam,
} from "@/lib/admin/content/part-editor-actions";
import { examPartModuleForPart } from "@/lib/admin/instructions/exam-part-modules";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { copy } from "@/lib/copy/vi";
import {
	ADMIN_ENTRANCE_TEST_PATH,
	adminPartPath,
} from "@/lib/admin/admin-paths";
import { isEntranceTestBook } from "@/lib/content/catalog-ids";
import type { AdminTestStats } from "@/lib/admin/content/stats";
import type { PublishSection } from "@/lib/content/validate-section-counts";
import { listeningParts, readingParts } from "@/lib/mock";
import { cn } from "@/lib/utils";
import type { BookCatalogEntry, TestCatalogEntry } from "@/types/test-data";
import type { ListeningPart, ReadingPart } from "@/types/ui";

function PartSection({
	title,
	book,
	test,
	parts,
	section,
	testStats,
}: {
	title: string;
	book: BookCatalogEntry;
	test: TestCatalogEntry;
	parts: (ListeningPart | ReadingPart)[];
	section: PublishSection;
	testStats?: AdminTestStats;
}) {
	return (
		<section className="space-y-4">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<h2 className="text-lg font-semibold">{title}</h2>
				<div className="flex flex-wrap items-center gap-2">
					{section === "listening" ? (
						<>
							<AlignListeningTestDictationButton
								bookId={book.id}
								testId={test.id}
							/>
							<AdminUpdateExamModuleDialog
								bookId={book.id}
								testId={test.id}
								testLabel={test.label}
								moduleId="listening-parts-1-2"
								label={
									copy.admin.exams.updateModule
										.editModuleListeningParts12
								}
							/>
						</>
					) : null}
				</div>
			</div>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{parts.map((part) => {
					const partStat = testStats?.parts.find(
						(entry) => Number(entry.part) === part.part,
					);
					const complete =
						partStat &&
						partStat.targetCount > 0 &&
						partStat.draftCount === partStat.targetCount;
					const partModule = examPartModuleForPart(part.part);
					const showCompactEdit =
						partModule &&
						(section === "reading" ||
							(section === "listening" &&
								(part.part === 3 || part.part === 4)));

					return (
						<Card key={part.part}>
							<CardHeader className="pb-3">
								<div className="flex items-start justify-between gap-2">
									<div className="min-w-0 flex-1">
										<div className="mb-2 flex flex-wrap items-center gap-2">
											<Badge>
												{copy.common.part} {part.part}
											</Badge>
											{partStat && (
												<Badge
													variant={
														complete
															? "success"
															: "secondary"
													}
												>
													{copy.admin.exams.draftCount(
														partStat.draftCount,
														partStat.targetCount,
													)}
												</Badge>
											)}
										</div>
										<CardTitle className="text-base leading-snug">
											{part.title}
										</CardTitle>
									</div>
									{showCompactEdit && partModule ? (
										<div className="flex shrink-0 items-center justify-end">
											<AdminUpdateExamModuleDialog
												bookId={book.id}
												testId={test.id}
												testLabel={test.label}
												moduleId={partModule.id}
												compact
											/>
										</div>
									) : null}
								</div>
							</CardHeader>
							<CardContent className="pt-0">
								<Button
									asChild
									variant="secondary"
									size="sm"
									className="w-full"
								>
									<Link
										href={adminPartPath(
											book.id,
											test.id,
											part.part,
											undefined,
											section,
										)}
									>
										{copy.admin.actions.manage}
										<ArrowRight className="size-4" />
									</Link>
								</Button>
							</CardContent>
						</Card>
					);
				})}
			</div>
		</section>
	);
}

interface AdminTestOverviewProps {
	book: BookCatalogEntry;
	test: TestCatalogEntry;
	testTitle: string;
	testStats?: AdminTestStats;
	/** Hide back link when overview is embedded in the exams catalog tabs. */
	showBackLink?: boolean;
}

export function AdminTestOverview({
	book,
	test,
	testTitle,
	testStats,
	showBackLink = true,
}: AdminTestOverviewProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const isPublished = testStats?.published ?? false;
	const publishedAt = testStats?.publishedAt;
	const accessTier =
		testStats?.accessTier ?? test.accessTier ?? "free";

	function handlePublish() {
		startTransition(async () => {
			const result = await publishAdminExam(book.id, test.id);
			if (result.ok) {
				toast.success(copy.admin.exams.toast.published);
				router.refresh();
				return;
			}
			if (result.issues?.length) {
				toast.error(copy.admin.exams.validationTitle, {
					description: result.issues
						.map((entry) => entry.message)
						.join("\n"),
				});
				return;
			}
			toast.error(result.error || copy.admin.exams.publishFailed);
		});
	}

	function handleUnpublish() {
		startTransition(async () => {
			const result = await unpublishAdminExam(book.id, test.id);
			if (result.ok) {
				toast.success(copy.admin.exams.toast.unpublished);
				router.refresh();
				return;
			}
			toast.error(result.error || copy.admin.exams.unpublishFailed);
		});
	}

	return (
		<div className="space-y-8">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1">
					<h1 className="text-2xl font-semibold tracking-tight">
						{testTitle}
					</h1>
					{testStats && (
						<p
							className={cn(
								"text-sm",
								isPublished
									? "font-medium text-emerald-700 dark:text-emerald-400"
									: "text-muted-foreground",
							)}
						>
							{isPublished
								? publishedAt
									? copy.admin.exams.publishedAt(publishedAt)
									: copy.admin.exams.published
								: copy.admin.exams.examNotReady}
						</p>
					)}
				</div>
				<div className="flex flex-wrap items-center gap-2">
					{showBackLink && (
						<Button asChild variant="outline">
							<Link
								href={
									isEntranceTestBook(book.id)
										? ADMIN_ENTRANCE_TEST_PATH
										: "/exams"
								}
							>
								{isEntranceTestBook(book.id)
									? copy.admin.nav.entranceTest
									: copy.admin.exams.breadcrumbExams}
							</Link>
						</Button>
					)}
					<ImportExamTagsDialog
						bookId={book.id}
						testId={test.id}
						disabled={isPending}
					/>
					<AdminCheckAnswerKeyDialog
						bookId={book.id}
						testId={test.id}
					/>
					<AdminEditCatalogLabelsDialog
						bookId={book.id}
						testId={test.id}
						bookName={book.name}
						testLabel={test.label}
						accessTier={accessTier}
					/>
					<AdminCreateExamTestDialog
						books={[book]}
						existingTest={{
							bookId: book.id,
							testId: test.id,
							testLabel: test.label,
							bookName: book.name,
						}}
					/>
					{isPublished ? (
						<Button
							variant="outline"
							disabled={isPending}
							onClick={handleUnpublish}
						>
							{copy.admin.exams.unpublishTest}
						</Button>
					) : (
						<Button disabled={isPending} onClick={handlePublish}>
							{copy.admin.exams.publishTest}
						</Button>
					)}
					<AdminDeleteExamTestDialog
						bookId={book.id}
						testId={test.id}
						testLabel={test.label}
					/>
				</div>
			</div>

			<PartSection
				title={copy.admin.exams.listeningSection}
				book={book}
				test={test}
				parts={listeningParts}
				section="listening"
				testStats={testStats}
			/>
			<PartSection
				title={copy.admin.exams.readingSection}
				book={book}
				test={test}
				parts={readingParts}
				section="reading"
				testStats={testStats}
			/>
		</div>
	);
}
