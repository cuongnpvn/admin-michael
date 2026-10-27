import {
  HarmBlockThreshold,
  HarmCategory,
  type SafetySetting,
} from "@google/genai";

/** Harm categories supported by the Gemini API (not Vertex-only image/jailbreak). */
const GEMINI_API_HARM_CATEGORIES = [
  HarmCategory.HARM_CATEGORY_HARASSMENT,
  HarmCategory.HARM_CATEGORY_HATE_SPEECH,
  HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
  HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
  HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY,
] as const;

/**
 * Disables configurable Gemini safety filters for admin PDF extraction.
 *
 * Note: copyright/recitation blocking is a separate non-configurable layer and
 * is not controlled by HarmCategory — use BACKUP_GEMINI_MODEL fallback for that.
 */
export function geminiPermissiveSafetySettings(): SafetySetting[] {
  return GEMINI_API_HARM_CATEGORIES.map((category) => ({
    category,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  }));
}
