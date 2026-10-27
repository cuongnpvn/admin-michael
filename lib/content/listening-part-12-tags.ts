export interface ListeningPart12TagOption {
	value: string;
	chip_vi: string;
}

function tag(value: string, chip_vi: string): ListeningPart12TagOption {
	return { value, chip_vi };
}

/** Part 1 photograph classification — one slug per question. */
export const LISTENING_PART1_TAGS: ListeningPart12TagOption[] = [
	tag("picture_multiple_people", "Tranh tả nhiều người"),
	tag("picture_object", "Tranh tả vật"),
	tag("picture_single_person", "Tranh tả một người"),
];

/** Part 2 question-type classification — one slug per question. */
export const LISTENING_PART2_TAGS: ListeningPart12TagOption[] = [
	tag("yes_no", "YES/NO"),
	tag("choice", "CHOICE"),
	tag("why", "WHY"),
	tag("tag_question", "Câu hỏi đuôi"),
	tag("what", "WHAT"),
	tag("which", "WHICH"),
	tag("request", "Câu yêu cầu, đề nghị"),
	tag("who", "WHO"),
	tag("when", "WHEN"),
	tag("declarative", "Câu trần thuật"),
	tag("how", "HOW"),
	tag("where", "WHERE"),
];

/**
 * Optional place for Parts 1–2. Shorter than the Parts 3–7 topic list.
 * Omit when the photograph or spoken line does not make the place obvious.
 */
export const LISTENING_PART12_TOPIC_TAGS: ListeningPart12TagOption[] = [
	tag("office", "Văn phòng"),
	tag("personnel", "Nhân sự"),
	tag("travel", "Du lịch"),
	tag("dining", "Ẩm thực"),
	tag("purchasing", "Mua hàng"),
	tag("property", "Bất động sản"),
	tag("event", "Sự kiện"),
];

const PART1_TAG_VALUES = new Set(
	LISTENING_PART1_TAGS.map((entry) => entry.value),
);
const PART2_TAG_VALUES = new Set(
	LISTENING_PART2_TAGS.map((entry) => entry.value),
);
const PART12_TOPIC_VALUES = new Set(
	LISTENING_PART12_TOPIC_TAGS.map((entry) => entry.value),
);

export function listeningPart12TagsForPart(
	part: 1 | 2,
): ListeningPart12TagOption[] {
	return part === 1 ? LISTENING_PART1_TAGS : LISTENING_PART2_TAGS;
}

export function isListeningPart12TagValue(value: string): boolean {
	return PART1_TAG_VALUES.has(value) || PART2_TAG_VALUES.has(value);
}

export function isListeningPart1TagValue(value: string): boolean {
	return PART1_TAG_VALUES.has(value);
}

export function isListeningPart2TagValue(value: string): boolean {
	return PART2_TAG_VALUES.has(value);
}

export type ListeningPart12TagsValidationResult =
	| { ok: true; tags: string[] }
	| { ok: false; tags: string[]; error: string };

export function isListeningPart12TopicValue(value: string): boolean {
	return PART12_TOPIC_VALUES.has(value);
}

/** One classification slug, then an optional topic. Topic is stored first. */
export function validateListeningPart12QuestionTags(
	part: 1 | 2,
	tags: string[] | undefined,
): ListeningPart12TagsValidationResult {
	const allowed = part === 1 ? PART1_TAG_VALUES : PART2_TAG_VALUES;
	const normalized = [
		...new Set((tags ?? []).map((entry) => entry.trim()).filter(Boolean)),
	];
	const classifications = normalized.filter((slug) => allowed.has(slug));
	const topics = normalized.filter((slug) => PART12_TOPIC_VALUES.has(slug));
	const unknown = normalized.filter(
		(slug) => !allowed.has(slug) && !PART12_TOPIC_VALUES.has(slug),
	);

	if (unknown.length > 0) {
		return {
			ok: false,
			tags: normalized,
			error: `Tag "${unknown[0]}" không hợp lệ cho Part ${part}.`,
		};
	}

	if (classifications.length !== 1) {
		return {
			ok: false,
			tags: normalized,
			error: `Part ${part} cần đúng 1 tag phân loại (hiện có ${classifications.length}).`,
		};
	}

	if (topics.length > 1) {
		return {
			ok: false,
			tags: normalized,
			error: `Part ${part} chỉ được 1 chủ đề (hiện có ${topics.length}).`,
		};
	}

	const classification = classifications[0]!;
	const topic = topics[0];
	return {
		ok: true,
		tags: topic ? [topic, classification] : [classification],
	};
}

export function findListeningPart12TagOption(
	value: string,
): ListeningPart12TagOption | undefined {
	return (
		LISTENING_PART1_TAGS.find((entry) => entry.value === value) ??
		LISTENING_PART2_TAGS.find((entry) => entry.value === value)
	);
}
