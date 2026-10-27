"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileInput } from "@/components/ui/file-input";
import { Label } from "@/components/ui/label";
import { uploadListeningImageFromClient } from "@/lib/admin/content/upload-listening-image-client";
import { canonicalListeningImageStoragePath } from "@/lib/content/listening-image-paths";
import {
	buildPublicAssetUrlForBucket,
	IMAGES_BUCKET,
} from "@/lib/content/media-storage-paths";
import { copy } from "@/lib/copy/vi";

const IMAGE_ACCEPT = ".png,image/png";

type AdminListeningImageFieldProps = {
	bookId: string;
	testId: string;
	questionId: string;
	disabled?: boolean;
} & (
	| { part: 1; globalItemNumber: number }
	| { part: 3 | 4; groupStartGlobalItemNumber: number }
);

function imagePathInput(props: AdminListeningImageFieldProps) {
	switch (props.part) {
		case 1:
			return {
				part: props.part,
				bookId: props.bookId,
				testId: props.testId,
				globalItemNumber: props.globalItemNumber,
			};
		case 3:
		case 4:
			return {
				part: props.part,
				bookId: props.bookId,
				testId: props.testId,
				groupStartGlobalItemNumber: props.groupStartGlobalItemNumber,
			};
	}
}

function imageUploadInput(props: AdminListeningImageFieldProps, file: File) {
	switch (props.part) {
		case 1:
			return {
				bookId: props.bookId,
				testId: props.testId,
				part: props.part,
				questionId: props.questionId,
				globalItemNumber: props.globalItemNumber,
				file,
			};
		case 3:
		case 4:
			return {
				bookId: props.bookId,
				testId: props.testId,
				part: props.part,
				questionId: props.questionId,
				groupStartGlobalItemNumber: props.groupStartGlobalItemNumber,
				file,
			};
	}
}

export function AdminListeningImageField(props: AdminListeningImageFieldProps) {
	const storagePath = canonicalListeningImageStoragePath(imagePathInput(props));
	const publicUrl = buildPublicAssetUrlForBucket(IMAGES_BUCKET, storagePath);
	const [trackedPath, setTrackedPath] = useState(storagePath);
	const [missing, setMissing] = useState(false);
	const [version, setVersion] = useState(0);
	const [uploading, setUploading] = useState(false);
	if (trackedPath !== storagePath) {
		setTrackedPath(storagePath);
		setMissing(false);
		setVersion(0);
	}

	const imageCopy = copy.admin.cms.listeningImage;
	const busy = props.disabled || uploading;
	if (!publicUrl) return null;

	const previewUrl = version > 0 ? `${publicUrl}?v=${version}` : publicUrl;

	async function handleFilesChange(files: File[]) {
		const file = files[0];
		if (!file || busy) return;
		setUploading(true);
		try {
			const result = await uploadListeningImageFromClient(
				imageUploadInput(props, file),
			);
			if (!result.ok) {
				toast.error(result.error);
				return;
			}
			setMissing(false);
			setVersion(Date.now());
			toast.success(imageCopy.uploaded);
		} finally {
			setUploading(false);
		}
	}

	return (
		<div className="space-y-3 rounded-[14px] border border-border bg-muted/10 p-4">
			<div className="grid gap-1">
				<Label>{imageCopy.label}</Label>
				<a
					href={publicUrl}
					target="_blank"
					rel="noreferrer"
					className="break-all text-xs text-primary underline-offset-2 hover:underline"
				>
					{publicUrl}
				</a>
				<p className="text-xs text-muted-foreground">{imageCopy.hint}</p>
			</div>

			{missing ? (
				<p className="rounded-[14px] border border-dashed border-border px-3 py-10 text-center text-sm text-muted-foreground">
					{imageCopy.missing}
				</p>
			) : (
				<div className="overflow-hidden rounded-[14px] border border-border bg-muted/20">
					<img
						key={previewUrl}
						src={previewUrl}
						alt={copy.admin.cms.part1ImageLabel}
						className="max-h-[min(52vh,420px)] w-full object-contain"
						onError={() => setMissing(true)}
					/>
				</div>
			)}

			<FileInput
				compact
				accept={IMAGE_ACCEPT}
				disabled={busy}
				pickLabel={uploading ? imageCopy.uploading : imageCopy.replace}
				placeholderLabel=""
				onFilesChange={(files) => {
					void handleFilesChange(files);
				}}
			/>
		</div>
	);
}
