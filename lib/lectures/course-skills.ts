export type CourseSkillGroup = "grammar" | "vocabulary";

export type CourseSkill = {
  value: string;
  label: string;
  group: CourseSkillGroup;
};

export const COURSE_SKILLS: CourseSkill[] = [
  { value: "sentence", label: "Câu đơn", group: "grammar" },
  { value: "noun", label: "Danh từ", group: "grammar" },
  { value: "noun_phrase", label: "Cụm danh từ", group: "grammar" },
  { value: "adjective", label: "Tính từ", group: "grammar" },
  { value: "pronoun_adverb", label: "Đại từ và trạng từ", group: "grammar" },
  { value: "verb_tense", label: "Thì cơ bản", group: "grammar" },
  { value: "passive", label: "Bị động", group: "grammar" },
  { value: "preposition", label: "Giới từ", group: "grammar" },
  { value: "conjunction", label: "Liên từ", group: "grammar" },
  { value: "relative_clause", label: "Mệnh đề quan hệ", group: "grammar" },
  { value: "sv_agreement", label: "Hòa hợp chủ–vị", group: "grammar" },
  { value: "contracts", label: "Hợp đồng", group: "vocabulary" },
  { value: "marketing", label: "Tiếp thị", group: "vocabulary" },
  { value: "warranties", label: "Bảo hành", group: "vocabulary" },
  { value: "business_planning", label: "Kế hoạch kinh doanh", group: "vocabulary" },
  { value: "conferences", label: "Hội nghị", group: "vocabulary" },
  { value: "office_tech", label: "Máy tính và thiết bị", group: "vocabulary" },
  { value: "recruiting", label: "Tuyển dụng", group: "vocabulary" },
  { value: "interviewing", label: "Phỏng vấn", group: "vocabulary" },
  { value: "electronics", label: "Thiết bị điện tử", group: "vocabulary" },
  { value: "correspondence", label: "Thư từ", group: "vocabulary" },
  { value: "hiring_training", label: "Thuê và đào tạo", group: "vocabulary" },
  { value: "salaries_benefits", label: "Lương và phúc lợi", group: "vocabulary" },
  { value: "promotions", label: "Thăng chức", group: "vocabulary" },
  { value: "shopping", label: "Mua sắm", group: "vocabulary" },
  { value: "supplies", label: "Đặt hàng", group: "vocabulary" },
  { value: "shipping", label: "Vận chuyển", group: "vocabulary" },
  { value: "invoices", label: "Hóa đơn", group: "vocabulary" },
  { value: "inventory", label: "Tồn kho", group: "vocabulary" },
];

const COURSE_SKILL_BY_VALUE = new Map(COURSE_SKILLS.map((skill) => [skill.value, skill]));

export function courseSkillsInGroup(group: CourseSkillGroup): CourseSkill[] {
  return COURSE_SKILLS.filter((skill) => skill.group === group);
}

export function courseSkillLabel(value: string): string {
  return COURSE_SKILL_BY_VALUE.get(value)?.label ?? value;
}
