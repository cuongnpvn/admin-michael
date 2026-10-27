"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { FileInput } from "@/components/ui/file-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { concatAudioFiles } from "@/lib/admin/content/concat-audio-files";
import { uploadListeningPlaybackAudioFromClient } from "@/lib/admin/content/upload-listening-playback-audio-client";
import { canonicalListeningPlaybackStoragePath } from "@/lib/content/listening-audio-paths";
import {
	AUDIOS_BUCKET,
	buildPublicAssetUrlForBucket,
} from "@/lib/content/media-storage-paths";
import { copy } from "@/lib/copy/vi";

const AUDIO_ACCEPT =
	".mp3,.m4a,.wav,audio/mpeg,audio/mp3,audio/mp4,audio/wav,audio/x-wav";

type AdminListeningAudioFieldProps = {
	bookId: string;
	testId: string;
	disabled?: boolean;
} & (
	| { part: 1 | 2; questionId: string; globalItemNumber: number }
	| { part: 3 | 4; groupId: string; groupGlobalNumbers: number[] }
);

function listeningPlaybackPathInput(props: AdminListeningAudioFieldProps) {
	switch (props.part) {
		case 3:
		case 4:
			return {
				bookId: props.bookId,
				testId: props.testId,
				part: props.part,
				groupGlobalNumbers: props.groupGlobalNumbers,
			};
		case 1:
		case 2:
			return {
				bookId: props.bookId,
				testId: props.testId,
				part: props.part,
				globalItemNumber: props.globalItemNumber,
			};
	}
}

function listeningPlaybackUploadInput(
	props: AdminListeningAudioFieldProps,
	file: File,
) {
	switch (props.part) {
		case 3:
		case 4:
			return {
				bookId: props.bookId,
				testId: props.testId,
				part: props.part,
				groupId: props.groupId,
				groupGlobalNumbers: props.groupGlobalNumbers,
				file,
			};
		case 1:
		case 2:
			return {
				bookId: props.bookId,
				testId: props.testId,
				part: props.part,
				questionId: props.questionId,
				globalItemNumber: props.globalItemNumber,
				file,
			};
	}
}

export function AdminListeningAudioField(props: AdminListeningAudioFieldProps) {
	const storagePath = canonicalListeningPlaybackStoragePath(
		listeningPlaybackPathInput(props),
	);
	const publicUrl = storagePath
		? buildPublicAssetUrlForBucket(AUDIOS_BUCKET, storagePath)
		: null;
	const [trackedPath, setTrackedPath] = useState(storagePath);
	const [missing, setMissing] = useState(false);
	const [version, setVersion] = useState(0);
	const [uploading, setUploading] = useState(false);
	const [clips, setClips] = useState<File[]>([]);
	if (trackedPath !== storagePath) {
		setTrackedPath(storagePath);
		setMissing(false);
		setVersion(0);
		setClips([]);
	}
	const audioCopy = copy.admin.cms.listeningAudio;
	const busy = props.disabled || uploading;
	const isGroupPart = props.part === 3 || props.part === 4;

	async function uploadFile(file: File) {
		setUploading(true);
		try {
			const result = await uploadListeningPlaybackAudioFromClient(
				listeningPlaybackUploadInput(props, file),
			);

			if (!result.ok) {
				toast.error(result.error);
				return;
			}

			setMissing(false);
			setVersion(Date.now());
			setClips([]);
			toast.success(audioCopy.uploaded);
		} finally {
			setUploading(false);
		}
	}

	async function handleFilesChange(files: File[]) {
		if (files.length === 0 || busy) return;
		if (isGroupPart) {
			setClips((current) => [...current, ...files]);
			return;
		}
		const file = files[0];
		if (!file) return;
		await uploadFile(file);
	}

	async function uploadClipList() {
		if (clips.length === 0 || busy) return;
		setUploading(true);
		try {
			const file = await concatAudioFiles(clips);
			await uploadFile(file);
		} catch (error) {
			setUploading(false);
			toast.error(
				error instanceof Error
					? error.message
					: copy.admin.cms.errors.generic,
			);
		}
	}

	if (!publicUrl) return null;

	const previewUrl = version > 0 ? `${publicUrl}?v=${version}` : publicUrl;

	return (
		<div className="space-y-3 rounded-[14px] border border-border bg-muted/10 p-4">
			<div className="grid gap-1">
				<Label>{audioCopy.label}</Label>
				<a
					href={publicUrl}
					target="_blank"
					rel="noreferrer"
					className="break-all text-xs text-primary underline-offset-2 hover:underline"
				>
					{publicUrl}
				</a>
				{isGroupPart ? null : (
					<p className="text-xs text-muted-foreground">{audioCopy.hint}</p>
				)}
			</div>

			{missing ? (
				<p className="text-sm text-muted-foreground">{audioCopy.missing}</p>
			) : (
				<audio
					key={previewUrl}
					controls
					preload="metadata"
					src={previewUrl}
					className="w-full"
					onError={() => setMissing(true)}
				/>
			)}

			{isGroupPart && clips.length > 0 ? (
				<ul className="space-y-1">
					{clips.map((clip, index) => (
						<li
							key={`${clip.name}-${clip.size}-${index}`}
							className="flex items-center gap-2 text-sm"
						>
							<span className="min-w-0 flex-1 truncate">{clip.name}</span>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="size-7 shrink-0"
								disabled={busy}
								aria-label="Xóa"
								onClick={() =>
									setClips((current) =>
										current.filter((_, itemIndex) => itemIndex !== index),
									)
								}
							>
								<X className="size-3.5" />
							</Button>
						</li>
					))}
				</ul>
			) : null}

			<div className="flex flex-wrap items-center gap-2">
				<FileInput
					compact
					multiple={isGroupPart}
					accept={AUDIO_ACCEPT}
					disabled={busy}
					pickLabel={
						uploading
							? audioCopy.uploading
							: isGroupPart
								? copy.admin.actions.add
								: audioCopy.replace
					}
					placeholderLabel=""
					onFilesChange={(files) => {
						void handleFilesChange(files);
					}}
				/>
				{isGroupPart ? (
					<Button
						type="button"
						size="sm"
						disabled={busy || clips.length === 0}
						onClick={() => {
							void uploadClipList();
						}}
					>
						{uploading ? audioCopy.uploading : audioCopy.replace}
					</Button>
				) : null}
			</div>
		</div>
	);
}
