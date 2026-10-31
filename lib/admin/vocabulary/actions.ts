"use server";

import { ZodError } from "zod";
import { revalidatePath, updateTag } from "next/cache";
import { notifyLearnerRevalidate } from "@/lib/learner-revalidate";
import {
  AdminAccessError,
  requireAdminSession,
} from "@/lib/admin/auth/require-admin";
import { MAX_PDF_BYTES } from "@/lib/admin/gemini/constants";
import { extractVocabularyDeckFromFileBuffer } from "@/lib/admin/gemini/extract-vocabulary-from-pdf";
import {
  elapsedMs,
  geminiError,
  geminiLog,
} from "@/lib/admin/gemini/gemini-log";
import { isRetryableGeminiError } from "@/lib/admin/gemini/is-retryable-gemini-error";
import {
  VOCABULARY_UPLOAD_MIME_TYPES,
} from "@/lib/admin/vocabulary/constants";
import {
  importVocabularyJsonFromRaw,
  importVocabularyWordsChunk,
} from "@/lib/admin/vocabulary/import-vocabulary-json";
import type {
  ImportVocabularyJsonSummary,
  VocabularyDeckSummary,
} from "@/lib/admin/vocabulary/types";
import type { VocabularyItemPayload } from "@/lib/vocabulary/vocabulary-item-payload";
import { regenerateDeckVocabularyFromExistingTerms } from "@/lib/vocabulary/regenerate-deck-vocabulary";
import {
  parseVocabularyImportFile,
  validateVocabularyImportFile,
  type VocabularyImportWord,
} from "@/lib/admin/vocabulary/vocabulary-import-schema";
import {
  listDeckImagePaths,
  listItemImagePath,
  removeVocabImageObjects,
} from "@/lib/admin/vocabulary/vocab-image-storage";
import { copy } from "@/lib/copy/vi";

const MAX_JSON_BYTES = 2 * 1024 * 1024;
const MAX_UPLOAD_BYTES = MAX_PDF_BYTES;

export type ImportVocabularyJsonResult =
  | { ok: true; summary: ImportVocabularyJsonSummary }
  | { ok: false; error: string };

export type ValidateVocabularyImportResult =
  | {
      ok: true;
      deckName: string;
      words: VocabularyImportWord[];
      totalWords: number;
    }
  | { ok: false; error: string };

export type ImportVocabularyChunkResult =
  | { ok: true; wordCount: number }
  | { ok: false; error: string };

export type UpdateVocabularyItemResult =
  | { ok: true }
  | { ok: false; error: string };

export type VocabularyDeckActionResult =
  | { ok: true; deckId: string }
  | { ok: false; error: string };

export type VocabularyItemUpdatePayload = VocabularyItemPayload;

function accessErrorMessage(code: string): string {
  if (code === "not_signed_in") {
    return copy.admin.vocabularyImport.errors.notSignedIn;
  }
  if (code === "not_admin") {
    return copy.admin.vocabularyImport.errors.notAdmin;
  }
  return copy.admin.vocabularyImport.errors.generic;
}

function revalidateVocabularyPaths(deckId?: string): void {
  updateTag("vocabulary-catalog");
  notifyLearnerRevalidate({ scope: "vocabulary" });
  revalidatePath("/");
  revalidatePath("/vocab");
  if (deckId) {
    revalidatePath(`/vocab/${deckId}`);
  }
}

function parseWordsJson(raw: string): VocabularyImportWord[] {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("Invalid vocabulary chunk payload");
  }
  return parsed as VocabularyImportWord[];
}

