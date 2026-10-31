import type { SupabaseClient } from "@supabase/supabase-js";
import { buildListeningWholeAudioPath } from "@/lib/content/listening-audio-paths";
import { AUDIOS_BUCKET } from "@/lib/content/media-storage-paths";
import {
  part1SpokenLines,
  part2SpokenLines,
  type Part12OptionLine,
} from "@/lib/listening/part12-spoken-lines";
import type { SpeechSentence } from "@/lib/listening/speech-sentences";

export interface ListeningPart12SentenceAlignmentExport {
  part: 1 | 2;
  questionId: string;
  questionRowId: string;
  globalItemNumber: number;
  sentences: SpeechSentence[];
  audioStorageBucket: string;
  audioStoragePath: string;
}

interface QuestionAudioRow {
  id: string;
  slug: string;
  part: string;
  global_item_number: number;
  audio_asset_id: string | null;
}

interface OptionRow {
  text: string;
  sort_order: number;
}

function spokenLines(
  part: 1 | 2,
  transcript: string,
  options: Part12OptionLine[],
): SpeechSentence[] {
  return part === 1 ? part1SpokenLines(options) : part2SpokenLines(transcript, options);
}

export async function buildListeningPart12SentenceAlignmentExport(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  questionRowId: string,
): Promise<ListeningPart12SentenceAlignmentExport> {
  const { data: question, error: questionError } = await supabase
    .from("questions")
    .select("id, slug, part, global_item_number, audio_asset_id")
    .eq("id", questionRowId)
    .eq("book_id", bookId)
    .eq("test_id", testId)
    .maybeSingle();

  if (questionError) throw questionError;
  if (!question) {
    throw new Error("Listening question not found.");
  }

  const row = question as QuestionAudioRow;
  if (row.part !== "1" && row.part !== "2") {
    throw new Error("Sentence alignment is only available for Parts 1 and 2.");
  }
  if (!row.slug) {
    throw new Error("Listening question not found.");
  }

  const part = row.part === "1" ? 1 : 2;

  const { data: optionRows, error: optionsError } = await supabase
    .from("answer_options")
    .select("text, sort_order")
    .eq("question_id", row.id)
    .order("sort_order", { ascending: true });

  if (optionsError) throw optionsError;

  let transcript = "";
  let audioAssetId = part === 1 ? row.audio_asset_id : null;

  if (part === 1) {
    const { data: part1, error: part1Error } = await supabase
      .from("listening_part1_items")
      .select("question_id")
      .eq("question_id", row.id)
      .maybeSingle();
    if (part1Error) throw part1Error;
    if (!part1) {
      throw new Error("Listening question not found.");
    }
  } else {
    const { data: part2, error: part2Error } = await supabase
      .from("listening_part2_items")
      .select("transcript, audio_asset_id")
      .eq("question_id", row.id)
      .maybeSingle();
    if (part2Error) throw part2Error;
    if (!part2) {
      throw new Error("Listening question not found.");
    }
    transcript = (part2.transcript as string | null) ?? "";
    audioAssetId = (part2.audio_asset_id as string | null) ?? null;
  }

  const options: Part12OptionLine[] = ((optionRows ?? []) as OptionRow[]).map(
    (option) => ({
      text: option.text ?? "",
      sortOrder: option.sort_order,
    }),
  );
  const sentences = spokenLines(part, transcript, options);
  if (sentences.length === 0) {
    throw new Error("Listening question has no speech sentences.");
  }

  let audioStorageBucket = AUDIOS_BUCKET;
  let audioStoragePath: string | null = null;

  if (audioAssetId) {
    const { data: asset, error: assetError } = await supabase
      .from("media_assets")
      .select("storage_bucket, storage_path")
      .eq("id", audioAssetId)
      .maybeSingle();

    if (assetError) throw assetError;
    if (asset?.storage_path) {
      audioStorageBucket = (asset.storage_bucket as string) || AUDIOS_BUCKET;
      audioStoragePath = asset.storage_path as string;
    }
  }

  if (!audioStoragePath) {
    audioStoragePath = buildListeningWholeAudioPath(
      bookId,
      testId,
      row.global_item_number,
    );
  }

  return {
    part,
    questionId: row.slug,
    questionRowId: row.id,
    globalItemNumber: row.global_item_number,
    sentences,
    audioStorageBucket,
    audioStoragePath,
  };
}
