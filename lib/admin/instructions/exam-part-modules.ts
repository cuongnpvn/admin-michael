import type { AdminInstructionId } from "@/lib/admin/instructions/catalog";
import type { CreateExamPipelineStepId } from "@/lib/admin/content/create-exam-test-pipeline";
import { ADMIN_INSTRUCTIONS } from "@/lib/admin/instructions/catalog";
import type { ContentVocabularyPart } from "@/lib/content/content-vocabulary-export-schema";

export type { ContentVocabularyPart };

export interface ExamPartModule {
	id: AdminInstructionId;
	title: string;
	parts: number[];
	pipelineSteps: CreateExamPipelineStepId[];
	listeningPart?: 3 | 4;
	readingPart?: 5 | 6 | 7;
	extractSegmentIds?: AdminInstructionId[];
}

export const EXAM_PART_MODULES: ExamPartModule[] = [
	{
		id: "listening-parts-1-2",
		title: ",Part 1–2",
		parts: [1, 2],
		pipelineSteps: ["listeningPart12"],
	},
	{
		id: "listening-part-3",
		title: ",Part 3",
		parts: [3],
		pipelineSteps: ["listeningPart3"],
		listeningPart: 3,
	},
	{
		id: "listening-part-4",
		title: ",Part 4",
		parts: [4],
		pipelineSteps: ["listeningPart4"],
		listeningPart: 4,
	},
	{
		id: "reading-part-5",
		title: "Reading Part 5",
		parts: [5],
		pipelineSteps: ["reading"],
		readingPart: 5,
	},
	{
		id: "reading-part-6",
		title: "Reading Part 6",
		parts: [6],
		pipelineSteps: ["reading"],
		readingPart: 6,
	},
	{
		id: "reading-part-7",
		title: "Reading Part 7",
		parts: [7],
		pipelineSteps: ["reading"],
		readingPart: 7,
		extractSegmentIds: ["reading-part-7-single", "reading-part-7-multi"],
	},
];

function instructionTitle(id: AdminInstructionId): string {
	if (id === "reading-part-7") return "Part 7";
	return ADMIN_INSTRUCTIONS.find((doc) => doc.id === id)?.title ?? id;
}

export function examPartModuleById(
	id: AdminInstructionId,
): ExamPartModule | undefined {
	const examModule = EXAM_PART_MODULES.find((entry) => entry.id === id);
	if (!examModule) return undefined;
	return { ...examModule, title: instructionTitle(id) };
}

export function examPartModuleForPart(
	part: number,
): ExamPartModule | undefined {
	return EXAM_PART_MODULES.find((module) => module.parts.includes(part));
}

export function examPartModulesForSection(
	section: "listening" | "reading",
): ExamPartModule[] {
	return EXAM_PART_MODULES.filter((module) =>
		section === "listening"
			? module.parts.every((part) => part <= 4)
			: module.parts.every((part) => part >= 5),
	).map((module) => ({
		...module,
		title: instructionTitle(module.id),
	}));
}

export function examModuleSupportsTranslation(
	moduleId: AdminInstructionId,
): boolean {
	return (
		moduleId === "listening-parts-1-2" ||
		moduleId === "listening-part-3" ||
		moduleId === "listening-part-4" ||
		moduleId === "reading-part-5" ||
		moduleId === "reading-part-6" ||
		moduleId === "reading-part-7"
	);
}

export function isReadingPart5TranslationModule(
	moduleId: AdminInstructionId,
): boolean {
	return moduleId === "reading-part-5";
}

export function isListeningPart12TranslationModule(
	moduleId: AdminInstructionId,
): boolean {
	return moduleId === "listening-parts-1-2";
}

/** @deprecated Use {@link examModuleSupportsTranslation}. */
export function examModuleNeedsPassageTranslation(
	moduleId: AdminInstructionId,
): boolean {
	return examModuleSupportsTranslation(moduleId);
}

export function translationPartForExamModule(
	moduleId: AdminInstructionId,
): 3 | 4 | 6 | 7 | null {
	switch (moduleId) {
		case "listening-part-3":
			return 3;
		case "listening-part-4":
			return 4;
		case "reading-part-6":
			return 6;
		case "reading-part-7":
			return 7;
		default:
			return null;
	}
}

export function examModuleSupportsContentVocabulary(
	moduleId: AdminInstructionId,
): boolean {
	return EXAM_PART_MODULES.some((module) => module.id === moduleId);
}

/** Parts to run content-vocabulary extract for after digitize. */
export function contentVocabularyPartsForExamModule(
	moduleId: AdminInstructionId,
): ContentVocabularyPart[] {
	switch (moduleId) {
		case "listening-parts-1-2":
			return [1, 2];
		case "listening-part-3":
			return [3];
		case "listening-part-4":
			return [4];
		case "reading-part-5":
			return [5];
		case "reading-part-6":
			return [6];
		case "reading-part-7":
			return [7];
		default:
			return [];
	}
}
