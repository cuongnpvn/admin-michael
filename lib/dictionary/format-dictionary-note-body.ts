import type { NormalizedDictionaryEntry } from "@/lib/dictionary/minhqnd-types";
import { escapeHtml } from "@/lib/notebook/escape-html";
import { wrapExampleQuotes } from "@/lib/notebook/wrap-example-quotes";

function dedupeMeanings(
  meanings: NormalizedDictionaryEntry["meanings"],
): NormalizedDictionaryEntry["meanings"] {
  const seen = new Set<string>();
  const result: NormalizedDictionaryEntry["meanings"] = [];

  for (const meaning of meanings) {
    const key = `${meaning.pos ?? ""}::${meaning.definition}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(meaning);
  }

  return result;
}

export function formatDictionaryNoteBody(
  entry: Pick<NormalizedDictionaryEntry, "pronunciations" | "meanings">,
): string {
  const parts: string[] = [];
  const meanings = dedupeMeanings(entry.meanings);

  if (entry.pronunciations.length > 0) {
    parts.push(`<p><em>${escapeHtml(entry.pronunciations[0]!)}</em></p>`);
  }

  const listItems = meanings.map((meaning) => {
    const posPrefix = meaning.pos
      ? `<strong>${escapeHtml(meaning.pos)}:</strong> `
      : "";
    const definition = escapeHtml(meaning.definition);
    const example = meaning.example?.trim()
      ? `<br><em>${escapeHtml(wrapExampleQuotes(meaning.example.trim()))}</em>`
      : "";

    return `<li>${posPrefix}${definition}${example}</li>`;
  });

  parts.push(`<ul>${listItems.join("")}</ul>`);
  return parts.join("");
}
