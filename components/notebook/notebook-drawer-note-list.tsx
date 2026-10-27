"use client";

import Link from "next/link";
import { NotebookTagPill } from "@/components/notebook/notebook-tag-pill";
import { copy } from "@/lib/copy/vi";
import { formatNotebookNoteTime } from "@/lib/notebook/format-date";
import { isHtmlNoteBody } from "@/lib/notebook/note-body";
import type { NotebookNoteItem } from "@/lib/notebook/types";
import { cn } from "@/lib/utils";

interface NotebookDrawerNoteListProps {
	notes: NotebookNoteItem[];
	activeNoteId?: string;
	isLoading?: boolean;
}

export function NotebookDrawerNoteList({
	notes,
	activeNoteId,
	isLoading = false,
}: NotebookDrawerNoteListProps) {
	if (isLoading) {
		return (
			<p className="text-sm text-muted-foreground">
				{copy.notebook.loadingNotes}
			</p>
		);
	}

	if (notes.length === 0) {
		return null;
	}

	return (
		<div className="space-y-2">
			<ul className="space-y-2">
				{notes.map((note, index) => {
					const sourceLabel = note.source.label ?? note.source.path;
					const isActive = note.id === activeNoteId;

					return (
						<li
							key={note.id}
							className={cn(
								"rounded-[12px] border bg-surface/70 p-3",
								isActive
									? "border-primary/40 bg-primary/5"
									: "border-border",
							)}
						>
							<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
								<span className="font-medium text-foreground">
									{copy.notebook.noteListItem(index + 1)}
								</span>
								<span aria-hidden>·</span>
								<time dateTime={note.createdAt}>
									{formatNotebookNoteTime(note.createdAt)}
								</time>
								{isActive ? (
									<>
										<span aria-hidden>·</span>
										<span className="text-primary">
											{copy.notebook.editingNote}
										</span>
									</>
								) : null}
								{sourceLabel ? (
									<>
										<span aria-hidden>·</span>
										{note.source.path ? (
											<Link
												href={note.source.path}
												className="font-medium text-primary hover:underline"
											>
												{sourceLabel}
											</Link>
										) : (
											<span>{sourceLabel}</span>
										)}
									</>
								) : null}
							</div>

							{note.tags.length > 0 ? (
								<div className="mt-2 flex flex-wrap gap-1.5">
									{note.tags.map((tagId) => (
										<NotebookTagPill
											key={tagId}
											tagId={tagId}
										/>
									))}
								</div>
							) : null}

							{isHtmlNoteBody(note.body) ? (
								<div
									className={cn(
										"notebook-note-content mt-2 text-sm leading-relaxed text-foreground/90",
										"[&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1",
										"[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
										"[&_strong]:font-semibold [&_em]:italic",
									)}
									dangerouslySetInnerHTML={{
										__html: note.body,
									}}
								/>
							) : (
								<p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
									{note.body}
								</p>
							)}
						</li>
					);
				})}
			</ul>
		</div>
	);
}
