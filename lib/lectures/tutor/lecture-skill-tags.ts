import { isSkillTag, normalizeTagValue } from "@/lib/content/toeic-tags";
import { copy } from "@/lib/copy/vi";

/** Vietnamese / freeform lecture tags → canonical English skill slugs. */
const LECTURE_SKILL_ALIASES: Record<string, string> = {
  "thể bị động": "passive",
  "bị động": "passive",
  "giới từ": "preposition",
  "cụm giới từ": "preposition",
  "hòa hợp": "sv_agreement",
  "sự hòa hợp chủ ngữ động từ": "sv_agreement",
  "liên từ": "conjunction",
  "so sánh": "comparison",
  "so sánh bằng": "comparison",
  "so sánh hơn": "comparison",
  "so sánh nhất": "comparison",
  thì: "verb_tense",
  "các thì trong tiếng anh": "verb_tense",
  "động từ": "verb_tense",
  "đại từ": "pronoun",
  "đại từ bất định": "pronoun",
  "tính từ": "word_form",
  "trạng từ": "word_form",
  "cụm danh từ": "word_form",
  "danh từ": "word_form",
  "từ loại": "word_form",
  "phân từ": "word_form",
  "v-ing": "word_form",
  "v-ed": "word_form",
};

/** Course skill values → Part 5 question tags used for tutor drills. */
const COURSE_SKILL_DRILLS: Record<string, readonly string[]> = {
  sentence: [],
  noun: ["word_form"],
  noun_phrase: ["word_form"],
  adjective: ["word_form"],
  pronoun_adverb: ["pronoun", "word_form"],
  verb_tense: ["verb_tense"],
  passive: ["passive"],
  preposition: ["preposition"],
  conjunction: ["conjunction"],
  relative_clause: ["relative_clause"],
  sv_agreement: ["sv_agreement"],
  contracts: ["vocabulary"],
  marketing: ["vocabulary"],
  warranties: ["vocabulary"],
  business_planning: ["vocabulary"],
  conferences: ["vocabulary"],
  office_tech: ["vocabulary"],
  recruiting: ["vocabulary"],
  interviewing: ["vocabulary"],
  electronics: ["vocabulary"],
  correspondence: ["vocabulary"],
  hiring_training: ["vocabulary"],
  salaries_benefits: ["vocabulary"],
  promotions: ["vocabulary"],
  shopping: ["vocabulary"],
  supplies: ["vocabulary"],
  shipping: ["vocabulary"],
  invoices: ["vocabulary"],
  inventory: ["vocabulary"],
};

const SKIP_LECTURE_TAG_KEYS = new Set([
  "part 5",
  "part 6",
  "part-5",
  "part-6",
  "ngữ pháp",
  "grammar",
  "câu đơn",
  "ngoại động từ",
  "rút gọn mệnh đề",
  "danh từ riêng",
]);

function normalizeLectureTagKey(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toLocaleLowerCase("vi");
}

export function resolveLectureSkillTags(tags: string[]): string[] {
  const skills: string[] = [];
  const seen = new Set<string>();

  function add(skill: string) {
    if (!isSkillTag(skill) || seen.has(skill)) return;
    seen.add(skill);
    skills.push(skill);
  }

  for (const tag of tags) {
    const key = normalizeLectureTagKey(tag);
    if (!key || SKIP_LECTURE_TAG_KEYS.has(key)) continue;
    const drills = COURSE_SKILL_DRILLS[key];
    if (drills) {
      for (const skill of drills) add(skill);
      continue;
    }
    const aliased = LECTURE_SKILL_ALIASES[key] ?? key;
    add(normalizeTagValue(aliased) ?? aliased);
  }

  return skills;
}

export function tutorPracticeUnavailableMessage(tags: string[]): string | null {
  if (resolveLectureSkillTags(tags).length === 0) {
    return copy.lectures.tutorPracticeEmpty;
  }
  return null;
}
