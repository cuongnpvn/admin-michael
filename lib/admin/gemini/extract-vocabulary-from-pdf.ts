import { GoogleGenAI } from "@google/genai";
import {
  GEMINI_MAX_RETRIES,
  GEMINI_MODEL,
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
import { parseVocabularyImportFile } from "@/lib/admin/vocabulary/vocabulary-import-schema";

const TERMS_PREFIX = "VOCABULARY_TERMS_JSON:";

function requireGeminiApiKey(): void {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
}

function buildVocabularyPrompt(
  instructions: string,
  deckName: string,
  mimeType: string,
): string {
  const isPlainText = mimeType === "text/plain";

  return `${instructions}

---

Runtime configuration from the admin app:

- name: ${deckName}
- sourceMimeType: ${mimeType}

Use exactly this deck name in the JSON \`name\` field. Do not infer or override it from the file. Return raw JSON only.${
    isPlainText
      ? "\n\nThe attached content is plain text. Extract every vocabulary term from the list."
      : ""
  }`;
}

async function callGeminiForVocabularyFile(
  deckName: string,
  fileBytes: Buffer,
  mimeType: string,
  model: string,
): Promise<string> {
  const label = "vocabulary-deck";
  const startedAt = performance.now();
  const fileSizeKb = Math.round(fileBytes.length / 1024);

  geminiLog("vocabulary_call_start", {
    label,
    deckName,
    mimeType,
    model,
    fileSizeKb,
  });

  const instructions = await loadAdminInstructionContent("vocabulary-list");
  const prompt = buildVocabularyPrompt(instructions, deckName, mimeType);
  geminiLog("vocabulary_instructions_loaded", {
    label,
    instructionChars: instructions.length,
    promptChars: prompt.length,
  });

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const documentInput = await createGeminiDocumentInput(
    ai,
    fileBytes,
    label,
    mimeType,
  );

  const outputText = await runGeminiModelCall(ai, {
    model,
    label,
    textParts: [prompt],
    documentInput,
  });

  geminiLog("vocabulary_output_received", {
    label,
    outputChars: outputText.length,
    outputPreview: previewText(outputText),
  });

  let parsed: unknown;
  try {
    parsed = extractJsonFromGeminiOutput(outputText);
  } catch (error) {
    geminiError(
      "vocabulary_json_parse_failed",
      {
        label,
        outputChars: outputText.length,
        outputPreview: previewText(outputText, 500),
      },
      error,
    );
    throw error;
  }

  const normalized = parseVocabularyImportFile(JSON.stringify(parsed), deckName);
  const rawJson = JSON.stringify(normalized);
  geminiLog("vocabulary_call_success", {
    label,
    jsonChars: rawJson.length,
    wordCount: normalized.words.length,
    totalMs: elapsedMs(startedAt),
  });

  return rawJson;
}

function buildVocabularyTermsPrompt(
  instructions: string,
  deckName: string,
  termsJson: string,
): string {
  return `${instructions}

---

Runtime configuration from the admin app:

- name: ${deckName}
- mode: re-enrich existing terms

Use exactly this deck name in the JSON \`name\` field. Enrich every term from the list below (keep terms; fill lemma, meanings, IPA, wordTypes, synonyms, collocations, and example). Return raw JSON only.

${TERMS_PREFIX}
${termsJson}`;
}

async function callGeminiForVocabularyTerms(
  deckName: string,
  terms: string[],
  model: string,
): Promise<string> {
  const label = "vocabulary-deck-enrich";
  const startedAt = performance.now();
  const termsJson = JSON.stringify(
    terms.map((term) => ({ term })),
  );

  geminiLog("vocabulary_call_start", {
    label,
    deckName,
    model,
    termCount: terms.length,
  });

  const instructions = await loadAdminInstructionContent("vocabulary-list");
  const prompt = buildVocabularyTermsPrompt(instructions, deckName, termsJson);
  geminiLog("vocabulary_instructions_loaded", {
    label,
    instructionChars: instructions.length,
    promptChars: prompt.length,
  });

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const outputText = await runGeminiModelCall(ai, {
    model,
    label,
    textParts: [prompt],
  });

  geminiLog("vocabulary_output_received", {
    label,
    outputChars: outputText.length,
    outputPreview: previewText(outputText),
  });

  let parsed: unknown;
  try {
    parsed = extractJsonFromGeminiOutput(outputText);
  } catch (error) {
    geminiError(
      "vocabulary_json_parse_failed",
      {
        label,
        outputChars: outputText.length,
        outputPreview: previewText(outputText, 500),
      },
      error,
    );
    throw error;
  }

  const normalized = parseVocabularyImportFile(JSON.stringify(parsed), deckName);
  const rawJson = JSON.stringify(normalized);
  geminiLog("vocabulary_call_success", {
    label,
    jsonChars: rawJson.length,
    wordCount: normalized.words.length,
    totalMs: elapsedMs(startedAt),
  });

  return rawJson;
}

export async function extractVocabularyDeckFromFileBuffer(
  deckName: string,
  fileBytes: Buffer,
  mimeType: string,
): Promise<string> {
  requireGeminiApiKey();

  const label = "vocabulary-deck";
  geminiLog("vocabulary_extract_start", {
    label,
    deckName,
    mimeType,
    fileSizeKb: Math.round(fileBytes.length / 1024),
    model: GEMINI_MODEL,
    maxRetries: GEMINI_MAX_RETRIES,
  });

  return withGeminiConcurrency(label, () =>
    retryWithBackoff(
      () =>
        callGeminiWithModelFallback(label, (model) =>
          callGeminiForVocabularyFile(deckName, fileBytes, mimeType, model),
        ),
      {
        label,
        maxAttempts: GEMINI_MAX_RETRIES,
        baseDelayMs: GEMINI_RETRY_BASE_MS,
        maxDelayMs: GEMINI_RETRY_MAX_MS,
      },
    ),
  );
}

/** Re-enrich existing deck terms with the same vocabulary-list schema as file import. */
export async function enrichVocabularyDeckFromTerms(
  deckName: string,
  terms: string[],
): Promise<string> {
  requireGeminiApiKey();

  const cleaned = [
    ...new Set(
      terms.map((term) => term.trim()).filter((term) => term.length > 0),
    ),
  ];
  if (cleaned.length === 0) {
    throw new Error("At least one vocabulary term is required");
  }

  const label = "vocabulary-deck-enrich";
  geminiLog("vocabulary_extract_start", {
    label,
    deckName,
    termCount: cleaned.length,
    model: GEMINI_MODEL,
    maxRetries: GEMINI_MAX_RETRIES,
  });

  return withGeminiConcurrency(label, () =>
    retryWithBackoff(
      () =>
        callGeminiWithModelFallback(label, (model) =>
          callGeminiForVocabularyTerms(deckName, cleaned, model),
        ),
      {
        label,
        maxAttempts: GEMINI_MAX_RETRIES,
        baseDelayMs: GEMINI_RETRY_BASE_MS,
        maxDelayMs: GEMINI_RETRY_MAX_MS,
      },
    ),
  );
}
