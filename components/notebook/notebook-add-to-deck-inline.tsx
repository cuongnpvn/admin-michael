"use client";

import { useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/use-auth";
import { copy } from "@/lib/copy/vi";
import {
	addVocabularyPayloadToUserDeck,
	createDeckAndAddVocabularyPayload,
} from "@/lib/vocabulary/user-deck-actions";
import { useMyVocabularyDecksCache } from "@/lib/vocabulary/use-my-vocabulary-decks-cache";
import type { VocabularyItemPayload } from "@/lib/vocabulary/vocabulary-item-payload";
import { cn } from "@/lib/utils";

const CREATE_OPTION_ID = "__create__";

interface NotebookAddToDeckInlineProps {
	payload: VocabularyItemPayload;
	disabled?: boolean;
}

export function NotebookAddToDeckInline({
	payload,
	disabled = false,
}: NotebookAddToDeckInlineProps) {
	const prefersReducedMotion = useReducedMotion();
	const { user } = useAuth();
	const { decks, error: loadError, loading: isLoadingDecks, prependDeck } =
		useMyVocabularyDecksCache(user?.id);
	const [expanded, setExpanded] = useState(false);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [newDeckName, setNewDeckName] = useState("");
	const [actionError, setActionError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const isCreateSelected = selectedId === CREATE_OPTION_ID;

	useEffect(() => {
		if (!expanded) return;
		setActionError(null);
		setNewDeckName("");
		setSelectedId(decks[0]?.id ?? CREATE_OPTION_ID);
	}, [decks, expanded]);

	useEffect(() => {
		setExpanded(false);
		setActionError(null);
		setNewDeckName("");
		setSelectedId(null);
	}, [payload.term]);

	function handleSubmit() {
		if (!selectedId) return;
		setActionError(null);

		if (isCreateSelected) {
			const trimmed = newDeckName.trim();
			if (!trimmed) {
				setActionError(copy.vocab.manage.errors.nameRequired);
				return;
			}

			startTransition(async () => {
				const result = await createDeckAndAddVocabularyPayload(
					trimmed,
					payload,
				);
				if (!result.ok) {
					setActionError(result.error);
					toast.error(copy.vocab.toast.wordAddToDeckFailed);
					return;
				}
				prependDeck({ id: result.deckId, name: trimmed });
				toast.success(
					result.alreadyExists
						? copy.vocab.quickAdd.alreadyInDeck
						: copy.vocab.toast.wordAddedToDeck,
				);
				setExpanded(false);
			});
			return;
		}

		startTransition(async () => {
			const result = await addVocabularyPayloadToUserDeck(
				selectedId,
				payload,
			);
			if (!result.ok) {
				setActionError(result.error);
				toast.error(copy.vocab.toast.wordAddToDeckFailed);
				return;
			}
			toast.success(
				result.alreadyExists
					? copy.vocab.quickAdd.alreadyInDeck
					: copy.vocab.toast.wordAddedToDeck,
			);
			setExpanded(false);
		});
	}

	const canSubmit =
		!!selectedId &&
		(!isCreateSelected || newDeckName.trim().length > 0) &&
		!isPending &&
		!disabled;

	const expandTransition = prefersReducedMotion
		? { duration: 0 }
		: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const };

	return (
		<div
			className={cn(
				"overflow-hidden rounded-[14px] border transition-calm",
				expanded
					? "border-border bg-background"
					: "border-border bg-background",
			)}
		>
			{expanded ? (
				<button
					type="button"
					disabled={isPending}
					onClick={() => setExpanded(false)}
					aria-label={copy.notebook.closeAddToDeck}
					className="flex h-10 w-full items-center gap-2 px-3 text-left text-sm text-foreground transition-calm hover:bg-muted/40 disabled:opacity-50"
				>
					<ArrowLeft className="size-4 shrink-0" />
				</button>
			) : (
				<button
					type="button"
					disabled={disabled || isPending}
					onClick={() => setExpanded(true)}
					aria-expanded={false}
					className="flex h-10 w-full items-center justify-center gap-2 px-3 text-sm font-medium text-foreground transition-calm hover:bg-muted/40 disabled:pointer-events-none disabled:opacity-50"
				>
					<Plus className="size-4 shrink-0" />
					{copy.vocab.quickAdd.title}
				</button>
			)}

			<AnimatePresence initial={false}>
				{expanded ? (
					<motion.div
						key="deck-panel"
						initial={
							prefersReducedMotion
								? { opacity: 1 }
								: { height: 0, opacity: 0 }
						}
						animate={{ height: "auto", opacity: 1 }}
						exit={
							prefersReducedMotion
								? { opacity: 0 }
								: { height: 0, opacity: 0 }
						}
						transition={expandTransition}
						className="overflow-hidden border-t border-border"
					>
						<div className="space-y-3 p-3">
							{isLoadingDecks ? (
								<p className="text-sm text-muted-foreground">…</p>
							) : loadError ? (
								<p className="text-sm text-destructive">
									{loadError}
								</p>
							) : (
								<ul className="max-h-40 space-y-2 overflow-y-auto pr-0.5">
									{decks.map((deck) => {
										const selected = deck.id === selectedId;
										return (
											<li key={deck.id}>
												<button
													type="button"
													disabled={isPending}
													onClick={() =>
														setSelectedId(deck.id)
													}
													className={cn(
														"flex w-full items-center rounded-[10px] border px-3 py-2 text-left text-sm transition-calm",
														selected
															? "border-primary bg-primary/5 text-foreground"
															: "border-border bg-background text-foreground hover:bg-muted/40",
													)}
												>
													{deck.name}
												</button>
											</li>
										);
									})}

									<li>
										<button
											type="button"
											disabled={isPending}
											onClick={() =>
												setSelectedId(CREATE_OPTION_ID)
											}
											className={cn(
												"flex w-full items-center rounded-[10px] border px-3 py-2 text-left text-sm transition-calm",
												isCreateSelected
													? "border-primary bg-primary/5 text-foreground"
													: "border-border bg-background text-foreground hover:bg-muted/40",
											)}
										>
											{copy.vocab.quickAdd.createDeck}
										</button>
									</li>
								</ul>
							)}

							{isCreateSelected && !isLoadingDecks ? (
								<Input
									id="notebook-inline-deck-name"
									value={newDeckName}
									onChange={(event) =>
										setNewDeckName(event.target.value)
									}
									placeholder={
										copy.vocab.quickAdd.deckNamePlaceholder
									}
									disabled={isPending}
									autoFocus
								/>
							) : null}

							{actionError ? (
								<p
									className="text-sm text-destructive"
									role="alert"
								>
									{actionError}
								</p>
							) : null}

							<Button
								type="button"
								className="w-full"
								disabled={!canSubmit}
								onClick={handleSubmit}
							>
								{copy.vocab.quickAdd.add}
							</Button>
						</div>
					</motion.div>
				) : null}
			</AnimatePresence>
		</div>
	);
}
