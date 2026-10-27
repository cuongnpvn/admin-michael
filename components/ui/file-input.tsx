"use client";

import { FileText, Upload } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileInputProps {
	name?: string;
	accept?: string;
	disabled?: boolean;
	className?: string;
	pickLabel?: string;
	emptyLabel?: string;
	placeholderLabel?: string;
	dropLabel?: string;
	dropHint?: string;
	dropReleaseLabel?: string;
	compact?: boolean;
	directory?: boolean;
	multiple?: boolean;
	variant?: "button" | "dropzone";
	onFilesChange?: (files: File[]) => void;
	children?: React.ReactNode;
}

function isAcceptedFile(file: File, accept?: string): boolean {
	if (!accept?.trim()) {
		return true;
	}

	const tokens = accept
		.split(",")
		.map((token) => token.trim())
		.filter(Boolean);

	return (
		tokens.some((token) => {
			if (token.startsWith(".")) {
				return file.name.toLowerCase().endsWith(token.toLowerCase());
			}

			if (token.endsWith("/*")) {
				const prefix = token.slice(0, -1);
				return file.type.startsWith(prefix);
			}

			return file.type === token;
		}) ||
		(tokens.some((token) => token.toLowerCase().includes("pdf")) &&
			file.name.toLowerCase().endsWith(".pdf"))
	);
}

function FileInput({
	name,
	accept,
	disabled,
	className,
	pickLabel = "Chọn file",
	emptyLabel,
	placeholderLabel = "Chưa chọn file",
	dropLabel,
	dropHint,
	dropReleaseLabel = "Thả file để tải lên",
	compact = false,
	directory = false,
	multiple = false,
	variant = "button",
	onFilesChange,
	children,
}: FileInputProps) {
	const inputRef = React.useRef<HTMLInputElement>(null);
	const [localFileName, setLocalFileName] = React.useState<string | null>(
		null,
	);
	const [isDragging, setIsDragging] = React.useState(false);
	const previousEmptyLabelRef = React.useRef<string | undefined>(undefined);
	const inputId = React.useId();
	const resolvedEmptyLabel = emptyLabel ?? placeholderLabel;
	const selectedFileName =
		localFileName ??
		(resolvedEmptyLabel !== placeholderLabel ? resolvedEmptyLabel : null);
	const hasSelectedFile = selectedFileName != null;
	const displayName = selectedFileName ?? placeholderLabel;

	React.useEffect(() => {
		const previousEmptyLabel = previousEmptyLabelRef.current;
		previousEmptyLabelRef.current = resolvedEmptyLabel;

		if (
			previousEmptyLabel != null &&
			previousEmptyLabel !== placeholderLabel &&
			resolvedEmptyLabel === placeholderLabel
		) {
			setLocalFileName(null);
		}
	}, [resolvedEmptyLabel, placeholderLabel]);

	function applyFiles(files: File[]) {
		const acceptedFiles = files.filter((file) =>
			isAcceptedFile(file, accept),
		);
		if (acceptedFiles.length === 0) {
			return;
		}

		const nextFileName = directory
			? (acceptedFiles[0]?.webkitRelativePath.split("/")[0] ??
				acceptedFiles[0]?.name ??
				null)
			: (acceptedFiles[0]?.name ?? null);

		setLocalFileName(nextFileName);
		onFilesChange?.(acceptedFiles);

		if (inputRef.current) {
			inputRef.current.value = "";
		}
	}

	function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
		applyFiles(Array.from(event.target.files ?? []));
	}

	function openFilePicker() {
		if (disabled) {
			return;
		}

		inputRef.current?.click();
	}

	function handleDragEnter(event: React.DragEvent<HTMLDivElement>) {
		event.preventDefault();
		event.stopPropagation();
		if (disabled) {
			return;
		}

		setIsDragging(true);
	}

	function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
		event.preventDefault();
		event.stopPropagation();
		if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
			return;
		}

		setIsDragging(false);
	}

	function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
		event.preventDefault();
		event.stopPropagation();
		if (disabled) {
			return;
		}

		event.dataTransfer.dropEffect = "copy";
		setIsDragging(true);
	}

	function handleDrop(event: React.DragEvent<HTMLDivElement>) {
		event.preventDefault();
		event.stopPropagation();
		setIsDragging(false);

		if (disabled) {
			return;
		}

		applyFiles(Array.from(event.dataTransfer.files ?? []));
	}

	const hiddenInput = (
		<input
			ref={inputRef}
			id={inputId}
			type="file"
			name={name}
			accept={accept}
			disabled={disabled}
			multiple={multiple || directory}
			className="sr-only"
			{...(directory ? { webkitdirectory: "", directory: "" } : {})}
			onChange={handleInputChange}
		/>
	);

	if (variant === "dropzone") {
		const hasPreview = children != null;

		return (
			<div className={cn("flex min-h-0 min-w-0 flex-col", className)}>
				{hiddenInput}
				<div
					role="button"
					tabIndex={disabled ? -1 : 0}
					aria-disabled={disabled}
					onClick={openFilePicker}
					onKeyDown={(event) => {
						if (event.key === "Enter" || event.key === " ") {
							event.preventDefault();
							openFilePicker();
						}
					}}
					onDragEnter={handleDragEnter}
					onDragLeave={handleDragLeave}
					onDragOver={handleDragOver}
					onDrop={handleDrop}
					className={cn(
						"flex min-h-28 flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed px-4 py-5 text-center transition-colors",
						isDragging
							? "border-primary bg-primary/5"
							: "border-border bg-background/60 hover:border-primary/40 hover:bg-muted/30",
						disabled && "cursor-not-allowed opacity-60",
						hasSelectedFile &&
							!isDragging &&
							!hasPreview &&
							"border-solid border-primary/30 bg-primary/5",
						hasPreview && !isDragging && "border-solid p-3",
					)}
				>
					{hasPreview ? (
						<div className="relative flex h-full min-h-48 w-full flex-1 items-center justify-center">
							{children}
							{isDragging ? (
								<div className="absolute inset-0 flex items-center justify-center rounded-[8px] bg-background/80 text-sm font-medium text-foreground">
									{dropReleaseLabel}
								</div>
							) : null}
						</div>
					) : (
						<>
							<div
								className={cn(
									"flex size-10 items-center justify-center rounded-full",
									hasSelectedFile
										? "bg-primary/10 text-primary"
										: "bg-muted text-muted-foreground",
								)}
							>
								{hasSelectedFile ? (
									<FileText className="size-5" />
								) : (
									<Upload className="size-5" />
								)}
							</div>
							<div className="space-y-1">
								<p className="max-w-full text-sm font-medium text-foreground">
									{isDragging
										? dropReleaseLabel
										: hasSelectedFile
											? displayName
											: (dropLabel ?? "")}
								</p>
								{!isDragging && dropHint ? (
									<p className="text-xs text-muted-foreground">
										{dropHint}
									</p>
								) : null}
							</div>
						</>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className={cn("flex min-w-0 items-center gap-2", className)}>
			{hiddenInput}
			<Button
				type="button"
				variant="secondary"
				size="sm"
				disabled={disabled}
				className={cn(compact && "h-8 px-3 text-xs")}
				onClick={openFilePicker}
			>
				<Upload className="size-4" />
				{pickLabel}
			</Button>
			<span
				className={cn(
					"min-w-0 truncate text-muted-foreground",
					compact ? "text-xs" : "text-sm",
				)}
			>
				{displayName}
			</span>
		</div>
	);
}

export { FileInput };
