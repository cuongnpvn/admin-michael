"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FileInput } from "@/components/ui/file-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { VOCABULARY_UPLOAD_ACCEPT } from "@/lib/admin/vocabulary/constants";
import {
	deleteVocabularyDeck,
	regenerateVocabularyDeck,
	reimportVocabularyDeckFromUpload,
	setVocabularyDeckPublished,
	updateVocabularyDeckName,
} from "@/lib/admin/vocabulary/actions";
import { copy } from "@/lib/copy/vi";
import { adminVocabPath } from "@/lib/vocabulary/vocabulary-paths";

interface AdminVocabDeckHeaderProps {
	deckId: string;
	name: string;
	published: boolean;
	wordCount: number;
}

export function AdminVocabDeckHeader({
	deckId,
	name,
	published,
	wordCount,
}: AdminVocabDeckHeaderProps) {
	const router = useRouter();
	const [deckName, setDeckName] = useState(name);
	const [isPublished, setIsPublished] = useState(published);
	const [reuploadFile, setReuploadFile] = useState<File | null>(null);
	const [reuploadOpen, setReuploadOpen] = useState(false);
	const [regenerateOpen, setRegenerateOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	function handleRename() {
		const trimmed = deckName.trim();
		if (!trimmed || trimmed === name) return;
		setError(null);

		startTransition(async () => {
			const result = await updateVocabularyDeckName(deckId, trimmed);
			if (!result.ok) {
				setError(result.error);
				return;
			}
			router.refresh();
		});
	}

	function handlePublishChange(checked: boolean) {
		setIsPublished(checked);
		setError(null);

		startTransition(async () => {
			const result = await setVocabularyDeckPublished(deckId, checked);
			if (!result.ok) {
				setIsPublished(!checked);
				setError(result.error);
				return;
			}
			router.refresh();
		});
	}

	function handleDelete() {
		setError(null);
		startTransition(async () => {
			const result = await deleteVocabularyDeck(deckId);
			if (!result.ok) {
				setError(result.error);
				return;
			}
			setDeleteOpen(false);
			router.push(adminVocabPath());
			router.refresh();
		});
	}

	function handleReupload(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!reuploadFile) return;
		setError(null);
		setSuccess(null);

		const formData = new FormData();
		formData.set("file", reuploadFile);

		startTransition(async () => {
			const result = await reimportVocabularyDeckFromUpload(
				deckId,
				deckName.trim() || name,
				formData,
			);

			if (!result.ok) {
				setError(result.error);
				return;
			}

			setReuploadOpen(false);
			setReuploadFile(null);
			router.refresh();
		});
	}

	function handleRegenerate() {
		setError(null);
		setSuccess(null);

		startTransition(async () => {
			const result = await regenerateVocabularyDeck(deckId);
			if (!result.ok) {
				setError(result.error);
				return;
			}

			setRegenerateOpen(false);
			setSuccess(
				copy.admin.vocabManage.regenerateSuccess(result.wordCount),
			);
			router.refresh();
		});
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center gap-2 text-sm">
				<Link
					href={adminVocabPath()}
					className="text-muted-foreground hover:text-foreground"
				>
					{copy.admin.vocabManage.title}
				</Link>
				<span className="text-muted-foreground">/</span>
				<span>{name}</span>
			</div>

			<div className="flex flex-wrap items-start justify-between gap-4">
				<div className="min-w-0 flex-1 space-y-3">
					<div className="flex flex-wrap items-center gap-3">
						<Input
							value={deckName}
							onChange={(event) =>
								setDeckName(event.target.value)
							}
							onBlur={handleRename}
							disabled={isPending}
							className="max-w-md text-lg font-semibold"
						/>
						<Badge variant={isPublished ? "default" : "secondary"}>
							{isPublished
								? copy.admin.vocabManage.published
								: copy.admin.vocabManage.draft}
						</Badge>
					</div>
					<p className="text-sm text-muted-foreground">
						{copy.admin.vocabManage.wordCount(wordCount)}
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-3">
					<div className="flex items-center gap-2">
						<Switch
							checked={isPublished}
							onCheckedChange={handlePublishChange}
							disabled={isPending}
						/>
						<Label>{copy.admin.vocabManage.publishLabel}</Label>
					</div>

					<Dialog
						open={regenerateOpen}
						onOpenChange={setRegenerateOpen}
					>
						<DialogTrigger asChild>
							<Button
								type="button"
								variant="outline"
								disabled={isPending}
							>
								{copy.admin.vocabManage.regenerate}
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>
									{copy.admin.vocabManage.regenerateTitle}
								</DialogTitle>
								<DialogDescription></DialogDescription>
							</DialogHeader>
							{isPending ? (
								<p className="text-sm text-muted-foreground">
									{copy.admin.vocabManage.regenerateProgress}
								</p>
							) : null}
							{error ? (
								<p className="text-sm text-destructive">
									{error}
								</p>
							) : null}
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setRegenerateOpen(false)}
									disabled={isPending}
								>
									{copy.admin.cms.cancel}
								</Button>
								<Button
									type="button"
									disabled={isPending || wordCount === 0}
									onClick={handleRegenerate}
								>
									{copy.admin.vocabManage.regenerateConfirm}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>

					<Dialog open={reuploadOpen} onOpenChange={setReuploadOpen}>
						<DialogTrigger asChild>
							<Button
								type="button"
								variant="outline"
								disabled={isPending}
							>
								{copy.admin.vocabManage.reupload}
							</Button>
						</DialogTrigger>
						<DialogContent>
							<form onSubmit={handleReupload}>
								<DialogHeader>
									<DialogTitle>
										{copy.admin.vocabManage.reuploadTitle}
									</DialogTitle>
									<DialogDescription>
										{
											copy.admin.vocabManage
												.reuploadDescription
										}
									</DialogDescription>
								</DialogHeader>
								<div className="py-4">
									<FileInput
										accept={VOCABULARY_UPLOAD_ACCEPT}
										onFilesChange={(files) =>
											setReuploadFile(files[0] ?? null)
										}
										disabled={isPending}
									/>
								</div>
								{error ? (
									<p className="pb-2 text-sm text-destructive">
										{error}
									</p>
								) : null}
								<DialogFooter>
									<Button
										type="submit"
										disabled={isPending || !reuploadFile}
									>
										{copy.admin.vocabManage.reuploadSubmit}
									</Button>
								</DialogFooter>
							</form>
						</DialogContent>
					</Dialog>

					<Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
						<DialogTrigger asChild>
							<Button
								type="button"
								variant="destructive"
								disabled={isPending}
							>
								{copy.admin.vocabManage.deleteDeckConfirm}
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>
									{copy.admin.vocabManage.deleteDeckTitle}
								</DialogTitle>
								<DialogDescription>
									{copy.admin.vocabManage.deleteDeckDescription(
										name,
									)}
								</DialogDescription>
							</DialogHeader>
							{error ? (
								<p className="text-sm text-destructive">
									{error}
								</p>
							) : null}
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setDeleteOpen(false)}
								>
									{copy.admin.cms.cancel}
								</Button>
								<Button
									type="button"
									variant="destructive"
									disabled={isPending}
									onClick={handleDelete}
								>
									{copy.admin.vocabManage.deleteDeckConfirm}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{error && !reuploadOpen && !deleteOpen && !regenerateOpen ? (
				<p className="text-sm text-destructive">{error}</p>
			) : null}
			{success ? (
				<p className="text-sm text-muted-foreground">{success}</p>
			) : null}
		</div>
	);
}
