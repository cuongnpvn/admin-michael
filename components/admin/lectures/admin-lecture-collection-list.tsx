"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { CreateLectureCollectionDialog } from "@/components/admin/lectures/create-lecture-collection-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteLectureCollection } from "@/lib/admin/lectures/collection-actions";
import { reindexPublishedLectureCatalog } from "@/lib/admin/lectures/reindex-actions";
import {
	adminLectureChatPath,
	adminLectureCollectionPath,
} from "@/lib/lectures/paths";
import type { LectureCollectionSummary } from "@/lib/lectures/types";
import { copy } from "@/lib/copy/vi";

export function AdminLectureCollectionList({
	collections,
}: {
	collections: LectureCollectionSummary[];
}) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	function handleDelete(collectionId: string) {
		if (!window.confirm(copy.admin.lectures.deleteCollectionConfirm))
			return;
		startTransition(async () => {
			const result = await deleteLectureCollection(collectionId);
			if (!result.ok) {
				window.alert(result.error);
				return;
			}
			router.refresh();
		});
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap justify-end gap-2">
				<Button asChild variant="outline">
					<Link href={adminLectureChatPath()}>
						{copy.admin.lectures.openChat}
					</Link>
				</Button>
				<Button
					type="button"
					variant="outline"
					disabled={isPending}
					title={copy.admin.lectures.reindexCatalogHint}
					onClick={() => {
						startTransition(async () => {
							const result =
								await reindexPublishedLectureCatalog();
							if (!result.ok) {
								window.alert(result.error);
								return;
							}
							window.alert(
								copy.admin.lectures.toast.reindexed(
									result.indexed,
								),
							);
						});
					}}
				>
					{copy.admin.lectures.reindexCatalog}
				</Button>
				<CreateLectureCollectionDialog />
			</div>
			{collections.length === 0 ? (
				<p className="rounded-[12px] border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
					{copy.admin.lectures.emptyCollections}
				</p>
			) : (
				<div className="space-y-4">
					{collections.map((collection) => (
						<Card key={collection.id}>
							<CardHeader className="pb-3">
								<div className="flex items-start justify-between gap-2">
									<CardTitle className="text-base">
										<Link
											href={adminLectureCollectionPath(
												collection.id,
											)}
											className="hover:text-primary"
										>
											{collection.title}
										</Link>
									</CardTitle>
									<Badge
										variant={
											collection.published
												? "default"
												: "secondary"
										}
									>
										{collection.published
											? copy.admin.lectures.published
											: copy.admin.lectures.draft}
									</Badge>
								</div>
							</CardHeader>
							<CardContent className="space-y-3 text-sm text-muted-foreground">
								<p>{collection.excerpt || collection.slug}</p>
								<p>
									{copy.admin.lectures.lecturesCount(
										collection.startedCount,
									)}
								</p>
								<div className="flex gap-2">
									<Button asChild size="sm">
										<Link
											href={adminLectureCollectionPath(
												collection.id,
											)}
										>
											{copy.admin.overview.manage}
										</Link>
									</Button>
									<Button
										type="button"
										size="sm"
										variant="outline"
										disabled={isPending}
										onClick={() =>
											handleDelete(collection.id)
										}
									>
										{copy.admin.lectures.delete}
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
