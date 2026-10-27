import type { Part } from "@google/genai";
import type { GeminiDocumentInput } from "@/lib/admin/gemini/create-document-input";

export function geminiDocumentInputToPart(
  documentInput: GeminiDocumentInput,
): Part {
  if (documentInput.uri) {
    return {
      fileData: {
        fileUri: documentInput.uri,
        mimeType: documentInput.mime_type,
      },
    };
  }

  if (!documentInput.data) {
    throw new Error("Gemini document input is missing inline data.");
  }

  return {
    inlineData: {
      data: documentInput.data,
      mimeType: documentInput.mime_type,
    },
  };
}
