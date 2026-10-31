"use server";

import { revalidatePath } from "next/cache";
import { revalidateAdminExamCatalogPaths } from "@/lib/admin/revalidate-admin-exam-catalog";
import { ZodError } from "zod";
import { AdminAccessError, requireAdminSession } from "@/lib/admin/auth/require-admin";
import {
  importListeningPart12Raw,
  importListeningPart3Raw,
  importListeningPart4Raw,
  importReadingPartRaw,
} from "@/lib/admin/content/import-exam-part-helpers";
import { mergeCreateExamReadingImport } from "@/lib/admin/import/merge-create-exam-reading-parts";
import { sectionImportPrecheck } from "@/lib/admin/import/section-import-precheck";
import { importReadingJsonFromRaw } from "@/lib/admin/import/import-reading-json";
import { deleteTestRow } from "@/lib/admin/content/delete-exam-test";
import { generateAndImportPassageTranslations } from "@/lib/admin/content/generate-and-import-passage-translations";
import { generateAndImportReadingPart5Translations } from "@/lib/admin/content/generate-and-import-reading-part5-translations";
import { isExamBook } from "@/lib/content/catalog-ids";
import { slugifyCatalogId } from "@/lib/content/slugify-catalog-id";
import { copy } from "@/lib/copy/vi";
import { listeningParts, readingParts } from "@/lib/mock";

const MAX_JSON_BYTES = 10 * 1024 * 1024;

export type CreateExamPipelineStepId =
  | "listeningPart12"
  | "listeningPart3"
  | "listeningPart4"
  | "reading";

export type CreateExamStepResult =
  | { ok: true }
  | { ok: false; error: string };

export type CreateExamInitResult =
  | { ok: true; data: { bookId: string; testId: string; testLabel: string } }
  | { ok: false; error: string };

function accessError(code: string): string {
  if (code === "not_signed_in") return copy.admin.import.errors.notSignedIn;
  if (code === "not_admin") return copy.admin.import.errors.notAdmin;
  return copy.admin.cms.errors.generic;
}

function parseJsonFile(value: FormDataEntryValue | null): File | null {
  if (!(value instanceof File) || value.size === 0) return null;

  const isJson =
    value.type === "application/json" ||
    value.name.toLowerCase().endsWith(".json");

  if (!isJson) {
    throw new Error(copy.admin.listeningImport.errors.invalidType);
  }

  if (value.size > MAX_JSON_BYTES) {
    throw new Error(copy.admin.listeningImport.errors.fileTooLarge);
  }

  return value;
}

async function resolveBookId(
  supabase: Awaited<ReturnType<typeof requireAdminSession>>["supabase"],
  bookMode: string,
  bookId: string,
  bookName: string,
): Promise<string> {
  if (bookMode === "new") {
    const name = bookName.trim();
    if (!name) {
      throw new Error(copy.admin.exams.create.bookRequired);
    }

    const id = slugifyCatalogId(name);
    if (!id) {
      throw new Error(copy.admin.exams.create.bookRequired);
    }

    const { data: existing } = await supabase
      .from("books")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (!existing) {
      const { data: maxRow } = await supabase
        .from("books")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();

      const sortOrder = ((maxRow?.sort_order as number | undefined) ?? 0) + 1;

      const { error } = await supabase.from("books").insert({
        id,
        name,
        publisher: "",
        year: new Date().getFullYear(),
        sort_order: sortOrder,
      });

      if (error) throw error;
    }

    return id;
  }

  const id = bookId.trim();
  if (!id || !isExamBook(id)) {
    throw new Error(copy.admin.exams.create.bookRequired);
  }

  return id;
}

function revalidateExamPaths(bookId: string, testId: string) {
  revalidatePath("/");
  revalidateAdminExamCatalogPaths(bookId, testId);
}

function isTruncatedMultipartError(error: unknown): boolean {
  const message = errorMessageFromUnknown(error);
  return /unexpected end of form|body exceeded|413/i.test(message);
}

function isLikelyTimeoutError(error: unknown): boolean {
  if (!error) return false;
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  return /timeout|timed out|ETIMEDOUT|ECONNRESET|aborted|socket hang up/i.test(
    message,
  );
}

function errorMessageFromUnknown(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return accessError("generic");
}

function mapInitError(error: unknown): CreateExamInitResult {
  return mapStepError(error) as CreateExamInitResult;
}

function mapStepError(error: unknown): CreateExamStepResult {
  if (error instanceof AdminAccessError) {
    return { ok: false, error: accessError(error.message) };
  }

  if (error instanceof SyntaxError) {
    return { ok: false, error: copy.admin.listeningImport.errors.invalidJson };
  }

  if (error instanceof ZodError) {
    return { ok: false, error: copy.admin.listeningImport.errors.invalidSchema };
  }

  if (isLikelyTimeoutError(error)) {
    return { ok: false, error: copy.admin.exams.create.requestTimeout };
  }

  if (isTruncatedMultipartError(error)) {
    return { ok: false, error: copy.admin.exams.create.uploadBodyTooLarge };
  }

  return {
    ok: false,
    error: errorMessageFromUnknown(error),
  };
}

