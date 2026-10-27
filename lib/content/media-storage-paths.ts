export const AUDIOS_BUCKET = "audios";
export const IMAGES_BUCKET = "images";

/** @deprecated Legacy single bucket; use {@link AUDIOS_BUCKET} / {@link IMAGES_BUCKET}. */
export const TEST_ASSETS_BUCKET = "test-assets";

export const PUBLIC_MEDIA_BUCKETS = new Set([
  AUDIOS_BUCKET,
  IMAGES_BUCKET,
  TEST_ASSETS_BUCKET,
]);

export type ImportMediaKind = "image" | "audio";

export interface MediaStorageRef {
  storageBucket: string;
  storagePath: string;
}

export type ImageExtension = "jpg" | "jpeg" | "png" | "webp";

const MIME_TO_IMAGE_EXT: Record<string, ImageExtension> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function extensionFromMime(mimeType: string): ImageExtension {
  return MIME_TO_IMAGE_EXT[mimeType] ?? "jpg";
}

export function mediaBucketForKind(kind: ImportMediaKind): string {
  return kind === "image" ? IMAGES_BUCKET : AUDIOS_BUCKET;
}

export function buildImageStoragePath(
  bookId: string,
  testId: string,
  slug: string,
  ext: ImageExtension = "jpg",
): string {
  const normalizedExt = ext === "jpeg" ? "jpg" : ext;
  return `${bookId}/${testId}/${slug}.${normalizedExt}`;
}

/** Illustration for an admin-managed public vocabulary item. */
export function buildVocabItemImagePath(
  itemId: string,
  ext: ImageExtension = "jpg",
): string {
  const normalizedExt = ext === "jpeg" ? "jpg" : ext;
  return `vocab/${itemId}.${normalizedExt}`;
}

export function buildQuestionImagePath(
  bookId: string,
  testId: string,
  questionSlug: string,
  ext: ImageExtension = "jpg",
): string {
  return buildImageStoragePath(bookId, testId, questionSlug, ext);
}

export function buildQuestionAudioPath(
  bookId: string,
  testId: string,
  questionSlug: string,
): string {
  return buildAudioStoragePath(bookId, testId, questionSlug);
}

/** Part 2 combined question + answer audio track. */
export function buildPart2TranscriptAudioPath(
  bookId: string,
  testId: string,
  questionSlug: string,
): string {
  return buildAudioStoragePath(bookId, testId, `${questionSlug}-full`);
}

export function buildOptionAudioPath(
  bookId: string,
  testId: string,
  optionSlug: string,
): string {
  return buildAudioStoragePath(bookId, testId, optionSlug);
}

export function buildGroupAudioPath(
  bookId: string,
  testId: string,
  groupSlug: string,
): string {
  return buildAudioStoragePath(bookId, testId, groupSlug);
}

export function buildAudioStoragePath(
  bookId: string,
  testId: string,
  slug: string,
): string {
  return `${bookId}/${testId}/${slug}.mp3`;
}

/** One continuous listening track for the whole test (exam). */
export function buildListeningTestAudioStoragePath(
  bookId: string,
  testId: string,
): string {
  return `${bookId}/${testId}/listening-full.mp3`;
}

/** Per-part listening track for exam mode (parts 1–4). */
export function buildListeningPartAudioStoragePath(
  bookId: string,
  testId: string,
  part: 1 | 2 | 3 | 4,
): string {
  return `${bookId}/${testId}/listening-part-${part}.mp3`;
}

/** Object path inside a storage bucket, e.g. `ets2026/test1/1.mp3`. */
export type BucketObjectPath = string;

export interface ResolvedMediaLocation {
  storageBucket: string;
  storagePath: BucketObjectPath;
}

const LEGACY_BUCKET_PREFIXES = [
  `${TEST_ASSETS_BUCKET}/`,
  `${AUDIOS_BUCKET}/`,
  `${IMAGES_BUCKET}/`,
] as const;

