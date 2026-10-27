import type { SupabaseClient } from "@supabase/supabase-js";
import type { GeminiInlineImage } from "@/lib/admin/gemini/run-gemini-model-call";
import type { ListeningPart1TagExportEntry } from "@/lib/admin/export/build-listening-part12-tag-export";
import { buildListeningPart1ImagePath } from "@/lib/content/listening-image-paths";
import { IMAGES_BUCKET } from "@/lib/content/media-storage-paths";

function imageMimeType(blobType: string): string {
  const type = blobType.trim().toLowerCase();
  if (type.startsWith("image/")) return type;
  return "image/png";
}

export function listeningPart1ImageLabel(
  entry: Pick<ListeningPart1TagExportEntry, "id" | "globalItemNumber">,
): string {
  return `IMAGE id=${entry.id} globalItemNumber=${entry.globalItemNumber}`;
}

/** Download each Part 1 photograph from `images/{book}/{test}/{globalItemNumber}.png`. */
export async function loadListeningPart1TagImages(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  entries: ListeningPart1TagExportEntry[],
): Promise<GeminiInlineImage[]> {
  const images: GeminiInlineImage[] = [];

  for (const entry of entries) {
    const storagePath = buildListeningPart1ImagePath(
      bookId,
      testId,
      entry.globalItemNumber,
    );
    const { data, error } = await supabase.storage
      .from(IMAGES_BUCKET)
      .download(storagePath);

    if (error || !data) {
      throw new Error(
        `Part 1 photograph missing for item ${entry.globalItemNumber} (${storagePath}).`,
      );
    }

    const bytes = Buffer.from(await data.arrayBuffer());
    if (bytes.length === 0) {
      throw new Error(
        `Part 1 photograph missing for item ${entry.globalItemNumber} (${storagePath}).`,
      );
    }

    images.push({
      label: listeningPart1ImageLabel(entry),
      data: bytes.toString("base64"),
      mimeType: imageMimeType(data.type),
    });
  }

  return images;
}
