"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { setUniversalFreeExplanation } from "@/lib/admin/subscriptions/actions";
import type {
	EntitlementBookGroup,
	UniversalFreeExplanationSlot,
} from "@/lib/admin/subscriptions/types";
import { AdminBookAccessDialog } from "@/components/admin/subscriptions/admin-book-access-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { copy } from "@/lib/copy/vi";
import { cn } from "@/lib/utils";

interface AdminSubscriptionsWorkspaceProps {
	books: EntitlementBookGroup[];
	freeExplanationSlots: UniversalFreeExplanationSlot[];
}

function slotKeyOf(
	slot: Pick<UniversalFreeExplanationSlot, "part" | "slotKey">,
) {
	return `${slot.part}:${slot.slotKey}`;
}

function groupSlotsByPart(slots: UniversalFreeExplanationSlot[]) {
	const byPart = new Map<number, UniversalFreeExplanationSlot[]>();
	for (const slot of slots) {
		const list = byPart.get(slot.part) ?? [];
		list.push(slot);
		byPart.set(slot.part, list);
	}
	return [...byPart.entries()]
		.sort(([a], [b]) => a - b)
		.map(([part, partSlots]) => ({
			part,
			slots: partSlots.sort((a, b) => a.slotKey - b.slotKey),
		}));
}

function countProTests(book: EntitlementBookGroup): number {
	return book.tests.filter((test) => test.accessTier === "pro").length;
}

export function AdminSubscriptionsWorkspace({
	books,
	freeExplanationSlots,
}: AdminSubscriptionsWorkspaceProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [activeBookId, setActiveBookId] = useState<string | null>(null);
	const [slots, setSlots] = useState(freeExplanationSlots);

	useEffect(() => {
		setSlots(freeExplanationSlots);
	}, [freeExplanationSlots]);

	const activeBook =
		books.find((book) => book.bookId === activeBookId) ?? null;
	const parts = useMemo(() => groupSlotsByPart(slots), [slots]);

	function handleFreeExplanationToggle(slot: UniversalFreeExplanationSlot) {
		const nextValue = !slot.freeExplanation;
		const key = slotKeyOf(slot);

		setSlots((current) =>
			current.map((entry) =>
				slotKeyOf(entry) === key
					? { ...entry, freeExplanation: nextValue }
					: entry,
			),
		);

		startTransition(async () => {
			const result = await setUniversalFreeExplanation({
				part: slot.part,
				slotKey: slot.slotKey,
				freeExplanation: nextValue,
			});
			if (!result.ok) {
				setSlots((current) =>
					current.map((entry) =>
						slotKeyOf(entry) === key
							? {
									...entry,
									freeExplanation: slot.freeExplanation,
								}
							: entry,
					),
				);
				window.alert(result.error);
				return;
			}
			router.refresh();
		});
	}

	return (
		<div className="space-y-10">
			<section className="space-y-4">
				<div>
					<h2 className="text-lg font-semibold">
						{copy.admin.subscriptions.testsTitle}
					</h2>
				</div>

				{books.length === 0 ? (
					<p className="rounded-[12px] border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
						{copy.admin.emptyTable}
					</p>
				) : (
					<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
						{books.map((book) => {
							const proCount = countProTests(book);
							return (
								<Card
									key={book.bookId}
									role="button"
									tabIndex={0}
									className="cursor-pointer transition-colors hover:border-foreground/20 hover:bg-muted/20"
									onClick={() => setActiveBookId(book.bookId)}
									onKeyDown={(event) => {
										if (
											event.key === "Enter" ||
											event.key === " "
										) {
											event.preventDefault();
											setActiveBookId(book.bookId);
										}
									}}
								>
									<CardHeader className="pb-3">
										<div className="flex items-start justify-between gap-2">
											<div className="min-w-0">
												<CardTitle className="text-base leading-snug">
													{book.bookName}
												</CardTitle>
												<p className="mt-1 font-mono text-xs text-muted-foreground">
													{book.bookId}
												</p>
											</div>
											<ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
										</div>
									</CardHeader>
									<CardContent className="pt-0">
										<div className="flex flex-wrap gap-2">
											<Badge variant="secondary">
												{copy.admin.subscriptions.testCount(
													book.tests.length,
												)}
											</Badge>
											{proCount > 0 ? (
												<Badge variant="outline">
													{copy.admin.subscriptions.proTestCount(
														proCount,
													)}
												</Badge>
											) : null}
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				)}

				<AdminBookAccessDialog
					book={activeBook}
					open={activeBookId != null}
					onOpenChange={(open) => {
						if (!open) setActiveBookId(null);
					}}
				/>
			</section>

			<section className="space-y-4">
				<div>
					<h2 className="text-lg font-semibold">
						{copy.admin.subscriptions.unitsTitle}
					</h2>
				</div>

				{parts && parts.length > 0 && (
					<div className="space-y-6">
						{parts.map(({ part, slots }) => (
							<div key={part} className="space-y-3">
								<div className="flex items-center gap-2">
									<h5 className="font-medium">
										{copy.common.part} {part}
									</h5>
								</div>
								<div
									className="grid gap-2"
									style={{
										gridTemplateColumns:
											"repeat(10, minmax(0, 1fr))",
									}}
								>
									{slots.map((slot) => {
										const active = slot.freeExplanation;
										return (
											<button
												key={slotKeyOf(slot)}
												type="button"
												disabled={isPending}
												aria-pressed={active}
												title={
													active
														? copy.admin
																.subscriptions
																.slotActive
														: copy.admin
																.subscriptions
																.slotInactive
												}
												onClick={() =>
													handleFreeExplanationToggle(
														slot,
													)
												}
												className={cn(
													"w-full rounded-[10px] border px-1 py-2 text-center text-xs font-medium transition-colors disabled:opacity-60 sm:text-sm",
													active
														? "border-primary bg-primary text-primary-foreground"
														: "border-border bg-background text-muted-foreground hover:bg-muted/50",
												)}
											>
												{slot.label}
											</button>
										);
									})}
								</div>
							</div>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
