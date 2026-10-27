export interface ToeicTagOption {
	value: string;
	chip_vi: string;
	description_vi: string;
	/** @deprecated Use description_vi */
	label_vi: string;
}

function tag(
	value: string,
	chip_vi: string,
	description_vi: string,
): ToeicTagOption {
	return { value, chip_vi, description_vi, label_vi: description_vi };
}

export const MIN_QUESTION_TAGS = 2;
export const MAX_SKILL_TAGS = 3;

/** Business / situational context (optional metadata — Chủ đề). */
export const TOEIC_TOPIC_TAGS: ToeicTagOption[] = [
	tag("office", "Văn phòng", "Họp, dự án, email, báo cáo, deadline"),
	tag(
		"personnel",
		"Nhân sự",
		"Tuyển dụng, đào tạo, lương, phúc lợi, đánh giá",
	),
	tag("purchasing", "Mua hàng", "Đặt hàng, kho, nhà cung cấp, bán lẻ"),
	tag("finance", "Tài chính", "Ngân sách, hóa đơn, thanh toán, tài khoản"),
	tag("travel", "Du lịch", "Chuyến bay, khách sạn, vé, đặt chỗ"),
	tag("dining", "Ẩm thực", "Nhà hàng, catering, đặt bàn, thực đơn"),
	tag("property", "Bất động sản", "Tòa nhà, bảo trì, thuê/chuyển văn phòng"),
	tag(
		"manufacturing",
		"Sản xuất",
		"Nhà máy, vận chuyển, logistics, hàng tồn kho",
	),
	tag(
		"marketing",
		"Marketing",
		"Quảng cáo, khảo sát, chiến dịch, khuyến mãi",
	),
	tag("technology", "Công nghệ", "Phần mềm, IT, thiết bị, mạng"),
	tag("health", "Y tế", "Bệnh viện, phòng khám, dược phẩm"),
	tag("event", "Sự kiện", "Hội nghị, hội thảo, triển lãm, đăng ký"),
	tag("service", "Dịch vụ KH", "Khiếu nại, hỗ trợ, hoàn tiền"),
	tag(
		"general",
		"Chủ đề chung",
		"Truyền thông, cộng đồng, thông báo công cộng",
	),
];

/** Grammar dạng câu — Reading Part 5–6. */
export const GRAMMAR_SKILL_TAGS: ToeicTagOption[] = [
	tag(
		"preposition",
		"Giới từ",
		"Giới từ hoặc cụm giới từ cố định (in, despite, role in)",
	),
	tag(
		"word_form",
		"Từ loại",
		"Chọn N/V/Adj/Adv đúng ngữ pháp theo vị trí blank",
	),
	tag(
		"verb_tense",
		"Thì động từ",
		"Chia động từ theo thì và aspect (past, perfect, future)",
	),
	tag(
		"sv_agreement",
		"Hòa hợp CN–ĐT",
		"Động từ khớp số với chủ ngữ (One of the employees is…)",
	),
	tag(
		"conjunction",
		"Liên từ",
		"Liên từ nối mệnh đề (and, but, although, so that)",
	),
	tag(
		"conditional",
		"Câu điều kiện",
		"If-clauses, unless, provided that (types 0–3)",
	),
	tag(
		"article",
		"Mạo từ",
		"a / an / the / zero article với danh từ đếm được/không đếm",
	),
	tag(
		"comparison",
		"So sánh",
		"Comparative/superlative (-er, more, most, less)",
	),
	tag(
		"modal",
		"Động từ khuyết thiếu",
		"can, must, should, may, might, would",
	),
	tag(
		"collocation",
		"Collocation",
		"Cụm từ cố định (status update, product line)",
	),
	tag(
		"phrasal_verb",
		"Cụm động từ",
		"Phrasal verbs (call off, look into, fill out)",
	),
	tag(
		"vocabulary",
		"Từ vựng",
		"Chọn nghĩa phù hợp ngữ cảnh, không phải dạng từ",
	),
	tag(
		"pronoun",
		"Đại từ",
		"Đại từ hoặc tính từ sở hữu (her, neither, herself)",
	),
	tag(
		"verb_pattern",
		"Cấu trúc V",
		"wish to V, will V, enjoy V-ing, look forward to V-ing",
	),
	tag("relative_clause", "MĐ quan hệ", "who, whom, whose, which, that"),
	tag("passive", "Câu bị động", "be + V-ed / passive voice"),
	tag(
		"quantifier",
		"Lượng từ",
		"much/many, few/little, several, most, some, any",
	),
];

