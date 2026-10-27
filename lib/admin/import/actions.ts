"use server";

import { ZodError } from "zod";
import { revalidatePath } from "next/cache";
import { revalidateAdminExamCatalogPaths } from "@/lib/admin/revalidate-admin-exam-catalog";
import {
	AdminAccessError,
	requireAdminSession,
} from "@/lib/admin/auth/require-admin";
import { importListeningJsonFromRaw } from "@/lib/admin/import/import-listening-json";
import type { ImportListeningJsonSummary } from "@/lib/admin/import/import-listening-json";
import { importPassageTranslationsFromRaw } from "@/lib/admin/import/import-passage-translations";
import { importReadingPart5TranslationsFromRaw } from "@/lib/admin/import/import-reading-part5-translations";
import type { ImportPassageTranslationsSummary } from "@/lib/admin/import/import-passage-translations";
import { importReadingJsonFromRaw } from "@/lib/admin/import/import-reading-json";
import type { ImportReadingJsonSummary } from "@/lib/admin/import/import-reading-json";
import { sectionImportPrecheck } from "@/lib/admin/import/section-import-precheck";
import { passageTranslationDebugLog } from "@/lib/admin/debug/passage-translation-debug-log";
import { copy } from "@/lib/copy/vi";

const MAX_JSON_BYTES = 10 * 1024 * 1024;

export type ImportListeningJsonResult =
	| { ok: true; summary: ImportListeningJsonSummary }
	| { ok: false; error: string };

export type ImportReadingJsonResult =
	| { ok: true; summary: ImportReadingJsonSummary }
	| { ok: false; error: string };

export type ImportPassageTranslationsResult =
	| { ok: true; summary: ImportPassageTranslationsSummary }
	| { ok: false; error: string };

function listeningAccessErrorMessage(code: string): string {
	if (code === "not_signed_in")
		return copy.admin.listeningImport.errors.notSignedIn;
	if (code === "not_admin") return copy.admin.listeningImport.errors.notAdmin;
	return copy.admin.listeningImport.errors.generic;
}

function readingAccessErrorMessage(code: string): string {
	if (code === "not_signed_in")
		return copy.admin.readingImport.errors.notSignedIn;
	if (code === "not_admin") return copy.admin.readingImport.errors.notAdmin;
	return copy.admin.readingImport.errors.generic;
}

type JsonFileValidationErrors = Pick<
	typeof copy.admin.listeningImport.errors,
	"missingFile" | "invalidType" | "fileTooLarge"
>;

function validateJsonFile(
	file: FormDataEntryValue | null,
	errors: JsonFileValidationErrors,
): File | string {
	if (!(file instanceof File) || file.size === 0) {
		return errors.missingFile;
	}

	const isJson =
		file.type === "application/json" ||
		file.name.toLowerCase().endsWith(".json");

	if (!isJson) {
		return errors.invalidType;
	}

	if (file.size > MAX_JSON_BYTES) {
		return errors.fileTooLarge;
	}

	return file;
}

export async function importListeningFromJson(
	formData: FormData,
): Promise<ImportListeningJsonResult> {
	try {
		const { supabase } = await requireAdminSession();
		const file = validateJsonFile(
			formData.get("file"),
			copy.admin.listeningImport.errors,
		);

		if (typeof file === "string") {
			return { ok: false, error: file };
		}

		const raw = await file.text();
		const precheckError = sectionImportPrecheck(raw, "listening");
		if (precheckError) {
			return { ok: false, error: precheckError };
		}

		const summary = await importListeningJsonFromRaw(supabase, raw);

		revalidatePath("/admin");
		revalidateAdminExamCatalogPaths();

		return { ok: true, summary };
	} catch (error) {
		if (error instanceof AdminAccessError) {
			return {
				ok: false,
				error: listeningAccessErrorMessage(error.message),
			};
		}

		if (error instanceof SyntaxError) {
			return {
				ok: false,
				error: copy.admin.listeningImport.errors.invalidJson,
			};
		}

		if (error instanceof ZodError) {
			return {
				ok: false,
				error: copy.admin.listeningImport.errors.invalidSchema,
			};
		}

		const message =
			error instanceof Error
				? error.message
				: copy.admin.listeningImport.errors.generic;

		return { ok: false, error: message };
	}
}

