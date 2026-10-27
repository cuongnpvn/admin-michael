"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
	deleteVocabularyItem,
	updateVocabularyItem,
} from "@/lib/admin/vocabulary/actions";
import { copy } from "@/lib/copy/vi";
import type { LoadedVocabularyItem } from "@/lib/vocabulary/load-deck-vocabulary";
import { AdminVocabularyItemImageField } from "@/components/admin/vocabulary/admin-vocabulary-item-image-field";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CefrLevelSelect } from "@/components/vocabulary/cefr-level-select";
import type { VocabularyCefrLevel } from "@/lib/vocabulary/cefr-level";
import { cn } from "@/lib/utils";

interface VocabularyItemDraft {
	term: string;
	lemma: string;
	meaningVi: string;
	definitionEn: string;
	ipaUs: string;
	ipaUk: string;
	wordTypes: string;
	synonyms: string;
	collocations: string;
	example: string;
	level: VocabularyCefrLevel | "";
}

interface AdminVocabularyDetailDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	item: LoadedVocabularyItem | null;
	deckId: string;
}

function linesToArray(value: string): string[] {
	return value
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);
}

function commaListToArray(value: string): string[] {
	return value
		.split(",")
		.map((part) => part.trim())
		.filter(Boolean);
}

function arrayToLines(values: string[]): string {
	return values.join("\n");
}

function arrayToCommaList(values: string[]): string {
	return values.join(", ");
}

function draftFromItem(item: LoadedVocabularyItem): VocabularyItemDraft {
	return {
		term: item.term,
		lemma: item.lemma ?? "",
		meaningVi: item.meaningVi ?? "",
		definitionEn: item.definitionEn ?? "",
		ipaUs: item.ipaUs ?? "",
		ipaUk: item.ipaUk ?? "",
		wordTypes: arrayToCommaList(item.wordTypes),
		synonyms: arrayToLines(item.synonyms),
		collocations: arrayToLines(item.collocations),
		example: item.example ?? "",
		level: item.level ?? "",
	};
}