/** Comprehension dạng câu — Listening 3–4, Reading 7. */
export const COMPREHENSION_SKILL_TAGS: ToeicTagOption[] = [
	tag(
		"main_idea",
		"Ý chính",
		"Chủ đề, mục đích hoặc nội dung chính của đoạn/hội thoại",
	),
	tag(
		"detail",
		"Chi tiết",
		"Thông tin cụ thể được nêu trực tiếp (số, tên, thời gian)",
	),
	tag(
		"infer",
		"Suy luận",
		"Đáp án không nêu word-for-word (imply, most likely, suggest)",
	),
	tag(
		"vocab_context",
		"Từ vựng ngữ cảnh",
		"closest in meaning to — nghĩa từ trong ngữ cảnh",
	),
	tag(
		"not_stated",
		"NOT / không đề cập",
		"NOT mentioned, is NOT true — loại trừ đáp án",
	),
	tag(
		"compare",
		"So sánh đoạn kép",
		"Double/triple passage — đối chiếu hai hoặc nhiều văn bản",
	),
	tag("insert", "Chèn câu", "best belong — chọn vị trí chèn câu [1]–[4]"),
	tag(
		"organization",
		"Cấu trúc đoạn",
		"Overall structure, where sentence belongs in passage",
	),
	tag(
		"reference",
		"Tham chiếu",
		"Pronoun/antecedent — this/that/they refers to…",
	),
	tag("speaker", "Người nói / vai trò", "Ai nói, nghề nghiệp, vai trò"),
	tag("place", "Địa điểm", "Where — nơi diễn ra sự việc"),
	tag("problem", "Vấn đề", "Khó khăn hoặc issue được đề cập"),
	tag(
		"request",
		"Đề nghị / lời mời",
		"Could you, Would you, suggestion, invitation",
	),
	tag("next", "Hành động tiếp", "What will X do next? — bước tiếp theo"),
	tag(
		"intent",
		"Ý định người nói",
		"Nghĩa câu trích dẫn trong ngữ cảnh / giọng điệu",
	),
	tag(
		"graphic",
		"Graphic",
		"Look at the graphic — ghép thông tin với bảng/biểu đồ",
	),
];

const INSERT_SKILL = COMPREHENSION_SKILL_TAGS.find(
	(entry) => entry.value === "insert",
)!;

/** Part 6: grammar blanks + sentence insertion. */
export const TEXT_COMPLETION_SKILL_TAGS: ToeicTagOption[] = [
	...GRAMMAR_SKILL_TAGS,
	INSERT_SKILL,
];

/** Grammar trọng tâm — Reading Part 5–6. */
export const GRAMMAR_FOCUS_TAGS: ToeicTagOption[] = [
	tag(
		"time",
		"Thời gian",
		"Ngày, lịch, trạng từ thời gian, giới từ thời gian",
	),
	tag(
		"location",
		"Nơi chốn",
		"Giới từ không gian, hướng, địa điểm trong câu",
	),
	tag("number", "Số liệu", "Số lượng, giá, phần trăm"),
	tag("purpose", "Mục đích", "so that, in order to, mục tiêu hành động"),
	tag("contrast", "Tương phản", "despite, rather than, but, even though"),
	tag(
		"phrase",
		"Cụm cố định",
		"Multi-word unit — đọc cả cụm, không chỉ một từ",
	),
	tag("pos", "Loại từ", "Blank cần N/V/Adj/Adv cụ thể trong câu"),
	tag("semantics", "Nghĩa từ", "Chọn theo nuance/nghĩa phù hợp logic câu"),
];