function resolveUploadMimeType(file: File): string | null {
  const lowerName = file.name.toLowerCase();
  if (file.type && VOCABULARY_UPLOAD_MIME_TYPES.has(file.type)) {
    return file.type;
  }
  if (lowerName.endsWith(".pdf")) return "application/pdf";
  if (lowerName.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (lowerName.endsWith(".txt")) return "text/plain";
  if (lowerName.endsWith(".json")) return "application/json";
  return null;
}

function validateUploadFile(file: FormDataEntryValue | null): File | string {
  if (!(file instanceof File) || file.size === 0) {
    return copy.admin.vocabularyImport.errors.missingFile;
  }

  const mimeType = resolveUploadMimeType(file);
  if (!mimeType) {
    return copy.admin.vocabularyImport.errors.invalidType;
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return copy.admin.vocabularyImport.errors.fileTooLarge;
  }

  return file;
}

export async function fetchAdminVocabularyDecks(): Promise<
  VocabularyDeckSummary[]
> {
  const { supabase } = await requireAdminSession();

  const { data: decks, error: deckError } = await supabase
    .from("vocabulary_decks")
    .select("id, name, published, created_at")
    .is("owner_id", null)
    .order("created_at", { ascending: false });

  if (deckError) throw deckError;

  const { data: counts, error: countError } = await supabase
    .from("vocabulary_items")
    .select("deck_id");

  if (countError) throw countError;

  const countByDeck = new Map<string, number>();
  for (const row of counts ?? []) {
    const deckId = row.deck_id as string;
    countByDeck.set(deckId, (countByDeck.get(deckId) ?? 0) + 1);
  }

  return (decks ?? []).map((deck) => ({
    id: deck.id as string,
    name: deck.name as string,
    published: deck.published as boolean,
    createdAt: deck.created_at as string,
    wordCount: countByDeck.get(deck.id as string) ?? 0,
  }));
}

export async function createVocabularyDeck(
  name: string,
): Promise<VocabularyDeckActionResult> {
  try {
    const { supabase } = await requireAdminSession();
    const trimmed = name.trim();

    if (!trimmed) {
      return { ok: false, error: copy.admin.vocabManage.errors.nameRequired };
    }

    const { data, error } = await supabase
      .from("vocabulary_decks")
      .insert({ name: trimmed, owner_id: null })
      .select("id")
      .single();

    if (error) throw error;

    revalidateVocabularyPaths();
    return { ok: true, deckId: data.id as string };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessErrorMessage(error.message) };
    }
    const message =
      error instanceof Error
        ? error.message
        : copy.admin.vocabManage.errors.generic;
    return { ok: false, error: message };
  }
}

export async function updateVocabularyDeckName(
  deckId: string,
  name: string,
): Promise<VocabularyDeckActionResult> {
  try {
    const { supabase } = await requireAdminSession();
    const trimmed = name.trim();

    if (!trimmed) {
      return { ok: false, error: copy.admin.vocabManage.errors.nameRequired };
    }

    const { error } = await supabase
      .from("vocabulary_decks")
      .update({ name: trimmed })
      .eq("id", deckId);

    if (error) throw error;

    revalidateVocabularyPaths(deckId);
    return { ok: true, deckId };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessErrorMessage(error.message) };
    }
    const message =
      error instanceof Error
        ? error.message
        : copy.admin.vocabManage.errors.generic;
    return { ok: false, error: message };
  }
}

export async function setVocabularyDeckPublished(
  deckId: string,
  published: boolean,
): Promise<VocabularyDeckActionResult> {
  try {
    const { supabase } = await requireAdminSession();

    const { error } = await supabase
      .from("vocabulary_decks")
      .update({ published })
      .eq("id", deckId);

    if (error) throw error;

    revalidateVocabularyPaths(deckId);
    return { ok: true, deckId };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessErrorMessage(error.message) };
    }
    const message =
      error instanceof Error
        ? error.message
        : copy.admin.vocabManage.errors.generic;
    return { ok: false, error: message };
  }
}

export async function deleteVocabularyDeck(
  deckId: string,
): Promise<VocabularyDeckActionResult> {
  try {
    const { supabase } = await requireAdminSession();
    const imagePaths = await listDeckImagePaths(supabase, deckId);

    const { error } = await supabase
      .from("vocabulary_decks")
      .delete()
      .eq("id", deckId);

    if (error) throw error;

    await removeVocabImageObjects(supabase, imagePaths).catch(() => undefined);

    revalidateVocabularyPaths();
    return { ok: true, deckId };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessErrorMessage(error.message) };
    }
    const message =
      error instanceof Error
        ? error.message
        : copy.admin.vocabManage.errors.generic;
    return { ok: false, error: message };
  }
}