export function AdminVocabularyDetailDialog({
	open,
	onOpenChange,
	item,
	deckId,
}: AdminVocabularyDetailDialogProps) {
	const router = useRouter();
	const [draft, setDraft] = useState<VocabularyItemDraft | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		if (item) {
			setDraft(draftFromItem(item));
			setError(null);
		}
	}, [item]);

	if (!item || !draft) return null;

	function patchDraft(patch: Partial<VocabularyItemDraft>) {
		setDraft((current) => (current ? { ...current, ...patch } : current));
	}

	function handleSave() {
		if (!draft || !item) return;
		setError(null);

		startTransition(async () => {
			const result = await updateVocabularyItem(item.id, deckId, {
				term: draft.term,
				lemma: draft.lemma.trim() || null,
				meaningVi: draft.meaningVi.trim() || null,
				definitionEn: draft.definitionEn.trim() || null,
				ipaUs: draft.ipaUs.trim() || null,
				ipaUk: draft.ipaUk.trim() || null,
				wordTypes: commaListToArray(draft.wordTypes),
				synonyms: linesToArray(draft.synonyms),
				collocations: linesToArray(draft.collocations),
				example: draft.example.trim() || null,
				level: draft.level || null,
			});

			if (!result.ok) {
				setError(result.error);
				return;
			}

			router.refresh();
			onOpenChange(false);
		});
	}

	function handleDelete() {
		if (!item) return;
		setError(null);

		startTransition(async () => {
			const result = await deleteVocabularyItem(item.id, deckId);
			if (!result.ok) {
				setError(result.error);
				return;
			}

			router.refresh();
			onOpenChange(false);
		});
	}

	const detailCopy = copy.admin.vocabulary.detail;
	const textareaClass = cn(
		"flex w-full rounded-[10px] border border-input bg-background px-3 py-2 text-sm",
		"placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
				<DialogHeader className="border-b border-border px-6 py-4">
					<DialogTitle>{item.term}</DialogTitle>
				</DialogHeader>

				<div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
					<div className="grid gap-6 md:grid-cols-[minmax(240px,0.38fr)_minmax(0,1fr)] md:items-stretch">
						<AdminVocabularyItemImageField
							item={item}
							deckId={deckId}
							disabled={isPending}
							onError={setError}
							className="md:h-full"
						/>

						<div className="grid gap-3 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="vocab-term">
									{detailCopy.fields.term}
								</Label>
								<Input
									id="vocab-term"
									value={draft.term}
									onChange={(event) =>
										patchDraft({ term: event.target.value })
									}
									disabled={isPending}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="vocab-lemma">
									{detailCopy.fields.lemma}
								</Label>
								<Input
									id="vocab-lemma"
									value={draft.lemma}
									onChange={(event) =>
										patchDraft({ lemma: event.target.value })
									}
									disabled={isPending}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="vocab-ipa-us">
									{detailCopy.fields.ipaUs}
								</Label>
								<Input
									id="vocab-ipa-us"
									value={draft.ipaUs}
									onChange={(event) =>
										patchDraft({
											ipaUs: event.target.value,
										})
									}
									disabled={isPending}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="vocab-ipa-uk">
									{detailCopy.fields.ipaUk}
								</Label>
								<Input
									id="vocab-ipa-uk"
									value={draft.ipaUk}
									onChange={(event) =>
										patchDraft({
											ipaUk: event.target.value,
										})
									}
									disabled={isPending}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="vocab-meaning">
									{detailCopy.fields.meaningVi}
								</Label>
								<Input
									id="vocab-meaning"
									value={draft.meaningVi}
									onChange={(event) =>
										patchDraft({
											meaningVi: event.target.value,
										})
									}
									disabled={isPending}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="vocab-level">
									{detailCopy.fields.level}
								</Label>
								<CefrLevelSelect
									id="vocab-level"
									value={draft.level}
									onChange={(level) => patchDraft({ level })}
									disabled={isPending}
									noneLabel={detailCopy.fields.levelOptional}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="vocab-types">
									{detailCopy.fields.wordTypes}
								</Label>
								<Input
									id="vocab-types"
									value={draft.wordTypes}
									onChange={(event) =>
										patchDraft({
											wordTypes: event.target.value,
										})
									}
									disabled={isPending}
								/>
							</div>
							<div className="space-y-2 sm:col-span-2">
								<Label htmlFor="vocab-definition">
									{detailCopy.fields.definitionEn}
								</Label>
								<textarea
									id="vocab-definition"
									value={draft.definitionEn}
									onChange={(event) =>
										patchDraft({
											definitionEn: event.target.value,
										})
									}
									disabled={isPending}
									rows={2}
									className={textareaClass}
								/>
							</div>
							<div className="space-y-2 sm:col-span-2">
								<Label htmlFor="vocab-example">
									{detailCopy.fields.example}
								</Label>
								<textarea
									id="vocab-example"
									value={draft.example}
									onChange={(event) =>
										patchDraft({ example: event.target.value })
									}
									disabled={isPending}
									rows={2}
									className={textareaClass}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="vocab-synonyms">
									{detailCopy.fields.synonyms}
								</Label>
								<textarea
									id="vocab-synonyms"
									value={draft.synonyms}
									onChange={(event) =>
										patchDraft({ synonyms: event.target.value })
									}
									disabled={isPending}
									rows={3}
									className={textareaClass}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="vocab-collocations">
									{detailCopy.fields.collocations}
								</Label>
								<textarea
									id="vocab-collocations"
									value={draft.collocations}
									onChange={(event) =>
										patchDraft({
											collocations: event.target.value,
										})
									}
									disabled={isPending}
									rows={3}
									className={textareaClass}
								/>
							</div>
						</div>
					</div>
				</div>

				{error ? (
					<p className="px-6 pb-2 text-sm text-destructive">
						{error}
					</p>
				) : null}

				<DialogFooter className="border-t border-border px-6 py-4 sm:justify-between">
					<Button
						type="button"
						variant="destructive"
						disabled={isPending}
						onClick={handleDelete}
					>
						{copy.admin.vocabManage.deleteWord}
					</Button>
					<div className="flex gap-2">
						<Button
							type="button"
							variant="outline"
							disabled={isPending}
							onClick={() => onOpenChange(false)}
						>
							{copy.admin.cms.cancel}
						</Button>
						<Button
							type="button"
							disabled={isPending}
							onClick={handleSave}
						>
							{copy.admin.cms.saveChanges}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