/** Comprehension trọng tâm — Listening 3–4, Reading 7. */
export const COMPREHENSION_FOCUS_TAGS: ToeicTagOption[] = [
	tag("who", "Who", "Người, vai trò, ai thực hiện hành động"),
	tag("what", "What", "Sự việc, vật, nội dung"),
	tag("why", "Why", "Lý do, nguyên nhân, mục đích"),
	tag("how", "How", "Phương pháp, quy trình"),
	tag("time", "Thời gian", "When — mốc thời gian, lịch trình"),
	tag("number", "Số liệu", "Giá, số lượng, con số cụ thể"),
	tag("location", "Nơi chốn", "Where — địa điểm (pairs with place skill)"),
];

export const TOEIC_SKILL_TAGS: ToeicTagOption[] = [
	...GRAMMAR_SKILL_TAGS,
	...COMPREHENSION_SKILL_TAGS,
];

export const TOEIC_FOCUS_TAGS: ToeicTagOption[] = [
	...GRAMMAR_FOCUS_TAGS,
	...COMPREHENSION_FOCUS_TAGS.filter(
		(entry) =>
			!GRAMMAR_FOCUS_TAGS.some(
				(grammar) => grammar.value === entry.value,
			),
	),
];

/** @deprecated Use TOEIC_SKILL_TAGS */
export const TOEIC_QUESTION_TYPE_TAGS = TOEIC_SKILL_TAGS;

const TAG_BY_VALUE = new Map<string, ToeicTagOption>(
	[...TOEIC_TOPIC_TAGS, ...TOEIC_SKILL_TAGS, ...TOEIC_FOCUS_TAGS].map(
		(entry) => [entry.value, entry],
	),
);

/** Maps legacy or invented tag strings to canonical values on import. */
const TAG_ALIASES: Record<string, string> = {
	hr: "personnel",
	shopping: "purchasing",
	retail: "purchasing",
	facility: "property",
	production: "manufacturing",
	medical: "health",
	community: "general",
	media: "general",
	others: "general",
	topic: "main_idea",
	gerund: "verb_pattern",
	grammar: "word_form",
	synonym: "vocab_context",
	vocab: "vocab_context",
	not_mentioned: "not_stated",
	not_true: "not_stated",
	multi_passage: "compare",
	sentence_insertion: "insert",
	relative: "relative_clause",
	word_choice: "vocabulary",
	agreement: "sv_agreement",
	subject_verb_agreement: "sv_agreement",
	articles: "article",
	phrasal: "phrasal_verb",
	comparative: "comparison",
	superlative: "comparison",
	organization_structure: "organization",
	passage_structure: "organization",
	pronoun_reference: "reference",
	modal_verb: "modal",
	conditionals: "conditional",
};

const TOPIC_VALUES = new Set(TOEIC_TOPIC_TAGS.map((entry) => entry.value));
const SKILL_VALUES = new Set(TOEIC_SKILL_TAGS.map((entry) => entry.value));
const FOCUS_VALUES = new Set(TOEIC_FOCUS_TAGS.map((entry) => entry.value));

export const ALL_TAG_VALUES = new Set([
	...TOPIC_VALUES,
	...SKILL_VALUES,
	...FOCUS_VALUES,
]);

export function skillsForPart(part: number): ToeicTagOption[] {
	if (part === 5) return GRAMMAR_SKILL_TAGS;
	if (part === 6) return TEXT_COMPLETION_SKILL_TAGS;
	if (part === 3 || part === 4 || part === 7) return COMPREHENSION_SKILL_TAGS;
	return [];
}

export function focusesForPart(part: number): ToeicTagOption[] {
	if (part === 5 || part === 6) return GRAMMAR_FOCUS_TAGS;
	if (part === 3 || part === 4 || part === 7) return COMPREHENSION_FOCUS_TAGS;
	return [];
}

