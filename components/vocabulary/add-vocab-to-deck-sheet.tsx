"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth/use-auth";
import type { ContentVocabularyWord } from "@/lib/content/content-vocabulary";
import { copy } from "@/lib/copy/vi";
import type { VocabularySummaryItem } from "@/lib/vocabulary/load-deck-vocabulary";
import {
	addVocabularyPayloadToUserDeck,
	createDeckAndAddVocabularyPayload,
} from "@/lib/vocabulary/user-deck-actions";
import { useMyVocabularyDecksCache } from "@/lib/vocabulary/use-my-vocabulary-decks-cache";
import {
	vocabularySummaryToPayload,
	type VocabularyItemPayload,
} from "@/lib/vocabulary/vocabulary-item-payload";
import { cn } from "@/lib/utils";

const CREATE_OPTION_ID = "__create__";

interface AddVocabToDeckSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	word?: ContentVocabularyWord | null;
	summaryItem?: VocabularySummaryItem | null;
	payload?: VocabularyItemPayload | null;
}

export function AddVocabToDeckSheet({
	open,
	onOpenChange,
	word = null,
	summaryItem = null,
	payload = null,
}: AddVocabToDeckSheetProps) {
	const { user } = useAuth();
	const { decks, error: loadError, loading: isLoadingDecks, prependDeck } =
		useMyVocabularyDecksCache(user?.id);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [newDeckName, setNewDeckName] = useState("");
	const [actionError, setActionError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const isCreateSelected = selectedId === CREATE_OPTION_ID;
	const displayTerm =
		payload?.term ?? word?.term ?? summaryItem?.term ?? null;

	function resolvePayload(): VocabularyItemPayload | null {
		if (payload) return payload;
		if (summaryItem) return vocabularySummaryToPayload(summaryItem);
		if (word) {
			const wordType = word.wordType.trim();
			return {
				term: word.term,
				lemma: null,
				meaningVi: word.meaningVi.trim() || null,
				definitionEn: word.definitionEn.trim() || null,
				ipaUs: word.ipa[0]?.trim() || null,
				ipaUk: word.ipa[1]?.trim() || null,
				wordTypes: wordType ? [wordType] : [],
				synonyms: [],
				collocations: [],
				example: word.example.trim() || null,
				level: word.level,
			};
		}
		return null;
	}

	useEffect(() => {
		if (!open || !displayTerm) return;

		setActionError(null);
		setNewDeckName("");
		setSelectedId(decks[0]?.id ?? CREATE_OPTION_ID);
	}, [decks, displayTerm, open]);

	function handleSubmit() {
		const payload = resolvePayload();
		if (!payload || !selectedId) return;
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
				onOpenChange(false);
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
			onOpenChange(false);
		});
	}

	const canSubmit =
		!!displayTerm &&
		!!selectedId &&
		(!isCreateSelected || newDeckName.trim().length > 0);

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className="flex flex-col gap-0 overflow-y-auto"
			>
				<SheetHeader className="pr-8 text-left">
					<SheetTitle>{copy.vocab.quickAdd.title}</SheetTitle>
					{displayTerm ? (
						<p className="text-sm font-medium text-foreground">
							{displayTerm}
						</p>
					) : null}
				</SheetHeader>

				<div className="mt-6 flex flex-1 flex-col gap-4">
					{isLoadingDecks ? (
						<p className="text-sm text-muted-foreground">…</p>
					) : loadError ? (
						<p className="text-sm text-destructive">{loadError}</p>
					) : (
						<ul className="space-y-2">
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
						<div className="space-y-2">
							<Input
								id="quick-add-deck-name"
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
						</div>
					) : null}

					<Button
						type="button"
						disabled={isPending || !canSubmit}
						onClick={handleSubmit}
						className="w-full"
					>
						{copy.vocab.quickAdd.add}
					</Button>

					{actionError ? (
						<p className="text-sm text-destructive">
							{actionError}
						</p>
					) : null}
				</div>
			</SheetContent>
		</Sheet>
	);
}