function stripLegacyPathPrefixes(path: string): string {
  let value = path.replace(/^\/+/, "");
  for (const prefix of LEGACY_BUCKET_PREFIXES) {
    if (value.startsWith(prefix)) {
      value = value.slice(prefix.length);
    }
  }
  if (value.startsWith("audios/")) {
    value = value.slice("audios/".length);
  }
  if (value.startsWith("images/")) {
    value = value.slice("images/".length);
  }
  return value;
}

/** Map legacy test-assets rows to audios/images buckets. */
export function resolveMediaLocation(
  asset: { storageBucket: string; storagePath: string } | null | undefined,
  kindHint?: ImportMediaKind,
): ResolvedMediaLocation | null {
  if (!asset?.storagePath?.trim()) return null;

  const trimmedPath = asset.storagePath.trim();
  if (trimmedPath.includes("://")) {
    const fromUrl = parsePublicStorageUrl(trimmedPath);
    if (fromUrl) return fromUrl;
  }

  const objectPath = stripLegacyPathPrefixes(trimmedPath);
  if (!objectPath) return null;

  if (asset.storageBucket === AUDIOS_BUCKET || asset.storageBucket === IMAGES_BUCKET) {
    return { storageBucket: asset.storageBucket, storagePath: objectPath };
  }

  if (asset.storageBucket === TEST_ASSETS_BUCKET) {
    if (trimmedPath.startsWith("images/") || kindHint === "image") {
      return { storageBucket: IMAGES_BUCKET, storagePath: objectPath };
    }
    return { storageBucket: AUDIOS_BUCKET, storagePath: objectPath };
  }

  if (PUBLIC_MEDIA_BUCKETS.has(asset.storageBucket)) {
    return { storageBucket: asset.storageBucket, storagePath: objectPath };
  }

  return {
    storageBucket: kindHint === "image" ? IMAGES_BUCKET : AUDIOS_BUCKET,
    storagePath: objectPath,
  };
}

/** Extract bucket + object path from a Supabase public object URL. */
export function parsePublicStorageUrl(publicUrl: string): ResolvedMediaLocation | null {
  const trimmed = publicUrl.trim();
  if (!trimmed.includes("://")) return null;

  try {
    const pathname = new URL(trimmed).pathname;
    const marker = "/storage/v1/object/public/";
    const markerIndex = pathname.indexOf(marker);
    if (markerIndex === -1) return null;

    const remainder = pathname.slice(markerIndex + marker.length).replace(/^\/+/, "");
    if (!remainder) return null;

    const slashIndex = remainder.indexOf("/");
    if (slashIndex === -1) return null;

    const bucket = remainder.slice(0, slashIndex);
    const objectPath = stripLegacyPathPrefixes(remainder.slice(slashIndex + 1));
    if (!objectPath) return null;

    if (bucket === TEST_ASSETS_BUCKET) {
      if (remainder.includes("/images/") || objectPath.endsWith(".png") || objectPath.endsWith(".jpg") || objectPath.endsWith(".webp")) {
        return { storageBucket: IMAGES_BUCKET, storagePath: objectPath };
      }
      return { storageBucket: AUDIOS_BUCKET, storagePath: objectPath };
    }

    if (bucket === AUDIOS_BUCKET || bucket === IMAGES_BUCKET) {
      return { storageBucket: bucket, storagePath: objectPath };
    }

    return { storageBucket: bucket, storagePath: objectPath };
  } catch {
    return null;
  }
}

/** @deprecated Use parsePublicStorageUrl */
export function parsePublicBucketObjectPath(publicUrl: string): string | null {
  const resolved = parsePublicStorageUrl(publicUrl);
  return resolved?.storagePath ?? null;
}

/**
 * Normalize admin input to bucket + object path.
 * Accepts object path, legacy `audios/...` prefix, or full public URL.
 */
export function normalizeMediaStorageInput(
  input: string,
  kind?: ImportMediaKind,
): ResolvedMediaLocation | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const fromPublicUrl = parsePublicStorageUrl(trimmed);
  if (fromPublicUrl) return fromPublicUrl;

  if (trimmed.includes("://")) return null;

  const objectPath = stripLegacyPathPrefixes(trimmed);
  if (!objectPath) return null;

  if (trimmed.startsWith("images/") || kind === "image") {
    return { storageBucket: IMAGES_BUCKET, storagePath: objectPath };
  }

  return { storageBucket: AUDIOS_BUCKET, storagePath: objectPath };
}