export function normalizeTagValue(raw: string): string | null {
	const trimmed = raw.trim();
	if (!trimmed) return null;
	const aliased = TAG_ALIASES[trimmed] ?? trimmed;
	return ALL_TAG_VALUES.has(aliased) ? aliased : null;
}

export function isTopicTag(value: string): boolean {
	return TOPIC_VALUES.has(value);
}

export function isSkillTag(value: string): boolean {
	return SKILL_VALUES.has(value);
}

export function isFocusTag(value: string): boolean {
	return FOCUS_VALUES.has(value);
}

/** @deprecated Use isSkillTag */
export function isQuestionTypeTag(value: string): boolean {
	return isSkillTag(value);
}

export function parseQuestionTags(raw: string[]): {
	topics: string[];
	skills: string[];
	focuses: string[];
	/** @deprecated Use skills */
	questionTypes: string[];
} {
	const topics: string[] = [];
	const skills: string[] = [];
	const focuses: string[] = [];

	for (const entry of raw) {
		const normalized = normalizeTagValue(entry);
		if (!normalized) continue;
		if (isTopicTag(normalized)) {
			if (!topics.includes(normalized)) topics.push(normalized);
		} else if (isSkillTag(normalized)) {
			if (!skills.includes(normalized)) skills.push(normalized);
		} else if (isFocusTag(normalized)) {
			if (!focuses.includes(normalized)) focuses.push(normalized);
		}
	}

	return { topics, skills, focuses, questionTypes: skills };
}

export function validateQuestionTags(tags: string[] | undefined): string[] {
	if (!tags?.length) return [];
	const seen = new Set<string>();
	const result: string[] = [];

	for (const entry of tags) {
		const normalized = normalizeTagValue(entry);
		if (!normalized || seen.has(normalized)) continue;
		seen.add(normalized);
		result.push(normalized);
	}

	return result;
}

export type QuestionTagsValidationResult =
	| { ok: true; tags: string[] }
	| { ok: false; tags: string[]; error: string };

export function validateQuestionTagsComplete(
	tags: string[] | undefined,
): QuestionTagsValidationResult {
	const normalized = validateQuestionTags(tags);

	if (normalized.length < MIN_QUESTION_TAGS) {
		return {
			ok: false,
			tags: normalized,
			error: `Mỗi câu cần ít nhất ${MIN_QUESTION_TAGS} tag hợp lệ (hiện có ${normalized.length}).`,
		};
	}

	const { skills, focuses } = parseQuestionTags(normalized);

	if (skills.length < 1) {
		return {
			ok: false,
			tags: normalized,
			error: "Thiếu tag Dạng câu — chọn ít nhất một trong danh sách dạng câu.",
		};
	}
	if (skills.length > MAX_SKILL_TAGS) {
		return {
			ok: false,
			tags: normalized,
			error: `Tối đa ${MAX_SKILL_TAGS} tag Dạng câu (hiện có ${skills.length}).`,
		};
	}
	if (focuses.length < 1) {
		return {
			ok: false,
			tags: normalized,
			error: "Thiếu tag Trọng tâm — chọn một trong danh sách trọng tâm (who, time, pos, …).",
		};
	}

	return { ok: true, tags: normalized };
}

export function findTagOption(value: string): ToeicTagOption | undefined {
	const canonical = normalizeTagValue(value) ?? value;
	return TAG_BY_VALUE.get(canonical);
}

export function formatTagChip(value: string): string {
	return findTagOption(value)?.chip_vi ?? value;
}

/** Canonical English slug for UI badges (matches import JSON / course books). */
export function formatTagEnglishValue(value: string): string {
	return normalizeTagValue(value) ?? value;
}

/** Vietnamese label + description for tooltip when badge shows English slug. */
export function formatTagCustomerTooltip(value: string): string {
	const option = findTagOption(value);
	if (!option) return value;
	return `${option.chip_vi} — ${option.description_vi}`;
}

