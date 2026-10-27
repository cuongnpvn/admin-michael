import { resolvePracticeWholeAudioUrl } from "@/lib/listening/resolve-practice-media";
import { copy } from "@/lib/copy/vi";

const IMAGE_REF_RE =
  /^\/storage\/v1\/object\/public\/images\/([a-z0-9][a-z0-9-]*)\/([a-z0-9][a-z0-9-]*)\/(\d+)\.(?:png|jpe?g|webp)$/i;

const ATTR_RE = (name: string) =>
  new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i");

function attrValue(attrs: string, name: string): string | null {
  const match = ATTR_RE(name).exec(attrs);
  return match?.[1] ?? match?.[2] ?? null;
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

/** Part 1 photo path `images/{book}/{test}/{item}.png` → spoken-item audio. */
export function listeningImageAudioUrl(src: string): string | null {
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return null;
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return null;
  let origin: URL;
  try {
    origin = new URL(base);
  } catch {
    return null;
  }
  if (url.origin !== origin.origin) return null;

  const match = IMAGE_REF_RE.exec(url.pathname);
  if (!match) return null;

  const bookId = match[1]!.toLowerCase();
  const testId = match[2]!.toLowerCase();
  if (bookId === "lectures") return null;

  const itemNumber = Number(match[3]);
  if (!Number.isInteger(itemNumber) || itemNumber < 1) return null;

  return resolvePracticeWholeAudioUrl(bookId, testId, itemNumber);
}

/** Place a player above each exam photograph embedded in lecture HTML. */
export function withLectureImageAudio(html: string): string {
  return html.replace(/<img\b([^>]*?)\/?>/gi, (full, attrs: string) => {
    const src = attrValue(attrs, "src");
    if (!src) return full;
    const audioUrl = listeningImageAudioUrl(src);
    if (!audioUrl) return full;
    return `<div class="lecture-photo"><audio controls preload="none" src="${escapeAttr(audioUrl)}" aria-label="${escapeAttr(copy.session.playAudio)}"></audio>${full}</div>`;
  });
}
