"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { CreateNotebookDialog } from "@/components/notebook/create-notebook-dialog";
import { NotebookDrawerNoteList } from "@/components/notebook/notebook-drawer-note-list";
import { NotebookMotionDrawer } from "@/components/notebook/notebook-motion-drawer";
import { NotebookNoteEditor } from "@/components/notebook/notebook-note-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { copy } from "@/lib/copy/vi";
import {
	addNotebookNote,
	fetchNotebookWordNotes,
	fetchUserNotebooksList,
	updateNotebookNote,
} from "@/lib/notebook/actions";
import { isNoteBodyEmpty } from "@/lib/notebook/note-body";
import { formatNotebookSourceReference } from "@/lib/notebook/capture-source";
import type { NotebookNoteTagId } from "@/lib/notebook/tags";
import type {
	NotebookListItem,
	NotebookNoteItem,
	NotebookNoteSource,
} from "@/lib/notebook/types";

export const ADD_NEW_NOTEBOOK_VALUE = "__add_new__";

export type NotebookDrawerMode =
	| {
			kind: "add";
			word: string;
			source: NotebookNoteSource;
			body?: string;
			tags?: NotebookNoteTagId[];
	  }
	| {
			kind: "edit";
			noteId: string;
			word: string;
			body: string;
			tags: NotebookNoteTagId[];
			source: NotebookNoteSource;
			notebookId: string;
			notebookName: string;
	  };

interface NotebookEntryDrawerProps {
	open: boolean;
	mode: NotebookDrawerMode | null;
	onOpenChange: (open: boolean) => void;
	onSaved?: () => void;
}

function pickDefaultNotebookId(notebooks: NotebookListItem[]): string | null {
	const defaultNotebook = notebooks.find((notebook) => notebook.isDefault);
	return defaultNotebook?.id ?? notebooks[0]?.id ?? null;
}