export function formatTagLabel(value: string): string {
	return findTagOption(value)?.description_vi ?? value;
}

export function formatTagTooltip(value: string): string {
	const canonical = normalizeTagValue(value) ?? value;
	const option = findTagOption(canonical);
	if (!option) return canonical;
	return `${option.value} — ${option.description_vi}`;
}

export type ToeicTagCategory = "topic" | "skill" | "grammar";

const TAG_CATEGORY_ORDER: Record<ToeicTagCategory, number> = {
	topic: 0,
	skill: 1,
	grammar: 2,
};

/** Customer-facing sort: skill first, then focus, then topic. */
const CUSTOMER_TAG_CATEGORY_ORDER: Record<ToeicTagCategory, number> = {
	skill: 0,
	grammar: 1,
	topic: 2,
};

export type TagDisplayMode = "practice" | "catalog" | "full";

export function tagCategoryForValue(value: string): ToeicTagCategory | null {
	const normalized = normalizeTagValue(value);
	if (!normalized) return null;
	if (isTopicTag(normalized)) return "topic";
	if (isSkillTag(normalized)) return "skill";
	if (isFocusTag(normalized)) return "grammar";
	return null;
}

export function tagBadgeVariantForValue(
	value: string,
): "topic" | "skill" | "grammar" | "secondary" {
	const category = tagCategoryForValue(value);
	if (category === "topic") return "topic";
	if (category === "skill") return "skill";
	if (category === "grammar") return "grammar";
	return "secondary";
}

export function sortTagsForDisplay(tags: string[]): string[] {
	return [...tags].sort((a, b) => {
		const categoryA = tagCategoryForValue(a);
		const categoryB = tagCategoryForValue(b);
		const orderA =
			categoryA != null
				? TAG_CATEGORY_ORDER[categoryA]
				: Number.MAX_SAFE_INTEGER;
		const orderB =
			categoryB != null
				? TAG_CATEGORY_ORDER[categoryB]
				: Number.MAX_SAFE_INTEGER;
		if (orderA !== orderB) return orderA - orderB;
		return formatTagChip(a).localeCompare(formatTagChip(b), "vi");
	});
}

export function sortTagsForCustomerDisplay(tags: string[]): string[] {
	return [...tags].sort((a, b) => {
		const categoryA = tagCategoryForValue(a);
		const categoryB = tagCategoryForValue(b);
		const orderA =
			categoryA != null
				? CUSTOMER_TAG_CATEGORY_ORDER[categoryA]
				: Number.MAX_SAFE_INTEGER;
		const orderB =
			categoryB != null
				? CUSTOMER_TAG_CATEGORY_ORDER[categoryB]
				: Number.MAX_SAFE_INTEGER;
		if (orderA !== orderB) return orderA - orderB;
		return formatTagChip(a).localeCompare(formatTagChip(b), "vi");
	});
}

export function filterTagsForDisplay(
	tags: string[],
	mode: TagDisplayMode,
): string[] {
	const normalized = validateQuestionTags(tags);

	if (mode === "full") {
		return sortTagsForCustomerDisplay(normalized);
	}

	const { topics, skills, focuses } = parseQuestionTags(normalized);

	if (mode === "catalog") {
		return sortTagsForCustomerDisplay([...skills, ...focuses]);
	}

	// practice: skills + focuses + optional topic
	return sortTagsForCustomerDisplay([...skills, ...focuses, ...topics]);
}

export function collectUniqueQuestionTags(
	tagLists: Array<string[] | undefined>,
): string[] {
	const seen = new Set<string>();
	const collected: string[] = [];

	for (const list of tagLists) {
		for (const entry of validateQuestionTags(list)) {
			if (seen.has(entry)) continue;
			seen.add(entry);
			collected.push(entry);
		}
	}

	return sortTagsForDisplay(collected);
}
