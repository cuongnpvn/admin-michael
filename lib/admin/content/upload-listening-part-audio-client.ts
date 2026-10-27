import { createClient } from "@/lib/supabase/client";
import { linkListeningPartAudio } from "@/lib/admin/content/link-listening-part-audio";
import {
  buildListeningPartAudioStoragePath,
  AUDIOS_BUCKET,
} from "@/lib/content/media-storage-paths";
import { copy } from "@/lib/copy/vi";

const LISTENING_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
];

/** Matches Supabase audios bucket file_size_limit (50MB). */
export const MAX_LISTENING_AUDIO_BYTES = 50 * 1024 * 1024;

export type UploadListeningPartAudioResult =
  | { ok: true }
  | { ok: false; error: string };

export async function uploadListeningPartAudioFromClient(
  bookId: string,
  testId: string,
  part: 1 | 2 | 3 | 4,
  file: File,
): Promise<UploadListeningPartAudioResult> {
  if (file.size > MAX_LISTENING_AUDIO_BYTES) {
    return { ok: false, error: copy.admin.exams.create.listeningAudioTooLarge };
  }

  if (file.type && !LISTENING_AUDIO_TYPES.includes(file.type)) {
    return {
      ok: false,
      error: `Audio Part ${part}: định dạng không hỗ trợ. Dùng MP3, M4A hoặc WAV.`,
    };
  }

  const storagePath = buildListeningPartAudioStoragePath(bookId, testId, part);
  const contentType = file.type || "audio/mpeg";

  const supabase = createClient();
  const { error: uploadError } = await supabase.storage
    .from(AUDIOS_BUCKET)
    .upload(storagePath, file, { upsert: true, contentType });

  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  return linkListeningPartAudio(
    bookId,
    testId,
    part,
    storagePath,
    contentType,
  );
}
