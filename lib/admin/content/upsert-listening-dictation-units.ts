import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ListeningDictationSegment,
  ListeningDictationUnit,
} from "@/lib/admin/content/listening-dictation-unit";
import { normalizeTurnEnglish } from "@/lib/listening/speaker-turns";

function keptTranslations(value: unknown): Map<string, string> {
  const kept = new Map<string, string>();
  if (!Array.isArray(value)) return kept;
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const text = typeof row.text === "string" ? normalizeTurnEnglish(row.text) : "";
    const translation =
      typeof row.translation === "string" ? row.translation.trim() : "";
    if (text && translation && !kept.has(text)) kept.set(text, translation);
  }
  return kept;
}

function mergeTranslations(
  segments: ListeningDictationSegment[],
  previous: unknown,
): ListeningDictationSegment[] {
  const kept = keptTranslations(previous);
  return segments.map((segment) => {
    if (segment.translation) return segment;
    const translation = kept.get(normalizeTurnEnglish(segment.text));
    return translation ? { ...segment, translation } : segment;
  });
}

export async function upsertListeningDictationUnits(
  supabase: SupabaseClient,
  units: ListeningDictationUnit[],
): Promise<number> {
  if (units.length === 0) return 0;

  const { data: existingRows, error: existingError } = await supabase
    .from("dictation_items")
    .select("id, audio_path, segments")
    .in(
      "audio_path",
      units.map((unit) => unit.audioPath),
    );

  if (existingError) throw existingError;

  const existingByPath = new Map<
    string,
    Array<{ id: string; segments: unknown }>
  >();
  for (const row of (existingRows ?? []) as Array<{
    id: string;
    audio_path: string;
    segments: unknown;
  }>) {
    const list = existingByPath.get(row.audio_path) ?? [];
    list.push({ id: row.id, segments: row.segments });
    existingByPath.set(row.audio_path, list);
  }

  let written = 0;

  for (const unit of units) {
    const existing = existingByPath.get(unit.audioPath) ?? [];
    if (existing.length > 0) {
      for (const row of existing) {
        const segments = mergeTranslations(unit.segments, row.segments);
        const patch: Record<string, unknown> = {
          item_type: unit.itemType,
          transcript: unit.transcript,
          segments,
        };
        if (unit.imagePath) patch.image_path = unit.imagePath;
        const { error } = await supabase
          .from("dictation_items")
          .update(patch)
          .eq("id", row.id);
        if (error) throw error;
        written += 1;
      }
      continue;
    }

    const { data: set, error: setError } = await supabase
      .from("dictation_sets")
      .insert({
        title: unit.title,
        topic: unit.topic,
        topic_sort: unit.topicSort,
        level_label: "A2",
        level_rank: 2,
        sort_order: unit.sortOrder,
        published: false,
      })
      .select("id")
      .single();

    if (setError) throw setError;

    const setId = (set as { id: string }).id;
    const { error: itemError } = await supabase.from("dictation_items").insert({
      set_id: setId,
      item_type: unit.itemType,
      sort_order: 0,
      audio_path: unit.audioPath,
      image_path: unit.imagePath,
      transcript: unit.transcript,
      hints: [],
      segments: unit.segments,
    });

    if (itemError) {
      await supabase.from("dictation_sets").delete().eq("id", setId);
      throw itemError;
    }
    written += 1;
  }

  return written;
}
