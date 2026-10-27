import type { QuestionTranslationEntry } from "@/types/ui";
import { findTranslationPositionInPassage } from "@/lib/reading/passage-highlight-dom";
import { stripPassageHtml } from "@/lib/reading/passage-html-text";

export function buildBilingualSentences(
  translations: QuestionTranslationEntry[],
): QuestionTranslationEntry[] {
  return translations.filter(
    (row) => row.english.trim().length > 0 || row.vietnamese.trim().length > 0,
  );
}

export function concatSentences(
  translations: QuestionTranslationEntry[],
  field: "english" | "vietnamese",
  separator = " ",
): string {
  return buildBilingualSentences(translations)
    .map((row) => row[field].trim())
    .filter(Boolean)
    .join(separator);
}

function collapsePassageWhitespace(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

/** Map translation rows onto passage paragraph breaks when possible. */
export function groupTranslationsByPassageParagraphs(
  passageContent: string,
  translations: QuestionTranslationEntry[],
): QuestionTranslationEntry[][] {
  const sentences = buildBilingualSentences(translations);
  if (sentences.length === 0) return [];

  const normalizedContent = stripPassageHtml(passageContent);

  const paragraphs = normalizedContent
    .replace(/\r\n/g, "\n")
    .split(/\n\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length <= 1) {
    return [sentences];
  }

  const groups: QuestionTranslationEntry[][] = paragraphs.map(() => []);
  let sentenceIndex = 0;

  for (let paragraphIndex = 0; paragraphIndex < paragraphs.length; paragraphIndex++) {
    const collapsed = collapsePassageWhitespace(paragraphs[paragraphIndex]);
    let position = 0;

    while (sentenceIndex < sentences.length) {
      const normalized = collapsePassageWhitespace(sentences[sentenceIndex].english);
      const match = findTranslationPositionInPassage(collapsed, normalized, position);
      if (!match) break;
      groups[paragraphIndex].push(sentences[sentenceIndex]);
      sentenceIndex++;
      position = match.end;
    }
  }

  if (sentenceIndex < sentences.length) {
    const lastGroup = groups.at(-1);
    if (lastGroup) {
      lastGroup.push(...sentences.slice(sentenceIndex));
    } else {
      groups.push(sentences.slice(sentenceIndex));
    }
  }

  return groups.filter((group) => group.length > 0);
}

/** Split a combined passage-set translation list across multiple passages. */
export function splitTranslationsByPassages(
  passages: Array<{ content: string }>,
  translations: QuestionTranslationEntry[],
): QuestionTranslationEntry[][] {
  const sentences = buildBilingualSentences(translations);
  if (sentences.length === 0) {
    return passages.map(() => []);
  }
  if (passages.length <= 1) {
    return [sentences];
  }

  const groups: QuestionTranslationEntry[][] = passages.map(() => []);
  let sentenceIndex = 0;

  for (let passageIndex = 0; passageIndex < passages.length; passageIndex++) {
    const collapsed = collapsePassageWhitespace(
      stripPassageHtml(passages[passageIndex].content),
    );
    let position = 0;

    while (sentenceIndex < sentences.length) {
      const normalized = collapsePassageWhitespace(
        sentences[sentenceIndex].english,
      );
      const match = findTranslationPositionInPassage(collapsed, normalized, position);
      if (!match) break;
      groups[passageIndex].push(sentences[sentenceIndex]);
      sentenceIndex++;
      position = match.end;
    }
  }

  if (sentenceIndex < sentences.length) {
    const lastGroup = groups.at(-1);
    if (lastGroup) {
      lastGroup.push(...sentences.slice(sentenceIndex));
    } else {
      groups.push(sentences.slice(sentenceIndex));
    }
  }

  return groups;
}

export function resolvePassageSetTranslations(
  questions: Array<{ translations?: QuestionTranslationEntry[] }>,
): QuestionTranslationEntry[] {
  for (const question of questions) {
    if (question.translations?.length) {
      return question.translations;
    }
  }
  return [];
}
