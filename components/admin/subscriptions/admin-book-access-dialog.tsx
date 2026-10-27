"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateAdminTestAccessTier } from "@/lib/admin/content/update-catalog-labels";
import type { EntitlementBookGroup } from "@/lib/admin/subscriptions/types";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { copy } from "@/lib/copy/vi";

interface AdminBookAccessDialogProps {
	book: EntitlementBookGroup | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function AdminBookAccessDialog({
	book,
	open,
	onOpenChange,
}: AdminBookAccessDialogProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	function handleAccessTierChange(testId: string, value: string) {
		if (!book) return;
		if (value !== "free" && value !== "pro") return;
		startTransition(async () => {
			const result = await updateAdminTestAccessTier(
				book.bookId,
				testId,
				value,
			);
			if (!result.ok) {
				window.alert(result.error);
				return;
			}
			router.refresh();
		});
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[85vh] max-w-2xl flex-col gap-0 overflow-hidden p-0">
				<DialogHeader className="shrink-0 border-b border-border px-6 py-4">
					<DialogTitle>
						{book?.bookName ??
							copy.admin.subscriptions.selectBookTitle}
					</DialogTitle>
				</DialogHeader>

				<div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
					{!book || book.tests.length === 0 ? (
						<p className="py-8 text-center text-sm text-muted-foreground">
							{copy.admin.emptyTable}
						</p>
					) : (
						<div className="overflow-hidden rounded-[12px]">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>
											{
												copy.admin.subscriptions.columns
													.test
											}
										</TableHead>
										<TableHead>
											{
												copy.admin.subscriptions.columns
													.testId
											}
										</TableHead>
										<TableHead>
											{
												copy.admin.subscriptions.columns
													.accessTier
											}
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{book.tests.map((test) => (
										<TableRow key={test.testId}>
											<TableCell className="font-medium">
												{test.testLabel}
											</TableCell>
											<TableCell className="font-mono text-xs text-muted-foreground">
												{test.testId}
											</TableCell>
											<TableCell>
												<Select
													value={test.accessTier}
													onValueChange={(value) =>
														handleAccessTierChange(
															test.testId,
															value,
														)
													}
													disabled={isPending}
												>
													<SelectTrigger className="h-9 w-[140px]">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="free">
															{
																copy.admin.exams
																	.accessTier
																	.free
															}
														</SelectItem>
														<SelectItem value="pro">
															{
																copy.admin.exams
																	.accessTier
																	.pro
															}
														</SelectItem>
													</SelectContent>
												</Select>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
