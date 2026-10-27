import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AdminEditCatalogLabelsDialog } from "@/components/admin/exams/admin-edit-catalog-labels-dialog";
import { AdminCreatePracticeDialog } from "@/components/admin/practice/admin-create-practice-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { adminSectionTestPath, adminPartPath } from "@/lib/admin/admin-paths";
import { copy } from "@/lib/copy/vi";
import type { AdminTestStats } from "@/lib/admin/content/stats";
import type { PublishSection } from "@/lib/content/publish-test";
import type { BookCatalogEntry } from "@/types/test-data";
import { COMMON_BOOK_ID } from "@/lib/content/catalog-ids";

interface AdminCommonPracticeSectionProps {
	section: PublishSection;
	book: BookCatalogEntry | null;
	testStatsMap: Record<string, AdminTestStats>;
}

export function AdminCommonPracticeSection({
	section,
	book,
	testStatsMap,
}: AdminCommonPracticeSectionProps) {
	const sectionCopy =
		section === "listening" ? copy.admin.listening : copy.admin.reading;

	return (
		<section className="space-y-4">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h2 className="text-lg font-semibold">
						{sectionCopy.commonPractice}
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						{copy.admin.commonPractice.createDescription}
					</p>
				</div>
				<AdminCreatePracticeDialog section={section} />
			</div>

			{!book || book.tests.length === 0 ? (
				<p className="text-sm text-muted-foreground">
					{copy.admin.commonPractice.empty}
				</p>
			) : (
				<div className="grid gap-4 md:grid-cols-2">
					{book.tests.map((test) => {
						const stats = testStatsMap[test.id];
						const sectionPublished =
							section === "listening"
								? stats?.listeningPublished
								: stats?.readingPublished;

						return (
							<Card key={test.id}>
								<CardHeader>
									<div className="mb-2 flex flex-wrap gap-2">
										<Badge
											variant={
												sectionPublished
													? "success"
													: "secondary"
											}
										>
											{sectionPublished
												? copy.admin.exams.published
												: copy.admin.exams.unpublished}
										</Badge>
									</div>
									<CardTitle>{test.label}</CardTitle>
									<CardDescription>{test.id}</CardDescription>
								</CardHeader>
								<CardContent className="flex flex-wrap items-center justify-between gap-4">
									<div className="flex flex-wrap gap-2">
										<AdminEditCatalogLabelsDialog
											bookId={COMMON_BOOK_ID}
											testId={test.id}
											bookName={book.name}
											testLabel={test.label}
											showBookName={false}
										/>
										<Button
											asChild
											variant="secondary"
											size="sm"
										>
											<Link
												href={adminSectionTestPath(
													section,
													COMMON_BOOK_ID,
													test.id,
												)}
											>
												{copy.admin.actions.manage}
												<ArrowRight className="size-4" />
											</Link>
										</Button>
										{stats?.parts[0] && (
											<Button
												asChild
												variant="outline"
												size="sm"
											>
												<Link
													href={adminPartPath(
														COMMON_BOOK_ID,
														test.id,
														section === "listening"
															? 1
															: 5,
														undefined,
														section,
													)}
												>
													Part{" "}
													{section === "listening"
														? 1
														: 5}
												</Link>
											</Button>
										)}
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}
		</section>
	);
}