export async function createExamTestInit(
  formData: FormData,
): Promise<CreateExamInitResult> {
  try {
    const { supabase } = await requireAdminSession();

    const bookMode = String(formData.get("bookMode") ?? "existing");
    const bookIdInput = String(formData.get("bookId") ?? "");
    const bookName = String(formData.get("bookName") ?? "");
    const testLabel = String(formData.get("testLabel") ?? "").trim();

    if (!testLabel) {
      return { ok: false, error: copy.admin.exams.create.testRequired };
    }

    const resolvedBookId = await resolveBookId(
      supabase,
      bookMode,
      bookIdInput,
      bookName,
    );
    const testId = slugifyCatalogId(testLabel);

    if (!testId) {
      return { ok: false, error: copy.admin.exams.create.testRequired };
    }

    const { data: existingTest } = await supabase
      .from("tests")
      .select("id")
      .eq("book_id", resolvedBookId)
      .eq("id", testId)
      .maybeSingle();

    if (existingTest) {
      return {
        ok: false,
        error: copy.admin.exams.create.duplicateTest(resolvedBookId, testId),
      };
    }

    const { data: maxSortRow } = await supabase
      .from("tests")
      .select("sort_order")
      .eq("book_id", resolvedBookId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const sortOrder = ((maxSortRow?.sort_order as number | undefined) ?? 0) + 1;

    const { error: testError } = await supabase.from("tests").insert({
      book_id: resolvedBookId,
      id: testId,
      label: testLabel,
      sort_order: sortOrder,
      published: false,
      listening_published: false,
      reading_published: false,
      access_tier: "free",
    });

    if (testError) throw testError;

    const allParts = [...listeningParts, ...readingParts];
    const partRows = allParts.map((part) => ({
      book_id: resolvedBookId,
      test_id: testId,
      part: String(part.part),
      title: part.title,
      question_count_target: part.questionCount,
      sort_order: part.part,
    }));

    const { error: partsError } = await supabase.from("test_parts").insert(partRows);
    if (partsError) throw partsError;

    return {
      ok: true,
      data: { bookId: resolvedBookId, testId, testLabel },
    };
  } catch (error) {
    return mapInitError(error);
  }
}

export async function createExamTestPipelineStep(
  step: CreateExamPipelineStepId,
  bookId: string,
  testId: string,
  testLabel: string,
  formData: FormData,
): Promise<CreateExamStepResult> {
  try {
    const { supabase } = await requireAdminSession();

    if (step === "listeningPart12") {
      const listeningPart12JsonFile = parseJsonFile(
        formData.get("listeningPart12Json"),
      );
      if (!listeningPart12JsonFile) return { ok: true };

      const raw = await listeningPart12JsonFile.text();
      await importListeningPart12Raw(supabase, raw, bookId, testId, testLabel);
      return { ok: true };
    }

    if (step === "listeningPart3") {
      const listeningPart3JsonFile = parseJsonFile(
        formData.get("listeningPart3Json"),
      );
      if (!listeningPart3JsonFile) return { ok: true };

      const raw = await listeningPart3JsonFile.text();
      await importListeningPart3Raw(supabase, raw, bookId, testId, testLabel);
      return { ok: true };
    }

    if (step === "listeningPart4") {
      const listeningPart4JsonFile = parseJsonFile(
        formData.get("listeningPart4Json"),
      );
      if (!listeningPart4JsonFile) return { ok: true };

      const raw = await listeningPart4JsonFile.text();
      await importListeningPart4Raw(supabase, raw, bookId, testId, testLabel);
      return { ok: true };
    }

    if (step === "reading") {
      const readingPartRaws: Partial<Record<5 | 6 | 7, string>> = {};
      for (const part of [5, 6, 7] as const) {
        const file = parseJsonFile(formData.get(`readingJson${part}`));
        if (file) {
          readingPartRaws[part] = await file.text();
        }
      }

      const mergedReadingImport = mergeCreateExamReadingImport(
        readingPartRaws,
        bookId,
        testId,
        testLabel,
      );
      if (!mergedReadingImport) return { ok: true };

      const precheckError = sectionImportPrecheck(mergedReadingImport, "reading");
      if (precheckError) throw new Error(precheckError);

      await importReadingJsonFromRaw(supabase, mergedReadingImport, {
        clearMode: "file-parts",
      });

      for (const part of [5, 6, 7] as const) {
        if (readingPartRaws[part]) {
          if (part === 5) {
            await generateAndImportReadingPart5Translations(
              supabase,
              bookId,
              testId,
            );
          } else {
            await generateAndImportPassageTranslations(
              supabase,
              bookId,
              testId,
              part,
            );
          }
        }
      }

      return { ok: true };
    }

    return { ok: false, error: accessError("generic") };
  } catch (error) {
    return mapStepError(error);
  }
}

export async function finalizeCreateExamTest(
  bookId: string,
  testId: string,
): Promise<CreateExamStepResult> {
  try {
    await requireAdminSession();
    revalidateExamPaths(bookId, testId);
    return { ok: true };
  } catch (error) {
    return mapStepError(error);
  }
}

export async function rollbackCreateExamTest(
  bookId: string,
  testId: string,
): Promise<void> {
  try {
    const { supabase } = await requireAdminSession();
    await deleteTestRow(supabase, bookId, testId);
  } catch {
    // Best-effort rollback; original error is shown to the user.
  }
}
