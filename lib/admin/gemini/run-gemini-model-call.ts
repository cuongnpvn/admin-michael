import {
  FinishReason,
  GoogleGenAI,
  type GenerateContentResponse,
  type Part,
} from "@google/genai";
import type { GeminiDocumentInput } from "@/lib/admin/gemini/create-document-input";
import { geminiDocumentInputToPart } from "@/lib/admin/gemini/gemini-document-part";
import type { GeminiJsonSchema } from "@/lib/admin/gemini/gemini-response-schema-shared";
import { geminiPermissiveSafetySettings } from "@/lib/admin/gemini/gemini-safety-settings";
import {
  elapsedMs,
  geminiError,
  geminiLog,
} from "@/lib/admin/gemini/gemini-log";

export interface GeminiInlineImage {
  /** Text part placed immediately before the image bytes. */
  label: string;
  data: string;
  mimeType: string;
}

export interface RunGeminiModelCallOptions {
  model: string;
  label: string;
  textParts: string[];
  documentInput?: GeminiDocumentInput;
  inlineImages?: GeminiInlineImage[];
  responseSchema?: GeminiJsonSchema;
}

export function geminiFinishReasonError(
  finishReason: FinishReason | undefined,
): Error | null {
  return finishReasonError(finishReason);
}

export function geminiContentParts(
  options: RunGeminiModelCallOptions,
): Part[] {
  const images = options.inlineImages ?? [];
  return [
    ...options.textParts.map((text) => ({ text })),
    ...(options.documentInput
      ? [geminiDocumentInputToPart(options.documentInput)]
      : []),
    ...images.flatMap((image) => [
      { text: image.label },
      {
        inlineData: {
          data: image.data,
          mimeType: image.mimeType,
        },
      },
    ]),
  ];
}

export function assertGeminiResponseAllowed(
  response: GenerateContentResponse,
  label: string,
): void {
  const promptBlockReason = response.promptFeedback?.blockReason;
  if (promptBlockReason) {
    const message =
      response.promptFeedback?.blockReasonMessage ??
      `Gemini blocked prompt (${promptBlockReason}).`;
    geminiError("prompt_blocked", { label, blockReason: promptBlockReason });
    throw new Error(message);
  }

  const candidate = response.candidates?.[0];
  const finishReasonErrorValue = finishReasonError(candidate?.finishReason);
  if (finishReasonErrorValue) {
    geminiError("response_blocked", {
      label,
      finishReason: candidate?.finishReason ?? null,
      safetyRatings: candidate?.safetyRatings ?? null,
    });
    throw finishReasonErrorValue;
  }
}

function finishReasonError(finishReason: FinishReason | undefined): Error | null {
  switch (finishReason) {
    case FinishReason.RECITATION:
      return new Error(
        "Gemini blocked response due to copyright recitation.",
      );
    case FinishReason.SAFETY:
      return new Error("Gemini blocked response for safety reasons.");
    case FinishReason.PROHIBITED_CONTENT:
      return new Error("Gemini blocked response for prohibited content.");
    case FinishReason.BLOCKLIST:
      return new Error("Gemini blocked response due to blocklist match.");
    case FinishReason.SPII:
      return new Error("Gemini blocked response for sensitive PII.");
    case FinishReason.MAX_TOKENS:
      return new Error(
        "Gemini stopped early: output reached the maximum token limit.",
      );
    default:
      return null;
  }
}

function assertGeminiOutput(
  response: GenerateContentResponse,
  label: string,
): string {
  assertGeminiResponseAllowed(response, label);

  const text = response.text?.trim();
  if (!text) {
    geminiError("empty_output", {
      label,
      finishReason: response.candidates?.[0]?.finishReason ?? null,
    });
    throw new Error("Gemini returned empty output.");
  }

  return text;
}

export async function runGeminiModelCall(
  ai: GoogleGenAI,
  options: RunGeminiModelCallOptions,
): Promise<string> {
  const parts = geminiContentParts(options);

  geminiLog("api_request_start", {
    label: options.label,
    model: options.model,
    documentMode: options.documentInput?.uri
      ? "files_api"
      : options.documentInput
        ? "inline_base64"
        : "text_only",
    inlineImageCount: options.inlineImages?.length ?? 0,
    structuredOutput: Boolean(options.responseSchema),
    safetySettings: "BLOCK_NONE",
  });

  const apiStartedAt = performance.now();
  const response = await ai.models.generateContent({
    model: options.model,
    contents: [{ role: "user", parts }],
    config: {
      safetySettings: geminiPermissiveSafetySettings(),
      ...(options.responseSchema
        ? {
            responseMimeType: "application/json",
            responseSchema: options.responseSchema,
          }
        : {}),
    },
  });

  geminiLog("api_request_done", {
    label: options.label,
    apiMs: elapsedMs(apiStartedAt),
    responseId: response.responseId ?? null,
    finishReason: response.candidates?.[0]?.finishReason ?? null,
  });

  return assertGeminiOutput(response, options.label);
}
