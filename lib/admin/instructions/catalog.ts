export const ADMIN_INSTRUCTIONS = [
	{
		id: "listening-parts-1-2",
		title: "Part 1–2",
		filename: "listening-parts-1-2.md",
	},
	{
		id: "listening-part-12-translation",
		title: "Part 1–2 Translation",
		filename: "listening-part-12-translation.md",
	},
	{
		id: "listening-part-1-tags",
		title: "Part 1 Tags",
		filename: "listening-part-1-tags.md",
	},
	{
		id: "listening-part-2-tags",
		title: "Part 2 Tags",
		filename: "listening-part-2-tags.md",
	},
	{
		id: "listening-part-1-sentence-alignment",
		title: "Part 1 Sentence Alignment",
		filename: "listening-part-1-sentence-alignment.md",
	},
	{
		id: "listening-part-2-sentence-alignment",
		title: "Part 2 Sentence Alignment",
		filename: "listening-part-2-sentence-alignment.md",
	},
	{
		id: "listening-part-3",
		title: "Part 3",
		filename: "listening-part-3.md",
	},
	{
		id: "listening-part-3-process",
		title: "Part 3 Process",
		filename: "listening-part-3-process.md",
	},
	{
		id: "listening-part-3-turn-alignment",
		title: "Part 3 Turn Alignment",
		filename: "listening-part-3-turn-alignment.md",
	},
	{
		id: "listening-part-4",
		title: "Part 4",
		filename: "listening-part-4.md",
	},
	{
		id: "listening-part-4-sentence-alignment",
		title: "Part 4 Sentence Alignment",
		filename: "listening-part-4-sentence-alignment.md",
	},
	{
		id: "reading-part-5",
		title: "Part 5",
		filename: "reading-part-5.md",
	},
	{
		id: "reading-part-5-tags",
		title: "Part 5 Tags",
		filename: "reading-part-5-tags.md",
	},
	{
		id: "reading-part-6-tags",
		title: "Part 6 Tags",
		filename: "reading-part-6-tags.md",
	},
	{
		id: "comprehension-question-tags",
		title: "Comprehension Question Tags",
		filename: "comprehension-question-tags.md",
	},
	{
		id: "reading-part-5-translation",
		title: "Part 5 Translation",
		filename: "reading-part-5-translation.md",
	},
	{
		id: "reading-part-6",
		title: "Part 6",
		filename: "reading-part-6.md",
	},
	{
		id: "reading-part-7-single",
		title: "Part 7 — Single passages (147–175)",
		filename: "reading-part-7-single.md",
	},
	{
		id: "reading-part-7-multi",
		title: "Part 7 — Double/triple passages (176–200)",
		filename: "reading-part-7-multi.md",
	},
	{
		id: "reading-part-6-translation",
		title: "Part 6 Translation",
		filename: "reading-part-6-translation.md",
	},
	{
		id: "reading-part-7-process",
		title: "Part 7 Process",
		filename: "reading-part-7-process.md",
	},
	{
		id: "listening-transcript-translation",
		title: "Listening Transcript Translation (P3–4)",
		filename: "listening-transcript-translation.md",
	},
	{
		id: "content-vocabulary",
		title: "Content Vocabulary (exam units)",
		filename: "content-vocabulary.md",
	},
	{
		id: "vocabulary-list",
		title: "Vocabulary List (per test)",
		filename: "vocabulary-list.md",
	},
	{
		id: "answer-key",
		title: "Answer Key (PDF → JSON)",
		filename: "answer-key.md",
	},
	{
		id: "lecture-from-pdf",
		title: "Bài giảng (PDF → HTML + quiz)",
		filename: "lecture-from-pdf.md",
	},
] as const;

export type AdminInstructionId =
	| (typeof ADMIN_INSTRUCTIONS)[number]["id"]
	| "reading-part-7";

export interface AdminInstructionDoc {
	id: AdminInstructionId;
	title: string;
	content: string;
}
