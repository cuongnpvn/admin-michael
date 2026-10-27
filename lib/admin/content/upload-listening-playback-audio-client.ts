import { linkAdminListeningPlaybackAudio } from "@/lib/admin/content/link-listening-playback-audio";
import { MAX_LISTENING_AUDIO_BYTES } from "@/lib/admin/content/upload-listening-part-audio-client";
import { canonicalListeningPlaybackStoragePath } from "@/lib/content/listening-audio-paths";
import { AUDIOS_BUCKET } from "@/lib/content/media-storage-paths";
import { copy } from "@/lib/copy/vi";
import { createClient } from "@/lib/supabase/client";

const LISTENING_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
];

type UploadInput = {
  bookId: string;
  testId: string;
  file: File;
} & (
  | { part: 1 | 2; questionId: string; globalItemNumber: number }
  | { part: 3 | 4; groupId: string; groupGlobalNumbers: number[] }
);

export type UploadListeningPlaybackAudioResult =
  | { ok: true; publicUrl: string }
  | { ok: false; error: string };

export async function uploadListeningPlaybackAudioFromClient(
  input: UploadInput,
): Promise<UploadListeningPlaybackAudioResult> {
  if (input.file.size > MAX_LISTENING_AUDIO_BYTES) {
    return { ok: false, error: copy.admin.exams.create.listeningAudioTooLarge };
  }

  if (input.file.type && !LISTENING_AUDIO_TYPES.includes(input.file.type)) {
    return { ok: false, error: copy.admin.cms.listeningAudio.invalidType };
  }

  const storagePath = canonicalListeningPlaybackStoragePath(
    playbackStorageInput(input),
  );
  if (!storagePath) {
    return { ok: false, error: copy.admin.cms.listeningAudio.pathMismatch };
  }

  const contentType = input.file.type || "audio/mpeg";
  const supabase = createClient();
  const { error: uploadError } = await supabase.storage
    .from(AUDIOS_BUCKET)
    .upload(storagePath, input.file, {
      upsert: true,
      contentType,
      cacheControl: "0",
    });

  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  return linkAdminListeningPlaybackAudio(
    playbackLinkInput(input, storagePath, contentType),
  );
}

function playbackStorageInput(input: UploadInput) {
  switch (input.part) {
    case 3:
    case 4:
      return {
        bookId: input.bookId,
        testId: input.testId,
        part: input.part,
        groupGlobalNumbers: input.groupGlobalNumbers,
      };
    case 1:
    case 2:
      return {
        bookId: input.bookId,
        testId: input.testId,
        part: input.part,
        globalItemNumber: input.globalItemNumber,
      };
  }
}

function playbackLinkInput(
  input: UploadInput,
  storagePath: string,
  contentType: string,
) {
  switch (input.part) {
    case 3:
    case 4:
      return {
        bookId: input.bookId,
        testId: input.testId,
        part: input.part,
        groupId: input.groupId,
        storagePath,
        contentType,
      };
    case 1:
    case 2:
      return {
        bookId: input.bookId,
        testId: input.testId,
        part: input.part,
        questionId: input.questionId,
        storagePath,
        contentType,
      };
  }
}