/** @deprecated Use normalizeMediaStorageInput */
export function normalizeBucketObjectPath(
  input: string,
): BucketObjectPath | null {
  return normalizeMediaStorageInput(input)?.storagePath ?? null;
}

/** @deprecated Use normalizeMediaStorageInput */
export function normalizeStoragePathForBucket(value: string): string | null {
  return normalizeBucketObjectPath(value);
}

/** @deprecated Use parsePublicStorageUrl */
export function parseStoragePathFromMediaUrl(
  urlOrPath: string,
): string | null {
  const trimmed = urlOrPath.trim();
  if (!trimmed) return null;
  if (!trimmed.includes("://")) {
    return stripLegacyPathPrefixes(trimmed.replace(/^\/+/, ""));
  }
  return parsePublicBucketObjectPath(trimmed);
}

export function resolveMediaStoragePath(
  bookId: string,
  testId: string,
  kind: ImportMediaKind,
  slug: string,
  explicitUrl: string | null | undefined,
): string {
  if (explicitUrl) {
    const parsed = normalizeMediaStorageInput(explicitUrl, kind);
    if (parsed) return parsed.storagePath;
  }

  return kind === "image"
    ? buildImageStoragePath(bookId, testId, slug)
    : buildAudioStoragePath(bookId, testId, slug);
}

export function mediaStorageRef(
  bookId: string,
  testId: string,
  kind: ImportMediaKind,
  slug: string,
  explicitUrl: string | null | undefined,
): MediaStorageRef {
  const storagePath = resolveMediaStoragePath(
    bookId,
    testId,
    kind,
    slug,
    explicitUrl,
  );

  return {
    storageBucket: mediaBucketForKind(kind),
    storagePath,
  };
}

export function mediaAssetLookupKey(bucket: string, path: string): string {
  return `${bucket}:${path}`;
}

/** Build the public URL served to admin preview and customer app. */
export function buildPublicAssetUrlForBucket(
  bucket: string,
  objectPath: string | null | undefined,
  supabaseUrl?: string,
): string | null {
  const normalized = objectPath
    ? normalizeMediaStorageInput(objectPath)?.storagePath ?? stripLegacyPathPrefixes(objectPath)
    : null;
  if (!normalized) return null;

  const base = supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  const resolvedBucket =
    bucket === TEST_ASSETS_BUCKET
      ? (normalizeMediaStorageInput(objectPath!)?.storageBucket ?? AUDIOS_BUCKET)
      : bucket;

  return `${base}/storage/v1/object/public/${resolvedBucket}/${normalized}`;
}

/** Build URL from object path; infers bucket from path/kind when omitted. */
export function buildPublicAssetUrl(
  bucketObjectPath: string | null | undefined,
  supabaseUrl?: string,
  kind?: ImportMediaKind,
): string | null {
  if (!bucketObjectPath) return null;
  const resolved = normalizeMediaStorageInput(bucketObjectPath, kind);
  if (!resolved) return null;
  return buildPublicAssetUrlForBucket(
    resolved.storageBucket,
    resolved.storagePath,
    supabaseUrl,
  );
}

export function publicTestAssetUrl(
  bucketObjectPath: string | null | undefined,
  kind?: ImportMediaKind,
): string | null {
  return buildPublicAssetUrl(bucketObjectPath, undefined, kind);
}

export function resolvePublicAssetRef(
  asset: { storageBucket: string; storagePath: string } | null | undefined,
  supabaseUrl?: string,
  kindHint?: ImportMediaKind,
): string | null {
  const location = resolveMediaLocation(asset, kindHint);
  if (!location) return null;
  return buildPublicAssetUrlForBucket(
    location.storageBucket,
    location.storagePath,
    supabaseUrl,
  );
}
