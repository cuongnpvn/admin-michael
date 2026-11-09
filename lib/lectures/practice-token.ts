/** Typed in lecture HTML, then a section number: `mid-practice-1`. */
export const MID_PRACTICE_PREFIX = "mid-practice-";

const MID_PRACTICE_TOKEN = new RegExp(
  `(<[^>]*>)|(\\b${MID_PRACTICE_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\d+)\\b)`,
  "g",
);

export function midLectureTitles(
  questions: readonly {
    kind?: string;
    payload: { section?: number; groupTitle?: string };
  }[],
): ReadonlyMap<number, string> {
  const titles = new Map<number, string>();
  let groupIndex = 0;
  let previous = "";
  for (const question of questions) {
    const title = question.payload.groupTitle?.trim() ?? "";
    const section = question.payload.section;
    const sectionNumber = section != null && section > 0 ? section : 0;
    const signature = `${question.kind ?? ""}|${sectionNumber}|${title}`;
    if (signature === previous) continue;
    previous = signature;
    groupIndex += 1;
    if (title && !titles.has(groupIndex)) titles.set(groupIndex, title);
  }
  return titles;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Turn a practice token in text into the link the lecture drawer already opens. */
export function rewriteMidPracticeTokens(
  html: string,
  titles?: ReadonlyMap<number, string>,
): string {
  return html.replace(
    MID_PRACTICE_TOKEN,
    (match, tag?: string, _token?: string, digits?: string) => {
      if (tag || !digits || !/^[1-9]\d*$/.test(digits)) return match;
      const title = titles?.get(Number(digits))?.trim();
      const label = title || `mid-lecture ${digits}`;
      return `<a href="#exercise-${digits}">${escapeHtml(label)}</a>`;
    },
  );
}
