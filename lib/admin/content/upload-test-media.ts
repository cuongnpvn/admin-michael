import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildListeningPartAudioStoragePath,
  buildListeningTestAudioStoragePath,
  AUDIOS_BUCKET,
  IMAGES_BUCKET,
  buildPublicAssetUrlForBucket,
} from "@/lib/content/media-storage-paths";
import { buildListeningPart1ImagePath } from "@/lib/content/listening-image-paths";
import { upsertMediaAssetByPath } from "@/lib/admin/content/media-asset-upsert";

const LISTENING_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
];

export async function uploadListeningTestAudioFile(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  file: File,
): Promise<void> {
  if (file.type && !LISTENING_AUDIO_TYPES.includes(file.type)) {
    throw new Error("Định dạng audio không hỗ trợ. Dùng MP3, M4A hoặc WAV.");
  }

  const storagePath = buildListeningTestAudioStoragePath(bookId, testId);

  const { error: uploadError } = await supabase.storage
    .from(AUDIOS_BUCKET)
    .upload(storagePath, file, {
      upsert: true,
      contentType: file.type || "audio/mpeg",
    });

  if (uploadError) throw uploadError;

  const assetId = await upsertMediaAssetByPath(
    supabase,
    bookId,
    testId,
    "audio",
    storagePath,
    file.type || "audio/mpeg",
  );

  const { error } = await supabase
    .from("tests")
    .update({ listening_audio_asset_id: assetId })
    .eq("book_id", bookId)
    .eq("id", testId);

  if (error) throw error;
}

export async function linkListeningPartAudioAsset(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  part: 1 | 2 | 3 | 4,
  storagePath: string,
  contentType: string,
): Promise<void> {
  const assetId = await upsertMediaAssetByPath(
    supabase,
    bookId,
    testId,
    "audio",
    storagePath,
    contentType,
  );

  const { error } = await supabase
    .from("test_parts")
    .update({ audio_asset_id: assetId })
    .eq("book_id", bookId)
    .eq("test_id", testId)
    .eq("part", String(part));

  if (error) throw error;
}

export async function uploadListeningPartAudioFiles(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  files: Partial<Record<1 | 2 | 3 | 4, File>>,
): Promise<void> {
  for (const part of [1, 2, 3, 4] as const) {
    const file = files[part];
    if (!file || file.size === 0) continue;

    if (file.type && !LISTENING_AUDIO_TYPES.includes(file.type)) {
      throw new Error(`Audio Part ${part}: định dạng không hỗ trợ. Dùng MP3, M4A hoặc WAV.`);
    }

    const storagePath = buildListeningPartAudioStoragePath(bookId, testId, part);

    const { error: uploadError } = await supabase.storage
      .from(AUDIOS_BUCKET)
      .upload(storagePath, file, {
        upsert: true,
        contentType: file.type || "audio/mpeg",
      });

    if (uploadError) throw uploadError;

    await linkListeningPartAudioAsset(
      supabase,
      bookId,
      testId,
      part,
      storagePath,
      file.type || "audio/mpeg",
    );
  }
}

/** Upload Part 1 photographs to images/{bookId}/{testId}/1.png … 6.png */
export async function uploadPart1ImageFiles(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  files: (File | null)[],
): Promise<void> {
  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select("id, global_item_number")
    .eq("book_id", bookId)
    .eq("test_id", testId)
    .eq("part", "1")
    .order("global_item_number", { ascending: true });

  if (questionsError) throw questionsError;

  for (const [index, file] of files.entries()) {
    if (!file || file.size === 0) continue;

    const slot = index + 1;
    if (slot < 1 || slot > 6) continue;

    if (file.type && file.type !== "image/png") {
      throw new Error(`Ảnh Part 1 #${slot}: chỉ chấp nhận file .png.`);
    }
    if (!file.name.toLowerCase().endsWith(".png")) {
      throw new Error(`Ảnh Part 1 #${slot}: chỉ chấp nhận file .png.`);
    }

    const storagePath = buildListeningPart1ImagePath(
      bookId,
      testId,
      slot,
      "png",
    );

    const { error: uploadError } = await supabase.storage
      .from(IMAGES_BUCKET)
      .upload(storagePath, file, {
        upsert: true,
        contentType: "image/png",
      });

    if (uploadError) throw uploadError;

    const assetId = await upsertMediaAssetByPath(
      supabase,
      bookId,
      testId,
      "image",
      storagePath,
      "image/png",
    );

    const question = questions?.find((row) => row.global_item_number === slot);
    if (!question) continue;

    const { error } = await supabase.from("listening_part1_items").upsert(
      {
        question_id: question.id,
        image_asset_id: assetId,
      },
      { onConflict: "question_id" },
    );

    if (error) throw error;
  }
}

export { buildPublicAssetUrlForBucket };