export async function deleteVocabularyItem(
  itemId: string,
  deckId: string,
): Promise<UpdateVocabularyItemResult> {
  try {
    const { supabase } = await requireAdminSession();
    const imagePath = await listItemImagePath(supabase, itemId, deckId);

    const { error } = await supabase
      .from("vocabulary_items")
      .delete()
      .eq("id", itemId)
      .eq("deck_id", deckId);

    if (error) throw error;

    if (imagePath) {
      await removeVocabImageObjects(supabase, [imagePath]).catch(() => undefined);
    }

    revalidateVocabularyPaths(deckId);
    return { ok: true };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessErrorMessage(error.message) };
    }
    const message =
      error instanceof Error
        ? error.message
        : copy.admin.vocabulary.errors.saveFailed;
    return { ok: false, error: message };
  }
}

export async function validateVocabularyImportPayload(
  raw: string,
  deckName: string,
): Promise<ValidateVocabularyImportResult> {
  try {
    await requireAdminSession();
    const parsed = parseVocabularyImportFile(raw, deckName);
    validateVocabularyImportFile(parsed);

    return {
      ok: true,
      deckName: parsed.name,
      words: parsed.words,
      totalWords: parsed.words.length,
    };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessErrorMessage(error.message) };
    }
    if (error instanceof SyntaxError) {
      return {
        ok: false,
        error: copy.admin.vocabularyImport.errors.invalidJson,
      };
    }
    if (error instanceof ZodError) {
      return {
        ok: false,
        error: copy.admin.vocabularyImport.errors.invalidSchema,
      };
    }
    const message =
      error instanceof Error
        ? error.message
        : copy.admin.vocabularyImport.errors.generic;
    return { ok: false, error: message };
  }
}

export async function importVocabularyWordsChunkAction(
  deckId: string,
  wordsJson: string,
): Promise<ImportVocabularyChunkResult> {
  try {
    const { supabase } = await requireAdminSession();
    const words = parseWordsJson(wordsJson);

    if (words.length === 0) {
      return { ok: true, wordCount: 0 };
    }

    const result = await importVocabularyWordsChunk(supabase, deckId, words);
    return { ok: true, wordCount: result.wordCount };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessErrorMessage(error.message) };
    }
    const message =
      error instanceof Error
        ? error.message
        : copy.admin.vocabularyImport.errors.generic;
    return { ok: false, error: message };
  }
}

export async function finalizeVocabularyImport(deckId: string): Promise<void> {
  await requireAdminSession();
  revalidateVocabularyPaths(deckId);
}

export async function updateVocabularyItem(
  itemId: string,
  deckId: string,
  payload: VocabularyItemUpdatePayload,
): Promise<UpdateVocabularyItemResult> {
  try {
    const { supabase } = await requireAdminSession();
    const term = payload.term.trim();

    if (!term) {
      return {
        ok: false,
        error: copy.admin.vocabulary.errors.termRequired,
      };
    }

    const { error } = await supabase
      .from("vocabulary_items")
      .update({
        term,
        lemma: payload.lemma?.trim() || null,
        meaning_vi: payload.meaningVi?.trim() || null,
        definition_en: payload.definitionEn?.trim() || null,
        ipa_us: payload.ipaUs?.trim() || null,
        ipa_uk: payload.ipaUk?.trim() || null,
        word_types: payload.wordTypes,
        synonyms: payload.synonyms,
        collocations: payload.collocations,
        example: payload.example?.trim() || null,
        level: payload.level,
      })
      .eq("id", itemId)
      .eq("deck_id", deckId);

    if (error) throw error;

    revalidateVocabularyPaths(deckId);
    return { ok: true };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessErrorMessage(error.message) };
    }
    const message =
      error instanceof Error
        ? error.message
        : copy.admin.vocabulary.errors.saveFailed;
    return { ok: false, error: message };
  }
}

