import { GoogleGenAI } from "@google/genai";
import {
  GEMINI_MAX_RETRIES,
  GEMINI_RETRY_BASE_MS,
  GEMINI_RETRY_MAX_MS,
} from "@/lib/admin/gemini/constants";
import { createGeminiDocumentInput } from "@/lib/admin/gemini/create-document-input";
import { extractJsonFromGeminiOutput } from "@/lib/admin/gemini/extract-json-from-output";
import {
  elapsedMs,
  geminiError,
  geminiLog,
  previewText,
} from "@/lib/admin/gemini/gemini-log";
import { loadAdminInstructionContent } from "@/lib/admin/gemini/load-instruction-content";
import { callGeminiWithModelFallback } from "@/lib/admin/gemini/call-gemini-with-model-fallback";
import { retryWithBackoff } from "@/lib/admin/gemini/retry-with-backoff";
import { runGeminiModelCall } from "@/lib/admin/gemini/run-gemini-model-call";
import { withGeminiConcurrency } from "@/lib/admin/gemini/concurrency-limiter";
import {
  parseLectureExtract,
  type LectureExtract,
} from "@/lib/lectures/extract-schema";

function requireGeminiApiKey(): void {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
}

async function callGeminiForLecturePdf(
  fileBytes: Buffer,
  model: string,
): Promise<LectureExtract> {
  const label = "lecture-from-pdf";
  const startedAt = performance.now();

  geminiLog("lecture_call_start", {
    label,
    model,
    fileSizeKb: Math.round(fileBytes.length / 1024),
  });

  const instructions = await loadAdminInstructionContent("lecture-from-pdf");
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const documentInput = await createGeminiDocumentInput(
    ai,
    fileBytes,
    label,
    "application/pdf",
  );

  const outputText = await runGeminiModelCall(ai, {
    model,
    label,
    textParts: [
      `${instructions}\n\nReturn raw JSON only. Put theory HTML in "content" and MCQ items in "quiz". Do not put quiz stems or options inside content. Always include a "tags" string array. Do not invent questions if the PDF has no exercise.`,
    ],
    documentInput,
  });

  geminiLog("lecture_output_received", {
    label,
    outputChars: outputText.length,
    outputPreview: previewText(outputText),
  });

  let parsed: unknown;
  try {
    parsed = extractJsonFromGeminiOutput(outputText);
  } catch (error) {
    geminiError(
      "lecture_json_parse_failed",
      {
        label,
        outputChars: outputText.length,
        outputPreview: previewText(outputText, 500),
      },
      error,
    );
    throw error;
  }

  const extract = parseLectureExtract(parsed);
  geminiLog("lecture_call_success", {
    label,
    questionCount: extract.questions.length,
    totalMs: elapsedMs(startedAt),
  });
  return extract;
}

export async function extractLectureFromPdfBuffer(
  fileBytes: Buffer,
): Promise<LectureExtract> {
  requireGeminiApiKey();

  return withGeminiConcurrency("lecture-from-pdf", () =>
    retryWithBackoff(
      () =>
        callGeminiWithModelFallback("lecture-from-pdf", (model) =>
          callGeminiForLecturePdf(fileBytes, model),
        ),
      {
        label: "lecture-from-pdf",
        maxAttempts: GEMINI_MAX_RETRIES,
        baseDelayMs: GEMINI_RETRY_BASE_MS,
        maxDelayMs: GEMINI_RETRY_MAX_MS,
      },
    ),
  );
}
