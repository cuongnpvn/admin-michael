import { buildLectureChunks } from "@/lib/lectures/rag/chunk-lecture";
import { embedLectureTexts, toPgVectorLiteral } from "@/lib/lectures/rag/embed-text";
import { normalizeLectureTags } from "@/lib/lectures/tags";
import type { LectureQuestion } from "@/lib/lectures/types";
import { createServiceRoleClient } from "@/lib/supabase/service";

type ExistingChunk = {
  content_hash: string;
  embedding: number[] | string | null;
};

function embeddingValues(value: ExistingChunk["embedding"]): number[] | null {
  if (Array.isArray(value) && value.every((item) => typeof item === "number")) {
    return value;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed) && parsed.every((item) => typeof item === "number")) {
        return parsed;
      }
    } catch {
      return null;
    }
  }
  return null;
}

function sameHashSet(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const counts = new Map<string, number>();
  for (const hash of left) counts.set(hash, (counts.get(hash) ?? 0) + 1);
  for (const hash of right) {
    const next = (counts.get(hash) ?? 0) - 1;
    if (next < 0) return false;
    counts.set(hash, next);
  }
  return true;
}

export async function deleteLectureChunks(lectureId: string): Promise<void> {
  const service = createServiceRoleClient();
  const { error } = await service
    .from("lecture_chunks")
    .delete()
    .eq("lecture_id", lectureId);
  if (error) throw error;
}

export async function reindexPublishedLecture(lectureId: string): Promise<"indexed" | "skipped"> {
  const service = createServiceRoleClient();
  const { data: lecture, error: lectureError } = await service
    .from("lectures")
    .select("id, collection_id, title, excerpt, tags, body_html, published")
    .eq("id", lectureId)
    .maybeSingle();
  if (lectureError) throw lectureError;
  if (!lecture) {
    await deleteLectureChunks(lectureId);
    return "skipped";
  }

  const { data: collection, error: collectionError } = await service
    .from("lecture_collections")
    .select("id, published")
    .eq("id", lecture.collection_id as string)
    .maybeSingle();
  if (collectionError) throw collectionError;

  const published =
    lecture.published === true && collection?.published === true;
  if (!published) {
    await deleteLectureChunks(lectureId);
    return "skipped";
  }

  const { data: questionRows, error: questionError } = await service
    .from("lecture_questions")
    .select("id, sort_order, stem, options")
    .eq("lecture_id", lectureId)
    .order("sort_order", { ascending: true });
  if (questionError) throw questionError;

  const questions = (questionRows ?? []).map((row) => ({
    id: row.id as string,
    sortOrder: row.sort_order as number,
    stem: row.stem as string,
    options: row.options as LectureQuestion["options"],
  }));

  const drafts = buildLectureChunks({
    title: lecture.title as string,
    excerpt: (lecture.excerpt as string) ?? "",
    tags: normalizeLectureTags(lecture.tags),
    bodyHtml: (lecture.body_html as string) ?? "",
    questions,
  });

  const { data: existingRows, error: existingError } = await service
    .from("lecture_chunks")
    .select("content_hash, embedding")
    .eq("lecture_id", lectureId);
  if (existingError) throw existingError;

  const existing = (existingRows ?? []) as ExistingChunk[];
  if (
    drafts.length > 0 &&
    sameHashSet(
      existing.map((row) => row.content_hash),
      drafts.map((chunk) => chunk.contentHash),
    )
  ) {
    return "skipped";
  }

  const embedByHash = new Map<string, number[]>();
  for (const row of existing) {
    const values = embeddingValues(row.embedding);
    if (values && !embedByHash.has(row.content_hash)) {
      embedByHash.set(row.content_hash, values);
    }
  }

  const missing = drafts.filter((chunk) => !embedByHash.has(chunk.contentHash));
  const fresh = await embedLectureTexts(missing.map((chunk) => chunk.content));
  missing.forEach((chunk, index) => {
    embedByHash.set(chunk.contentHash, fresh[index]!);
  });

  await deleteLectureChunks(lectureId);
  if (drafts.length === 0) return "indexed";

  const { error: insertError } = await service.from("lecture_chunks").insert(
    drafts.map((chunk) => {
      const values = embedByHash.get(chunk.contentHash);
      return {
        lecture_id: lectureId,
        collection_id: lecture.collection_id as string,
        source_kind: chunk.sourceKind,
        heading: chunk.heading,
        question_id: chunk.questionId,
        content: chunk.content,
        embedding: values ? toPgVectorLiteral(values) : null,
        content_hash: chunk.contentHash,
      };
    }),
  );
  if (insertError) throw insertError;
  return "indexed";
}

export async function reindexPublishedCatalog(): Promise<{
  indexed: number;
  skipped: number;
}> {
  const service = createServiceRoleClient();
  const { data: lectureRows, error } = await service
    .from("lectures")
    .select("id, collection_id")
    .eq("published", true);
  if (error) throw error;

  const collectionIds = [
    ...new Set((lectureRows ?? []).map((row) => row.collection_id as string)),
  ];
  const publishedCollections = new Set<string>();
  if (collectionIds.length > 0) {
    const { data: collections, error: collectionError } = await service
      .from("lecture_collections")
      .select("id")
      .in("id", collectionIds)
      .eq("published", true);
    if (collectionError) throw collectionError;
    for (const row of collections ?? []) {
      publishedCollections.add(row.id as string);
    }
  }

  let indexed = 0;
  let skipped = 0;
  for (const row of lectureRows ?? []) {
    if (!publishedCollections.has(row.collection_id as string)) {
      skipped += 1;
      continue;
    }
    const result = await reindexPublishedLecture(row.id as string);
    if (result === "indexed") indexed += 1;
    else skipped += 1;
  }
  return { indexed, skipped };
}

export async function syncLectureRagIndex(lectureId: string): Promise<void> {
  try {
    await reindexPublishedLecture(lectureId);
  } catch {
    // CMS writes stay the source of truth; admin catalog reindex can repair.
  }
}