export async function importVocabularyFromJson(
  deckId: string,
  deckName: string,
  raw: string,
): Promise<ImportVocabularyJsonResult> {
  try {
    const { supabase } = await requireAdminSession();
    const summary = await importVocabularyJsonFromRaw(
      supabase,
      deckId,
      deckName,
      raw,
    );

    revalidateVocabularyPaths(deckId);
    return { ok: true, summary };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessErrorMessage(error.message) };
    }
    if (error instanceof SyntaxError) {
      return {
        ok: false,
        error: copy.admin.vocabularyImport.errors.invalidJson,
      };
    }
    if (error instanceof ZodError) {
      return {
        ok: false,
        error: copy.admin.vocabularyImport.errors.invalidSchema,
      };
    }
    const message =
      error instanceof Error
        ? error.message
        : copy.admin.vocabularyImport.errors.generic;
    return { ok: false, error: message };
  }
}

export async function importVocabularyDeckFromUpload(
  formData: FormData,
): Promise<
  | { ok: true; deckId: string; summary: ImportVocabularyJsonSummary }
  | { ok: false; error: string }
> {
  const startedAt = performance.now();

  try {
    const { supabase } = await requireAdminSession();
    const name = String(formData.get("name") ?? "").trim();

    if (!name) {
      return { ok: false, error: copy.admin.vocabManage.errors.nameRequired };
    }

    const file = validateUploadFile(formData.get("file"));
    if (typeof file === "string") {
      return { ok: false, error: file };
    }

    const mimeType = resolveUploadMimeType(file)!;
    const createResult = await createVocabularyDeck(name);
    if (!createResult.ok) {
      return createResult;
    }

    const deckId = createResult.deckId;
    let raw: string;

    if (mimeType === "application/json") {
      raw = await file.text();
      if (file.size > MAX_JSON_BYTES) {
        await deleteVocabularyDeck(deckId);
        return {
          ok: false,
          error: copy.admin.vocabularyImport.errors.fileTooLarge,
        };
      }
    } else {
      geminiLog("vocabulary_deck_upload_start", {
        deckId,
        deckName: name,
        fileName: file.name,
        mimeType,
        fileSizeKb: Math.round(file.size / 1024),
      });

      const fileBytes = Buffer.from(await file.arrayBuffer());
      raw = await extractVocabularyDeckFromFileBuffer(
        name,
        fileBytes,
        mimeType,
      );
    }

    const summary = await importVocabularyJsonFromRaw(
      supabase,
      deckId,
      name,
      raw,
    );

    revalidateVocabularyPaths(deckId);

    geminiLog("vocabulary_deck_upload_success", {
      deckId,
      wordCount: summary.wordCount,
      totalMs: elapsedMs(startedAt),
    });

    return { ok: true, deckId, summary };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessErrorMessage(error.message) };
    }

    const message = error instanceof Error ? error.message : String(error);
    if (/GEMINI_API_KEY/i.test(message)) {
      return {
        ok: false,
        error: copy.admin.vocabularyImport.errors.geminiMissingApiKey,
      };
    }
    if (isRetryableGeminiError(error)) {
      return {
        ok: false,
        error: copy.admin.vocabularyImport.errors.geminiRateLimited,
      };
    }

    geminiError(
      "vocabulary_deck_upload_failed",
      { totalMs: elapsedMs(startedAt) },
      error,
    );

    const mapped =
      error instanceof SyntaxError
        ? copy.admin.vocabularyImport.errors.invalidJson
        : error instanceof ZodError
          ? copy.admin.vocabularyImport.errors.invalidSchema
          : message || copy.admin.vocabularyImport.errors.generic;

    return { ok: false, error: mapped };
  }
}

export type RegenerateVocabularyDeckResult =
  | { ok: true; wordCount: number }
  | { ok: false; error: string };