export function NotebookEntryDrawer({
	open,
	mode,
	onOpenChange,
	onSaved,
}: NotebookEntryDrawerProps) {
	const router = useRouter();
	const titleId = useId();
	const [notebooks, setNotebooks] = useState<NotebookListItem[]>([]);
	const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(
		null,
	);
	const [createOpen, setCreateOpen] = useState(false);
	const [isLoadingNotebooks, setIsLoadingNotebooks] = useState(false);
	const [word, setWord] = useState("");
	const [body, setBody] = useState("");
	const [tags, setTags] = useState<NotebookNoteTagId[]>([]);
	const [previousNotes, setPreviousNotes] = useState<NotebookNoteItem[]>([]);
	const [isLoadingNotes, setIsLoadingNotes] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [isTermEditing, setIsTermEditing] = useState(false);

	const refreshWordNotes = useCallback(
		async (notebookId: string, term: string) => {
			const trimmedWord = term.trim();
			if (!notebookId || !trimmedWord) {
				setPreviousNotes([]);
				return;
			}

			setIsLoadingNotes(true);
			const result = await fetchNotebookWordNotes(notebookId, trimmedWord);
			setPreviousNotes(result.ok ? result.notes : []);
			setIsLoadingNotes(false);
		},
		[],
	);

	useEffect(() => {
		if (!open) {
			setNotebooks([]);
			setSelectedNotebookId(null);
			setCreateOpen(false);
			setIsLoadingNotebooks(false);
			setWord("");
			setBody("");
			setTags([]);
			setPreviousNotes([]);
			setIsLoadingNotes(false);
			setIsTermEditing(false);
		}
	}, [open]);

	useEffect(() => {
		if (!open || !mode) {
			return;
		}

		const currentMode = mode;
		let cancelled = false;

		async function loadNotebooks() {
			setIsLoadingNotebooks(true);
			setError(null);

			const result = await fetchUserNotebooksList();
			if (cancelled) return;

			if (!result.ok) {
				setError(result.error);
				setIsLoadingNotebooks(false);
				return;
			}

			setNotebooks(result.notebooks);

			if (currentMode.kind === "edit") {
				setSelectedNotebookId(currentMode.notebookId);
			} else {
				setSelectedNotebookId(pickDefaultNotebookId(result.notebooks));
			}

			setIsLoadingNotebooks(false);
		}

		void loadNotebooks();

		return () => {
			cancelled = true;
		};
	}, [mode, open]);

	useEffect(() => {
		if (!mode) return;

		setWord(mode.word);
		setBody(
			mode.kind === "edit"
				? mode.body
				: mode.kind === "add"
					? (mode.body ?? "")
					: "",
		);
		setTags(
			mode.kind === "edit"
				? mode.tags
				: mode.kind === "add"
					? (mode.tags ?? [])
					: [],
		);
		setIsTermEditing(false);
		setError(null);
	}, [mode]);

	useEffect(() => {
		if (!open || !selectedNotebookId || isLoadingNotebooks) {
			return;
		}

		void refreshWordNotes(selectedNotebookId, word);
	}, [isLoadingNotebooks, open, refreshWordNotes, selectedNotebookId, word]);

	const sourceReference = mode
		? formatNotebookSourceReference(mode.source)
		: null;

	const isNoteEdit = mode?.kind === "edit";

	const activeNoteId =
		isNoteEdit && mode?.kind === "edit" ? mode.noteId : undefined;

	const showPreviousNotes = isLoadingNotes || previousNotes.length > 0;

	async function handleSave() {
		if (!mode || !selectedNotebookId) return;

		if (isNoteBodyEmpty(body)) {
			setError(copy.notebook.errors.noteRequired);
			return;
		}

		if (!word.trim()) {
			setError(copy.notebook.errors.wordRequired);
			return;
		}

		setIsSaving(true);
		setError(null);

		try {
			if (mode.kind === "add") {
				const result = await addNotebookNote({
					notebookId: selectedNotebookId,
					word,
					body,
					tags,
					source: mode.source,
				});
				if (!result.ok) {
					setError(result.error);
					return;
				}
			} else {
				const result = await updateNotebookNote({
					noteId: mode.noteId,
					body,
					tags,
				});
				if (!result.ok) {
					setError(result.error);
					return;
				}
			}

			toast.success(copy.notebook.saved);
			onOpenChange(false);
			onSaved?.();
			router.refresh();
		} finally {
			setIsSaving(false);
		}
	}

	function handleNotebookChange(value: string) {
		if (value === ADD_NEW_NOTEBOOK_VALUE) {
			setCreateOpen(true);
			return;
		}

		setSelectedNotebookId(value);
	}

	function handleCreateDialogChange(nextOpen: boolean) {
		setCreateOpen(nextOpen);
	}

	return (
		<>
			<CreateNotebookDialog
				open={createOpen}
				onOpenChange={handleCreateDialogChange}
				onCreated={(created) => {
					const nextNotebook: NotebookListItem = {
						id: created.id,
						name: created.name,
						isDefault: notebooks.length === 0,
					};

					setNotebooks((current) => [...current, nextNotebook]);
					setSelectedNotebookId(created.id);
					setCreateOpen(false);
				}}
			/>

			<NotebookMotionDrawer
				open={open}
				onOpenChange={onOpenChange}
				ariaLabelledBy={titleId}
			>
				<div className="flex min-h-0 flex-1 flex-col">
					<header className="shrink-0 space-y-4 border-b border-border px-6 pb-4 pt-6 text-left">
						<div className="flex items-start justify-between gap-2">
							<div className="min-w-0 flex-1">
								<Input
									id={titleId}
									value={word}
									onChange={(event) => {
										setWord(event.target.value);
									}}
									disabled={
										!isTermEditing ||
										isSaving ||
										isLoadingNotebooks
									}
									placeholder={copy.notebook.termPlaceholder}
									aria-label={copy.notebook.wordLabel}
									className="h-auto w-full border-0 bg-transparent px-0 py-0 text-lg font-semibold shadow-none focus-visible:ring-0 disabled:cursor-default disabled:opacity-100"
								/>
								{sourceReference ? (
									<p className="mt-1 text-xs text-muted-foreground">
										{sourceReference}
									</p>
								) : null}
							</div>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="size-8 shrink-0 px-0"
								disabled={isSaving || isLoadingNotebooks}
								aria-pressed={isTermEditing}
								aria-label={copy.notebook.editTerm}
								onClick={() => {
									setIsTermEditing((current) => {
										const next = !current;
										if (next) {
											requestAnimationFrame(() => {
												document
													.getElementById(titleId)
													?.focus();
											});
										}
										return next;
									});
								}}
							>
								<Pencil className="size-4" />
							</Button>
						</div>

						<div className="space-y-2">
							<Label htmlFor="notebook-select">
								{copy.notebook.notebookLabel}
							</Label>
							<Select
								value={selectedNotebookId ?? undefined}
								onValueChange={handleNotebookChange}
								disabled={
									isNoteEdit || isSaving || isLoadingNotebooks
								}
							>
								<SelectTrigger id="notebook-select">
									<SelectValue
										placeholder={
											copy.notebook
												.selectNotebookPlaceholder
										}
									/>
								</SelectTrigger>
								<SelectContent>
									{notebooks.map((notebook) => (
										<SelectItem
											key={notebook.id}
											value={notebook.id}
										>
											{notebook.name}
										</SelectItem>
									))}
									{!isNoteEdit ? (
										<SelectItem
											value={ADD_NEW_NOTEBOOK_VALUE}
										>
											{copy.notebook.addNewNotebook}
										</SelectItem>
									) : null}
								</SelectContent>
							</Select>
						</div>
					</header>

					<div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
						{isLoadingNotebooks ? (
							<p className="text-sm text-muted-foreground">
								{copy.notebook.loading}
							</p>
						) : (
							<div className="space-y-4">
								<div className="space-y-4">
									<Label htmlFor="notebook-body">
										{copy.notebook.noteLabel}
									</Label>
									<NotebookNoteEditor
										className="mt-1"
										id="notebook-body"
										body={body}
										tags={tags}
										onBodyChange={setBody}
										onTagsChange={setTags}
										disabled={isSaving}
									/>
								</div>

								{showPreviousNotes ? (
									<NotebookDrawerNoteList
										notes={previousNotes}
										activeNoteId={activeNoteId}
										isLoading={isLoadingNotes}
									/>
								) : null}

								{error ? (
									<p
										className="text-sm text-destructive"
										role="alert"
									>
										{error}
									</p>
								) : null}
							</div>
						)}
					</div>

					<div className="shrink-0 border-t border-border bg-surface p-4">
						<Button
							type="button"
							className="w-full"
							onClick={handleSave}
							disabled={
								isSaving ||
								isLoadingNotebooks ||
								!selectedNotebookId
							}
						>
							{copy.notebook.save}
						</Button>
					</div>
				</div>
			</NotebookMotionDrawer>
		</>
	);
}
