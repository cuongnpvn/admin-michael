import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildListeningGroupRangeAudioPath,
  groupGlobalRange,
} from "@/lib/content/listening-audio-paths";
import { AUDIOS_BUCKET } from "@/lib/content/media-storage-paths";
import {
  resolveSpeakerTurns,
  type SpeakerTurn,
} from "@/lib/listening/speaker-turns";

export interface ListeningPart3TurnAlignmentExport {
  questionId: string;
  listeningGroupId: string;
  transcript: string;
  turns: SpeakerTurn[];
  audioStorageBucket: string;
  audioStoragePath: string;
}

export async function buildListeningPart3TurnAlignmentExport(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  listeningGroupId: string,
): Promise<ListeningPart3TurnAlignmentExport> {
  const { data: group, error: groupError } = await supabase
    .from("listening_groups")
    .select("id, part, transcript, audio_asset_id")
    .eq("id", listeningGroupId)
    .eq("book_id", bookId)
    .eq("test_id", testId)
    .maybeSingle();

  if (groupError) throw groupError;
  if (!group) {
    throw new Error("Listening group not found.");
  }
  if (group.part !== "3") {
    throw new Error("Turn alignment is only available for Part 3.");
  }

  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select("slug, global_item_number")
    .eq("listening_group_id", listeningGroupId)
    .eq("book_id", bookId)
    .eq("test_id", testId)
    .order("global_item_number", { ascending: true });

  if (questionsError) throw questionsError;

  const anchor = questions?.[0];
  if (!anchor?.slug) {
    throw new Error("Listening group has no questions.");
  }

  const turns = resolveSpeakerTurns(group.transcript ?? "");
  if (turns.length === 0) {
    throw new Error("Listening group has no speaker turns.");
  }

  let audioStorageBucket = AUDIOS_BUCKET;
  let audioStoragePath: string | null = null;

  if (group.audio_asset_id) {
    const { data: asset, error: assetError } = await supabase
      .from("media_assets")
      .select("storage_bucket, storage_path")
      .eq("id", group.audio_asset_id)
      .maybeSingle();

    if (assetError) throw assetError;
    if (asset?.storage_path) {
      audioStorageBucket = asset.storage_bucket || AUDIOS_BUCKET;
      audioStoragePath = asset.storage_path;
    }
  }

  if (!audioStoragePath) {
    const range = groupGlobalRange(
      (questions ?? []).map((question) => question.global_item_number),
    );
    if (!range) {
      throw new Error("Listening group has no audio.");
    }
    audioStoragePath = buildListeningGroupRangeAudioPath(
      bookId,
      testId,
      range.start,
      range.end,
    );
  }

  return {
    questionId: anchor.slug,
    listeningGroupId: group.id,
    transcript: group.transcript ?? "",
    turns,
    audioStorageBucket,
    audioStoragePath,
  };
}