export async function regenerateVocabularyDeck(
  deckId: string,
): Promise<RegenerateVocabularyDeckResult> {
  const startedAt = performance.now();

  try {
    const { supabase } = await requireAdminSession();

    const { data: deck, error: deckError } = await supabase
      .from("vocabulary_decks")
      .select("id, name, owner_id")
      .eq("id", deckId)
      .maybeSingle();

    if (deckError) throw deckError;
    if (!deck) {
      return { ok: false, error: copy.admin.vocabManage.errors.generic };
    }
    if (deck.owner_id != null) {
      return {
        ok: false,
        error: copy.admin.vocabManage.errors.notCommonDeck,
      };
    }

    const result = await regenerateDeckVocabularyFromExistingTerms(
      supabase,
      deck.id as string,
      deck.name as string,
    );

    revalidateVocabularyPaths(deckId);

    geminiLog("vocabulary_deck_regenerate_success", {
      deckId,
      wordCount: result.wordCount,
      totalMs: elapsedMs(startedAt),
    });

    return { ok: true, wordCount: result.wordCount };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessErrorMessage(error.message) };
    }

    const message = error instanceof Error ? error.message : String(error);
    if (message === "empty_deck") {
      return { ok: false, error: copy.admin.vocabManage.errors.emptyDeck };
    }
    if (/GEMINI_API_KEY/i.test(message)) {
      return {
        ok: false,
        error: copy.admin.vocabularyImport.errors.geminiMissingApiKey,
      };
    }
    if (isRetryableGeminiError(error)) {
      return {
        ok: false,
        error: copy.admin.vocabularyImport.errors.geminiRateLimited,
      };
    }

    geminiError(
      "vocabulary_deck_regenerate_failed",
      { deckId, totalMs: elapsedMs(startedAt) },
      error,
    );

    const mapped =
      error instanceof SyntaxError
        ? copy.admin.vocabularyImport.errors.invalidJson
        : error instanceof ZodError
          ? copy.admin.vocabularyImport.errors.invalidSchema
          : message || copy.admin.vocabManage.errors.generic;

    return { ok: false, error: mapped };
  }
}

export async function reimportVocabularyDeckFromUpload(
  deckId: string,
  deckName: string,
  formData: FormData,
): Promise<ImportVocabularyJsonResult> {
  const startedAt = performance.now();

  try {
    const { supabase } = await requireAdminSession();
    const file = validateUploadFile(formData.get("file"));

    if (typeof file === "string") {
      return { ok: false, error: file };
    }

    const mimeType = resolveUploadMimeType(file)!;
    let raw: string;

    if (mimeType === "application/json") {
      raw = await file.text();
      if (file.size > MAX_JSON_BYTES) {
        return {
          ok: false,
          error: copy.admin.vocabularyImport.errors.fileTooLarge,
        };
      }
    } else {
      geminiLog("vocabulary_deck_reupload_start", {
        deckId,
        deckName,
        fileName: file.name,
        mimeType,
        fileSizeKb: Math.round(file.size / 1024),
      });

      const fileBytes = Buffer.from(await file.arrayBuffer());
      raw = await extractVocabularyDeckFromFileBuffer(
        deckName,
        fileBytes,
        mimeType,
      );
    }

    const summary = await importVocabularyJsonFromRaw(
      supabase,
      deckId,
      deckName,
      raw,
    );

    revalidateVocabularyPaths(deckId);

    geminiLog("vocabulary_deck_reupload_success", {
      deckId,
      wordCount: summary.wordCount,
      totalMs: elapsedMs(startedAt),
    });

    return { ok: true, summary };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessErrorMessage(error.message) };
    }

    const message = error instanceof Error ? error.message : String(error);
    if (/GEMINI_API_KEY/i.test(message)) {
      return {
        ok: false,
        error: copy.admin.vocabularyImport.errors.geminiMissingApiKey,
      };
    }
    if (isRetryableGeminiError(error)) {
      return {
        ok: false,
        error: copy.admin.vocabularyImport.errors.geminiRateLimited,
      };
    }

    geminiError(
      "vocabulary_deck_reupload_failed",
      { deckId, totalMs: elapsedMs(startedAt) },
      error,
    );

    const mapped =
      error instanceof SyntaxError
        ? copy.admin.vocabularyImport.errors.invalidJson
        : error instanceof ZodError
          ? copy.admin.vocabularyImport.errors.invalidSchema
          : message || copy.admin.vocabularyImport.errors.generic;

    return { ok: false, error: mapped };
  }
}
