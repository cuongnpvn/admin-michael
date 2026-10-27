export interface ListeningPart1ExplanationLine {
  label: "A" | "B" | "C" | "D";
  english: string;
  vietnamese: string;
  raw: string;
}

/** True when reasoning looks like Part 1 option translations (**A.** … **B.** …). */
export function isListeningPart1OptionTranslationExplanation(
  reasoning: string,
): boolean {
  const trimmed = reasoning.trim();
  if (!trimmed) {
    return false;
  }

  const lines = parseListeningPart1OptionTranslationLinesInternal(trimmed);
  const optionA = lines.find((line) => line.label === "A");
  const optionB = lines.find((line) => line.label === "B");

  // Require Vietnamese glosses (em dash) so Reading Part 6 insert explanations
  // (**A.** distractor lines without translations) are not misrouted here.
  return !!(optionA?.vietnamese && optionB?.vietnamese);
}

function splitPart1ExplanationChunks(reasoning: string): string[] {
  return reasoning
    .trim()
    .split(/\s*(?=\*\*[A-D]\.\*\*)/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

function splitEnglishVietnamese(body: string): {
  english: string;
  vietnamese: string;
} {
  const dashMatch = body.match(/^([\s\S]+?)\s+[—–-]\s+([\s\S]+)$/);
  if (!dashMatch) {
    return { english: body.trim(), vietnamese: "" };
  }

  return {
    english: dashMatch[1]!.trim(),
    vietnamese: dashMatch[2]!.trim(),
  };
}

/**
 * Parses Part 1 explanation text into one row per option label.
 * Handles newline-separated lines and single-paragraph AI output.
 */
export function parseListeningPart1OptionTranslationLines(
  reasoning: string,
): ListeningPart1ExplanationLine[] {
  if (!isListeningPart1OptionTranslationExplanation(reasoning)) {
    return [];
  }

  return parseListeningPart1OptionTranslationLinesInternal(reasoning);
}

function parseListeningPart1OptionTranslationLinesInternal(
  reasoning: string,
): ListeningPart1ExplanationLine[] {
  const lines: ListeningPart1ExplanationLine[] = [];

  for (const chunk of splitPart1ExplanationChunks(reasoning)) {
    const match = chunk.match(/^\*\*([A-D])\.\*\*\s*([\s\S]+)$/);
    if (!match) {
      continue;
    }

    const label = match[1] as ListeningPart1ExplanationLine["label"];
    const { english, vietnamese } = splitEnglishVietnamese(match[2]!);

    lines.push({
      label,
      english,
      vietnamese,
      raw: chunk,
    });
  }

  return lines.sort((a, b) => a.label.localeCompare(b.label));
}

/** Normalize Part 1 reasoning so markdown renders one paragraph per option. */
export function formatListeningPart1ExplanationForMarkdown(
  reasoning: string,
): string {
  const lines = parseListeningPart1OptionTranslationLines(reasoning);
  if (lines.length === 0) {
    return reasoning;
  }

  return lines.map((line) => line.raw).join("\n\n");
}

/** Lenient parse for CMS editing (allows missing Vietnamese glosses). */
export function parseListeningPart1OptionTranslationDraft(
  reasoning: string,
): ListeningPart1ExplanationLine[] {
  return parseListeningPart1OptionTranslationLinesInternal(reasoning.trim());
}

/** Serialize per-option EN/VI glosses back into Part 1 explanation reasoning. */
export function serializeListeningPart1OptionTranslationLines(
  lines: Array<{
    label: ListeningPart1ExplanationLine["label"];
    english: string;
    vietnamese: string;
  }>,
): string {
  return lines
    .map((line) => {
      const english = line.english.trim();
      const vietnamese = line.vietnamese.trim();
      if (!english && !vietnamese) return null;
      if (english && vietnamese) {
        return `**${line.label}.** ${english} — ${vietnamese}`;
      }
      if (english) return `**${line.label}.** ${english}`;
      return `**${line.label}.** — ${vietnamese}`;
    })
    .filter((line): line is string => Boolean(line))
    .join("\n");
}
