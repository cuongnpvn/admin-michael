import type { GenerateContentResponse, GoogleGenAI } from "@google/genai";
import { withGeminiConcurrencyStream } from "@/lib/admin/gemini/concurrency-limiter";
import { geminiPermissiveSafetySettings } from "@/lib/admin/gemini/gemini-safety-settings";
import {
  elapsedMs,
  geminiError,
  geminiLog,
} from "@/lib/admin/gemini/gemini-log";
import {
  assertGeminiResponseAllowed,
  geminiContentParts,
  type RunGeminiModelCallOptions,
} from "@/lib/admin/gemini/run-gemini-model-call";

export type StreamGeminiModelCallOptions = RunGeminiModelCallOptions & {
  abortSignal?: AbortSignal;
  includeThoughts?: boolean;
};

export type GeminiStreamChunk = {
  textDelta: string;
  thoughtDelta: string;
};

function thoughtDeltaFrom(response: GenerateContentResponse): string {
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  return parts
    .filter((part) => part.thought && typeof part.text === "string")
    .map((part) => part.text as string)
    .join("");
}

async function* generateGeminiChunks(
  ai: GoogleGenAI,
  options: StreamGeminiModelCallOptions,
): AsyncGenerator<GeminiStreamChunk> {
  geminiLog("api_request_start", {
    label: options.label,
    model: options.model,
    documentMode: options.documentInput?.uri
      ? "files_api"
      : options.documentInput
        ? "inline_base64"
        : "text_only",
    structuredOutput: Boolean(options.responseSchema),
    streaming: true,
    safetySettings: "BLOCK_NONE",
  });

  const apiStartedAt = performance.now();
  const stream = await ai.models.generateContentStream({
    model: options.model,
    contents: [{ role: "user", parts: geminiContentParts(options) }],
    config: {
      abortSignal: options.abortSignal,
      safetySettings: geminiPermissiveSafetySettings(),
      ...(options.responseSchema
        ? {
            responseMimeType: "application/json",
            responseSchema: options.responseSchema,
          }
        : {}),
      ...(options.includeThoughts
        ? { thinkingConfig: { includeThoughts: true } }
        : {}),
    },
  });

  let last: GenerateContentResponse | undefined;
  let accumulated = "";
  for await (const chunk of stream) {
    last = chunk;
    assertGeminiResponseAllowed(chunk, options.label);
    const textDelta = chunk.text ?? "";
    accumulated += textDelta;
    yield {
      textDelta,
      thoughtDelta: thoughtDeltaFrom(chunk),
    };
  }

  geminiLog("api_request_done", {
    label: options.label,
    apiMs: elapsedMs(apiStartedAt),
    responseId: last?.responseId ?? null,
    finishReason: last?.candidates?.[0]?.finishReason ?? null,
    streaming: true,
  });

  if (!accumulated.trim()) {
    geminiError("empty_output", {
      label: options.label,
      finishReason: last?.candidates?.[0]?.finishReason ?? null,
    });
    throw new Error("Gemini returned empty output.");
  }
}

export async function* streamGeminiModelCall(
  ai: GoogleGenAI,
  options: StreamGeminiModelCallOptions,
): AsyncGenerator<GeminiStreamChunk> {
  yield* withGeminiConcurrencyStream(options.label, () =>
    generateGeminiChunks(ai, options),
  );
}
