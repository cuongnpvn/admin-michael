"use client";

import { ArrowUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { TutorAnswerCard } from "@/components/lectures/tutor-answer-card";
import { TutorOfferComposer } from "@/components/lectures/tutor-offer-composer";
import { TutorPracticeSheet } from "@/components/lectures/tutor-practice-sheet";
import { TutorThinkingBubble } from "@/components/lectures/tutor-thinking-bubble";
import { useTutorAskStream } from "@/components/lectures/use-tutor-ask-stream";
import { useTutorComposer } from "@/components/lectures/use-tutor-composer";
import { useTutorPractice } from "@/components/lectures/use-tutor-practice";
import type { AdminTutorLectureOption } from "@/lib/admin/lectures/load-admin-lectures";
import { Button } from "@/components/ui/button";
import { clipTutorHistory, tutorTurnsToHistory } from "@/lib/lectures/tutor/history";
import {
	pendingPracticeOfferIndex,
	type TutorUiTurn,
} from "@/lib/lectures/tutor/pending-practice-offer";
import { MAX_TUTOR_MESSAGE_LENGTH } from "@/lib/lectures/tutor/types";
import { adminLecturesPath } from "@/lib/lectures/paths";
import { copy } from "@/lib/copy/vi";

export function AdminLectureTutorChat({
	lectures,
}: {
	lectures: AdminTutorLectureOption[];
}) {
	const [lectureId, setLectureId] = useState(lectures[0]?.id ?? "");
	const [error, setError] = useState<string | null>(null);
	const [turns, setTurns] = useState<TutorUiTurn[]>([]);
	const [handledOfferIndex, setHandledOfferIndex] = useState<number | null>(
		null,
	);
	const {
		ask,
		abort,
		clearDraft,
		isStreaming,
		draftMarkdown,
		thinkingText,
	} = useTutorAskStream();
	const practice = useTutorPractice(lectureId);
	const pendingOfferIndex = pendingPracticeOfferIndex(
		turns,
		handledOfferIndex,
	);
	const showOffer = pendingOfferIndex !== null;
	const bottomRef = useRef<HTMLDivElement>(null);
	const {
		message,
		inputKey,
		inputRef,
		clearComposer,
		composerProps,
		onComposerKeyDown,
	} = useTutorComposer();

	useEffect(() => {
		abort();
		setTurns([]);
		setHandledOfferIndex(null);
		setError(null);
	}, [lectureId, abort]);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ block: "end" });
	}, [turns, isStreaming, draftMarkdown, thinkingText]);

	function send(text: string) {
		const trimmed = text.trim();
		if (!trimmed || !lectureId || isStreaming || showOffer) return;
		setError(null);
		clearComposer();
		const history = tutorTurnsToHistory(turns);
		setTurns((current) =>
			clipTutorHistory([...current, { role: "user", text: trimmed }]),
		);
		void (async () => {
			const outcome = await ask({
				lectureId,
				message: trimmed,
				history,
			});
			if (!outcome.ok) {
				if (outcome.aborted) return;
				setError(outcome.error);
				return;
			}
			setTurns((current) =>
				clipTutorHistory([
					...current,
					{ role: "assistant", result: outcome.result },
				]),
			);
			clearDraft();
		})();
	}

	function handleConfirmPractice() {
		if (pendingOfferIndex !== null) {
			setHandledOfferIndex(pendingOfferIndex);
		}
		practice.confirmOffer();
	}

	function handleDeclinePractice() {
		if (pendingOfferIndex !== null) {
			setHandledOfferIndex(pendingOfferIndex);
		}
	}

	return (
		<>
			<div className="flex h-[calc(100dvh-3.5rem)] min-h-0 flex-col">
			<header className="shrink-0 border-b border-border px-4 py-3 lg:px-8">
				<div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3">
					<Button asChild variant="ghost" size="sm">
						<Link href={adminLecturesPath()}>
							{copy.admin.lectures.backToCollections}
						</Link>
					</Button>
					<div className="min-w-0 flex-1">
						<h1 className="text-base font-semibold">
							{copy.admin.lectures.chatTitle}
						</h1>
					</div>
					{lectures.length > 0 ? (
						<label className="flex min-w-0 items-center gap-2 text-sm">
							<span className="shrink-0 text-muted-foreground">
								{copy.admin.lectures.chatContext}
							</span>
							<select
								className="h-9 max-w-[18rem] truncate rounded-[10px] border border-border bg-surface px-2 text-sm"
								value={lectureId}
								onChange={(event) =>
									setLectureId(event.target.value)
								}
							>
								{lectures.map((lecture) => (
									<option key={lecture.id} value={lecture.id}>
										{lecture.collectionTitle
											? `${lecture.collectionTitle} · ${lecture.title}`
											: lecture.title}
									</option>
								))}
							</select>
						</label>
					) : null}
				</div>
			</header>

			<div className="min-h-0 flex-1 overflow-y-auto px-4 lg:px-8">
				<div className="mx-auto flex min-h-full max-w-3xl flex-col gap-4 py-6">
					{lectures.length === 0 ? (
						<p className="m-auto text-sm text-muted-foreground">
							{copy.admin.lectures.chatNoLectures}
						</p>
					) : turns.length === 0 && !isStreaming ? (
						<div className="m-auto w-full space-y-6 text-center">
							<p className="text-lg font-medium">
								{copy.admin.lectures.chatEmpty}
							</p>
							<div className="flex flex-wrap justify-center gap-2">
								{copy.admin.lectures.chatSuggestions.map(
									(suggestion) => (
										<button
											key={suggestion}
											type="button"
											className="rounded-full border border-border px-3 py-1.5 text-left text-sm hover:bg-muted"
											onClick={() => send(suggestion)}
										>
											{suggestion}
										</button>
									),
								)}
							</div>
						</div>
					) : (
						turns.map((turn, index) =>
							turn.role === "user" ? (
								<div
									key={`u-${index}`}
									className="flex justify-end"
								>
									<p className="max-w-[85%] rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground">
										{turn.text}
									</p>
								</div>
							) : (
								<TutorAnswerCard
									key={`a-${index}`}
									result={turn.result}
									className="max-w-[85%] rounded-2xl bg-muted/50 px-4 py-3"
								/>
							),
						)
					)}
					{isStreaming && draftMarkdown === null ? (
						<TutorThinkingBubble
							label={copy.admin.lectures.chatThinking}
							detail={thinkingText}
							className="px-4 py-3"
						/>
					) : null}
					{isStreaming && draftMarkdown !== null ? (
						<TutorAnswerCard
							streaming
							answerMarkdown={draftMarkdown}
							className="max-w-[85%] rounded-2xl bg-muted/50 px-4 py-3"
						/>
					) : null}
					{error ? (
						<p className="text-sm text-destructive">{error}</p>
					) : null}
					<div ref={bottomRef} />
				</div>
			</div>

			<div className="shrink-0 border-t border-border px-4 py-3 lg:px-8">
				<div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-border bg-background p-2">
					{showOffer ? (
						<TutorOfferComposer
							onYes={handleConfirmPractice}
							onNo={handleDeclinePractice}
							yesPending={practice.isPending}
						/>
					) : (
						<>
							<textarea
								key={inputKey}
								ref={inputRef}
								className="max-h-40 min-h-12 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
								{...composerProps}
								onKeyDown={(event) =>
									onComposerKeyDown(event, send)
								}
								placeholder={copy.lectures.tutorPlaceholder}
								maxLength={MAX_TUTOR_MESSAGE_LENGTH}
								autoComplete="off"
								autoCorrect="off"
								autoCapitalize="off"
								spellCheck={false}
								disabled={!lectureId || isStreaming}
								rows={1}
							/>
							<Button
								type="button"
								size="icon"
								disabled={
									isStreaming || !lectureId || !message.trim()
								}
								aria-label={copy.lectures.tutorSend}
								onClick={() => send(message)}
							>
								<ArrowUp />
							</Button>
						</>
					)}
				</div>
			</div>
			</div>
			<TutorPracticeSheet
				open={practice.open}
				onOpenChange={practice.setOpen}
				practiceSet={practice.practiceSet}
				error={practice.error}
				loading={practice.isPending}
			/>
		</>
	);
}
