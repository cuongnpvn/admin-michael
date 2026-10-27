import type { PartQuestionKey } from "@/lib/practice/score-part";
import {
	contentHasClozeMarker,
	fillReviewClozeMarkers,
	fillReviewClozeMarkersHtml,
} from "@/lib/reading/passage-cloze-markers";
import type { Question } from "@/types/ui";

export type PassageClozeAnswerSource = {
	globalItemNumber: number;
	correctOptionId: string;
	options: Array<{ id: string; text: string }>;
};

export function buildPassageClozeAnswerSources(
	questions: Question[],
	keys: PartQuestionKey[],
): PassageClozeAnswerSource[] {
	const keysById = new Map(keys.map((key) => [key.id, key]));

	return questions.flatMap((question) => {
		const key = keysById.get(question.id);
		if (!key?.correctOptionId) {
			return [];
		}

		return [
			{
				globalItemNumber: question.globalItemNumber,
				correctOptionId: key.correctOptionId,
				options: question.options,
			},
		];
	});
}

export function buildClozeAnswersForPassageContent(
	passageContent: string,
	sources: PassageClozeAnswerSource[],
): Map<number, string> {
	const answers = new Map<number, string>();

	for (const source of sources) {
		if (!contentHasClozeMarker(passageContent, source.globalItemNumber)) {
			continue;
		}

		const correctOption = source.options.find(
			(option) => option.id === source.correctOptionId,
		);
		const answer = correctOption?.text.trim();
		if (!answer) {
			continue;
		}

		answers.set(source.globalItemNumber, answer);
	}

	return answers;
}

function isHtmlPassageContent(content: string): boolean {
	return content.trim().includes("<");
}

/** Part 6 review content with filled cloze answers in HTML or legacy markdown. */
export function buildPart6ParsedAnswerContent(
	content: string,
	sources: PassageClozeAnswerSource[],
): string {
	const answers = buildClozeAnswersForPassageContent(content, sources);
	const trimmed = content.trim();
	if (!trimmed) {
		return "";
	}

	if (isHtmlPassageContent(trimmed)) {
		return answers.size === 0
			? trimmed
			: fillReviewClozeMarkersHtml(trimmed, answers);
	}

	if (answers.size === 0) {
		return trimmed;
	}

	return fillReviewClozeMarkers(trimmed, answers);
}

/** @deprecated Use `buildPart6ParsedAnswerContent`. */
export function fillPart6ReviewPassageContent(
	content: string,
	sources: PassageClozeAnswerSource[],
): string {
	return buildPart6ParsedAnswerContent(content, sources);
}
