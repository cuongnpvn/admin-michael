import { COURSE_SKILLS } from "@/lib/lectures/course-skills";

const COURSE_SKILL_VALUES = new Set(COURSE_SKILLS.map((skill) => skill.value));

/** Keep known course skills only, in catalog order. */
export function normalizeLectureTags(values: unknown): string[] {
  const raw = Array.isArray(values)
    ? values
    : typeof values === "string"
      ? values.split(",")
      : [];

  const wanted = new Set<string>();
  for (const value of raw) {
    const key = String(value ?? "").trim().toLowerCase();
    if (COURSE_SKILL_VALUES.has(key)) wanted.add(key);
  }

  return COURSE_SKILLS.filter((skill) => wanted.has(skill.value)).map((skill) => skill.value);
}
