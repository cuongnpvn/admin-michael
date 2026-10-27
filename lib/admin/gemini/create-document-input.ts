import { GoogleGenAI } from "@google/genai";
import { PDF_INLINE_MAX_BYTES } from "@/lib/admin/gemini/constants";
import { geminiLog } from "@/lib/admin/gemini/gemini-log";

export interface GeminiDocumentInput {
  type: "document";
  data?: string;
  uri?: string;
  mime_type: string;
}

export async function createGeminiDocumentInput(
  ai: GoogleGenAI,
  fileBytes: Buffer,
  label: string,
  mimeType: string,
): Promise<GeminiDocumentInput> {
  const fileSizeKb = Math.round(fileBytes.length / 1024);

  if (fileBytes.length <= PDF_INLINE_MAX_BYTES) {
    geminiLog("document_input_inline", {
      label,
      fileSizeKb,
      mimeType,
      inlineMaxKb: Math.round(PDF_INLINE_MAX_BYTES / 1024),
    });
    return {
      type: "document",
      data: fileBytes.toString("base64"),
      mime_type: mimeType,
    };
  }

  geminiLog("document_input_upload_start", {
    label,
    fileSizeKb,
    mimeType,
  });

  const uploaded = await ai.files.upload({
    file: new Blob([new Uint8Array(fileBytes)], { type: mimeType }),
    config: { mimeType },
  });

  geminiLog("document_input_upload_done", {
    label,
    uri: uploaded.uri,
    mimeType: uploaded.mimeType ?? mimeType,
  });

  return {
    type: "document",
    uri: uploaded.uri,
    mime_type: uploaded.mimeType ?? mimeType,
  };
}