export async function importReadingFromJson(
	formData: FormData,
): Promise<ImportReadingJsonResult> {
	try {
		const { supabase } = await requireAdminSession();
		const file = validateJsonFile(
			formData.get("file"),
			copy.admin.readingImport.errors,
		);

		if (typeof file === "string") {
			return { ok: false, error: file };
		}

		const raw = await file.text();
		const precheckError = sectionImportPrecheck(raw, "reading");
		if (precheckError) {
			return { ok: false, error: precheckError };
		}

		const summary = await importReadingJsonFromRaw(supabase, raw);

		revalidatePath("/admin");
		revalidateAdminExamCatalogPaths();

		return { ok: true, summary };
	} catch (error) {
		if (error instanceof AdminAccessError) {
			return {
				ok: false,
				error: readingAccessErrorMessage(error.message),
			};
		}

		if (error instanceof SyntaxError) {
			return {
				ok: false,
				error: copy.admin.readingImport.errors.invalidJson,
			};
		}

		if (error instanceof ZodError) {
			return {
				ok: false,
				error: copy.admin.readingImport.errors.invalidSchema,
			};
		}

		const message =
			error instanceof Error
				? error.message
				: copy.admin.readingImport.errors.generic;

		return { ok: false, error: message };
	}
}

function passageTranslationAccessErrorMessage(code: string): string {
	if (code === "not_signed_in") {
		return copy.admin.passageTranslationImport.errors.notSignedIn;
	}
	if (code === "not_admin") {
		return copy.admin.passageTranslationImport.errors.notAdmin;
	}
	return copy.admin.passageTranslationImport.errors.generic;
}

function passageTranslationErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	if (
		typeof error === "object" &&
		error !== null &&
		"message" in error &&
		typeof (error as { message: unknown }).message === "string"
	) {
		return (error as { message: string }).message;
	}
	return copy.admin.passageTranslationImport.errors.generic;
}

export async function importPassageTranslationsFromJson(
	bookId: string,
	testId: string,
	part: number,
	formData: FormData,
): Promise<ImportPassageTranslationsResult> {
	// #region agent log
	passageTranslationDebugLog(
		"actions.ts:import-entry",
		"server action called",
		{ bookId, testId, part },
		"H6",
	);
	// #endregion

	if (part !== 3 && part !== 4 && part !== 5 && part !== 6 && part !== 7) {
		return {
			ok: false,
			error: copy.admin.passageTranslationImport.errors.wrongPart,
		};
	}

	try {
		const { supabase } = await requireAdminSession();
		const file = validateJsonFile(
			formData.get("file"),
			copy.admin.passageTranslationImport.errors,
		);

		if (typeof file === "string") {
			// #region agent log
			passageTranslationDebugLog(
				"actions.ts:file-validation",
				"file validation failed",
				{ error: file },
				"H6",
			);
			// #endregion
			return { ok: false, error: file };
		}

		const raw = await file.text();
		const summary =
			part === 5
				? {
						...(await importReadingPart5TranslationsFromRaw(
							supabase,
							bookId,
							testId,
							raw,
						)),
						part: 5 as const,
						passagesUpdated: 0,
						notFoundPassageSlugs: [] as string[],
					}
				: await importPassageTranslationsFromRaw(
						supabase,
						bookId,
						testId,
						part,
						raw,
					);

		revalidatePath("/admin");
		revalidateAdminExamCatalogPaths();

		// #region agent log
		passageTranslationDebugLog(
			"actions.ts:success",
			"import succeeded",
			{ summary },
			"H6",
		);
		// #endregion

		return { ok: true, summary };
	} catch (error) {
		// #region agent log
		passageTranslationDebugLog(
			"actions.ts:catch",
			"import failed",
			{
				errorName: error instanceof Error ? error.name : typeof error,
				errorMessage:
					error instanceof Error ? error.message : String(error),
				isAdminAccessError: error instanceof AdminAccessError,
				isZodError: error instanceof ZodError,
				zodIssues:
					error instanceof ZodError
						? error.issues.map((issue) => ({
								path: issue.path.join("."),
								message: issue.message,
							}))
						: null,
			},
			"H1",
		);
		// #endregion

		if (error instanceof AdminAccessError) {
			return {
				ok: false,
				error: passageTranslationAccessErrorMessage(error.message),
			};
		}

		if (error instanceof SyntaxError) {
			return {
				ok: false,
				error: copy.admin.passageTranslationImport.errors.invalidJson,
			};
		}

		if (error instanceof ZodError) {
			const detail = error.issues
				.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
				.join("; ");
			return {
				ok: false,
				error: `${copy.admin.passageTranslationImport.errors.invalidSchema} (${detail})`,
			};
		}

		const message = passageTranslationErrorMessage(error);

		return { ok: false, error: message };
	}
}
