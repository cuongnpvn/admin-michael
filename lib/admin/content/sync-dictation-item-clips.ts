import type { SupabaseClient } from "@supabase/supabase-js";
import type { QuestionTranslationEntry } from "@/lib/content/draft-types";
import { normalizeTurnEnglish } from "@/lib/listening/speaker-turns";
import type { TranscriptSegment } from "@/lib/listening/transcript-segments";

function translationFor(
  english: string,
  entries: QuestionTranslationEntry[],
): string | undefined {
  const target = normalizeTurnEnglish(english);
  for (const entry of entries) {
    if (normalizeTurnEnglish(entry.english) !== target) continue;
    const vietnamese = entry.vietnamese.trim();
    if (vietnamese) return vietnamese;
  }
  return undefined;
}

/** Keep a Vietnamese line from the previous dictation payload, including a combined blob. */
function previousTranslations(value: unknown): Map<string, string> {
  const kept = new Map<string, string>();
  if (!Array.isArray(value)) return kept;

  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const text = typeof row.text === "string" ? row.text : "";
    const translation = typeof row.translation === "string" ? row.translation : "";
    const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
    const translated = translation.split(/\n+/).map((line) => line.trim()).filter(Boolean);
    if (lines.length > 1) {
      lines.forEach((line, index) => {
        const vietnamese = translated[index];
        if (vietnamese) kept.set(normalizeTurnEnglish(line), vietnamese);
      });
      continue;
    }
    const line = lines[0];
    const vietnamese = translated[0];
    if (line && vietnamese) kept.set(normalizeTurnEnglish(line), vietnamese);
  }

  return kept;
}

/** Write sentence clips onto the published dictation item that uses this audio file. */
export async function syncDictationItemClips(
  supabase: SupabaseClient,
  audioPath: string,
  segments: TranscriptSegment[],
  translations: QuestionTranslationEntry[],
): Promise<void> {
  const { data, error } = await supabase
    .from("dictation_items")
    .select("id, segments")
    .eq("audio_path", audioPath);

  if (error) throw error;

  const rows = (data ?? []) as Array<{ id: string; segments: unknown }>;
  for (const row of rows) {
    const previous = previousTranslations(row.segments);
    const next = segments.map((segment) => {
      const translation =
        translationFor(segment.english, translations) ??
        previous.get(normalizeTurnEnglish(segment.english));
      return {
        index: segment.index,
        text: segment.english,
        startSec: segment.startSec,
        endSec: segment.endSec,
        ...(translation ? { translation } : {}),
      };
    });

    const { error: updateError } = await supabase
      .from("dictation_items")
      .update({
        transcript: segments.map((segment) => segment.english).join("\n"),
        segments: next,
      })
      .eq("id", row.id);

    if (updateError) throw updateError;
  }
}
