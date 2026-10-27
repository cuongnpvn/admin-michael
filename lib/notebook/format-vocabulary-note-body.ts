import { escapeHtml } from "@/lib/notebook/escape-html";
import type { VocabularyCefrLevel } from "@/lib/vocabulary/cefr-level";

export interface VocabularyNoteBodyInput {
  lemma?: string | null;
  ipaUs?: string | null;
  ipaUk?: string | null;
  wordTypes?: string[];
  meaningVi?: string | null;
  definitionEn?: string | null;
  example?: string | null;
  synonyms?: string[];
  collocations?: string[];
  level?: VocabularyCefrLevel | null;
}

export interface VocabularyNoteBodyLabels {
  synonyms: string;
  collocations: string;
  englishPrefix: string;
  example?: string;
  lemma?: string;
  level?: string;
}

const DEFAULT_LABELS: VocabularyNoteBodyLabels = {
  synonyms: "Từ đồng nghĩa",
  collocations: "Cụm từ",
  englishPrefix: "EN",
  example: "Ví dụ",
  lemma: "Lemma",
  level: "Trình độ",
};

function formatIpaLine(ipaUs: string | null | undefined, ipaUk: string | null | undefined): string | null {
  const us = ipaUs?.trim();
  const uk = ipaUk?.trim();

  if (us && uk && us !== uk) {
    return `US: ${us} · UK: ${uk}`;
  }
  if (us) return us;
  if (uk) return uk;
  return null;
}

export function formatVocabularyNoteBody(
  input: VocabularyNoteBodyInput,
  labels: VocabularyNoteBodyLabels = DEFAULT_LABELS,
): string {
  const parts: string[] = [];

  const level = input.level;
  if (level) {
    const levelLabel = labels.level ?? DEFAULT_LABELS.level!;
    parts.push(
      `<p><strong>${escapeHtml(levelLabel)}:</strong> ${escapeHtml(level)}</p>`,
    );
  }

  const lemma = input.lemma?.trim();
  if (lemma) {
    const lemmaLabel = labels.lemma ?? DEFAULT_LABELS.lemma!;
    parts.push(
      `<p><strong>${escapeHtml(lemmaLabel)}:</strong> ${escapeHtml(lemma)}</p>`,
    );
  }

  const ipaLine = formatIpaLine(input.ipaUs, input.ipaUk);
  if (ipaLine) {
    parts.push(`<p><em>${escapeHtml(ipaLine)}</em></p>`);
  }

  const meaningVi = input.meaningVi?.trim();
  const definitionEn = input.definitionEn?.trim();
  const wordTypes = (input.wordTypes ?? []).filter(Boolean);

  if (meaningVi || definitionEn) {
    const posPrefix =
      wordTypes.length > 0
        ? `<strong>${escapeHtml(wordTypes.join(", "))}:</strong> `
        : "";
    const viPart = meaningVi ? escapeHtml(meaningVi) : "";
    const enPart = definitionEn
      ? `<br><em>${escapeHtml(labels.englishPrefix)}: ${escapeHtml(definitionEn)}</em>`
      : "";

    parts.push(`<ul><li>${posPrefix}${viPart}${enPart}</li></ul>`);
  }

  const example = input.example?.trim();
  if (example) {
    const exampleLabel = labels.example ?? DEFAULT_LABELS.example!;
    parts.push(
      `<p><strong>${escapeHtml(exampleLabel)}:</strong> ${escapeHtml(example)}</p>`,
    );
  }

  const synonyms = (input.synonyms ?? []).filter(Boolean);
  if (synonyms.length > 0) {
    parts.push(
      `<p><strong>${escapeHtml(labels.synonyms)}:</strong> ${escapeHtml(synonyms.join(", "))}</p>`,
    );
  }

  const collocations = (input.collocations ?? []).filter(Boolean);
  if (collocations.length > 0) {
    parts.push(
      `<p><strong>${escapeHtml(labels.collocations)}:</strong> ${escapeHtml(collocations.join("; "))}</p>`,
    );
  }

  return parts.join("");
}

export function defaultVocabularyNoteTags(
  input: Pick<VocabularyNoteBodyInput, "collocations">,
): Array<"meaning" | "collocation"> {
  const tags: Array<"meaning" | "collocation"> = ["meaning"];
  if ((input.collocations ?? []).some(Boolean)) {
    tags.push("collocation");
  }
  return tags;
}
