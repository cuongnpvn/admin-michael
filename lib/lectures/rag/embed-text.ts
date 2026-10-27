import { GoogleGenAI } from "@google/genai";
import { withGeminiConcurrency } from "@/lib/admin/gemini/concurrency-limiter";
import { requireGeminiApiKey } from "@/lib/dictionary/translation-ai-env";

export const LECTURE_EMBEDDING_DIMS = 768;
export const LECTURE_EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL?.trim() || "gemini-embedding-001";

export type LectureEmbeddingTask = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

function embeddingConfig(taskType: LectureEmbeddingTask) {
  return {
    outputDimensionality: LECTURE_EMBEDDING_DIMS,
    taskType,
  };
}

function assertEmbedding(values: number[]): number[] {
  if (values.length !== LECTURE_EMBEDDING_DIMS) {
    throw new Error(
      `Expected ${LECTURE_EMBEDDING_DIMS}-dim embeddings, got ${values.length}.`,
    );
  }
  return values;
}

export function toPgVectorLiteral(values: number[]): string {
  return `[${values.join(",")}]`;
}

export async function embedLectureTexts(
  texts: string[],
  taskType: LectureEmbeddingTask = "RETRIEVAL_DOCUMENT",
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const apiKey = requireGeminiApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const embeddings: number[][] = [];
  const config = embeddingConfig(taskType);

  for (const text of texts) {
    const values = await withGeminiConcurrency("lecture-embed", async () => {
      const response = await ai.models.embedContent({
        model: LECTURE_EMBEDDING_MODEL,
        contents: text,
        ...(config ? { config } : {}),
      });
      return response.embeddings?.[0]?.values ?? [];
    });
    embeddings.push(assertEmbedding(values));
  }

  return embeddings;
}
