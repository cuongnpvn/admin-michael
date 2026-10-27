"use server";

import {
	AdminAccessError,
	requireAdminSession,
} from "@/lib/admin/auth/require-admin";
import {
	extractExamPartFromPdfBuffer,
	extractReadingPart7FromPdfBuffers,
	type ExtractExamPartContext,
} from "@/lib/admin/gemini/extract-exam-part-from-pdf";
import {
	AnswerKeyCoverageError,
	AnswerKeyMismatchError,
} from "@/lib/admin/answer-key/load-answer-keys";
import {
	elapsedMs,
	geminiError,
	geminiLog,
} from "@/lib/admin/gemini/gemini-log";
import { isGeminiExtractDebugError } from "@/lib/admin/gemini/gemini-extract-debug-error";
import { isRetryableGeminiError } from "@/lib/admin/gemini/is-retryable-gemini-error";
import { MAX_PDF_BYTES } from "@/lib/admin/gemini/constants";
import { EXAM_PART_MODULES } from "@/lib/admin/instructions/exam-part-modules";
import type { AdminInstructionId } from "@/lib/admin/instructions/catalog";
import { isReadingPart7SegmentId } from "@/lib/content/reading-part-7-segments";
import { copy } from "@/lib/copy/vi";

export type ExtractExamPartResult =
	| { ok: true; rawJson: string }
	| { ok: false; error: string; debugJson?: string };

function isExamModuleId(value: string): value is AdminInstructionId {
	return EXAM_PART_MODULES.some((module) => module.id === value);
}

function isSinglePdfExtractModuleId(
	value: string,
): value is AdminInstructionId {
	if (value === "reading-part-7") return false;
	return isExamModuleId(value) || isReadingPart7SegmentId(value);
}

function parsePdfFile(value: FormDataEntryValue | null): File | null {
	if (!(value instanceof File) || value.size === 0) return null;

	const isPdf =
		value.type === "application/pdf" ||
		value.name.toLowerCase().endsWith(".pdf");

	if (!isPdf) {
		throw new Error(copy.admin.exams.create.pdfInvalidType);
	}

	if (value.size > MAX_PDF_BYTES) {
		throw new Error(copy.admin.exams.create.pdfTooLarge);
	}

	return value;
}

function mapExtractError(
	moduleId: string,
	error: unknown,
): ExtractExamPartResult {
	const debugJson = isGeminiExtractDebugError(error)
		? error.debugJson
		: undefined;

	if (error instanceof AdminAccessError) {
		if (error.message === "not_signed_in") {
			return { ok: false, error: copy.admin.import.errors.notSignedIn };
		}
		if (error.message === "not_admin") {
			return { ok: false, error: copy.admin.import.errors.notAdmin };
		}
	}

	if (error instanceof SyntaxError) {
		return {
			ok: false,
			error: copy.admin.exams.create.geminiInvalidJson,
			debugJson,
		};
	}

	const message = error instanceof Error ? error.message : String(error);

	if (
		error instanceof AnswerKeyCoverageError ||
		error instanceof AnswerKeyMismatchError
	) {
		return { ok: false, error: message };
	}

	if (/GEMINI_API_KEY/i.test(message)) {
		return {
			ok: false,
			error: copy.admin.exams.create.geminiMissingApiKey,
		};
	}

	if (
		/timeout|timed out|ETIMEDOUT|ECONNRESET|aborted|socket hang up/i.test(
			message,
		)
	) {
		return { ok: false, error: copy.admin.exams.create.requestTimeout };
	}

	if (/copyright|recitation/i.test(message)) {
		const isReadingPart7 =
			moduleId === "reading-part-7" || isReadingPart7SegmentId(moduleId);
		return {
			ok: false,
			error: isReadingPart7
				? copy.admin.exams.create.geminiCopyrightBlockedReadingPart7
				: copy.admin.exams.create.geminiCopyrightBlocked,
		};
	}

	if (isRetryableGeminiError(error)) {
		return { ok: false, error: copy.admin.exams.create.geminiRateLimited };
	}

	return {
		ok: false,
		error: message || copy.admin.exams.create.geminiFailed,
		debugJson,
	};
}

function parseBookTestContext(
	formData: FormData,
): Pick<ExtractExamPartContext, "bookId" | "testId"> | null {
	const bookId = String(formData.get("bookId") ?? "").trim();
	const testId = String(formData.get("testId") ?? "").trim();
	if (!bookId || !testId) return null;
	return { bookId, testId };
}

function moduleRequiresAnswerKey(moduleId: string): boolean {
	return (
		moduleId === "listening-parts-1-2" ||
		// Part 3 attaches answer keys at the process step (like Part 7).
		moduleId === "listening-part-4" ||
		moduleId === "reading-part-5" ||
		moduleId === "reading-part-6"
	);
}

export async function extractExamPartFromPdf(
	formData: FormData,
): Promise<ExtractExamPartResult> {
	const startedAt = performance.now();
	let moduleId = "";

	try {
		const { supabase } = await requireAdminSession();

		moduleId = String(formData.get("moduleId") ?? "");
		if (!isSinglePdfExtractModuleId(moduleId)) {
			geminiError("action_invalid_module", { moduleId });
			if (moduleId === "reading-part-7") {
				return {
					ok: false,
					error: copy.admin.exams.create.readingPart7BothPdfsRequired,
				};
			}
			return { ok: false, error: copy.admin.cms.errors.generic };
		}

		const pdfFile = parsePdfFile(formData.get("pdf"));
		if (!pdfFile) {
			geminiError("action_missing_pdf", { moduleId });
			return { ok: false, error: copy.admin.exams.create.pdfRequired };
		}

		geminiLog("action_start", {
			moduleId,
			fileName: pdfFile.name,
			fileSizeKb: Math.round(pdfFile.size / 1024),
			mimeType: pdfFile.type || "application/pdf",
		});

		const pdfBytes = Buffer.from(await pdfFile.arrayBuffer());
		const bookTest = parseBookTestContext(formData);
		if (moduleRequiresAnswerKey(moduleId) && !bookTest) {
			return {
				ok: false,
				error: copy.admin.exams.create.readingAnswerKeyBookTestRequired,
			};
		}

		const context: ExtractExamPartContext | undefined = bookTest
			? { supabase, ...bookTest }
			: undefined;

		const rawJson = await extractExamPartFromPdfBuffer(
			moduleId,
			pdfBytes,
			context,
		);

		geminiLog("action_success", {
			moduleId,
			rawJsonChars: rawJson.length,
			totalMs: elapsedMs(startedAt),
		});

		return { ok: true, rawJson };
	} catch (error) {
		const mapped = mapExtractError(moduleId, error);
		geminiError(
			"action_failed",
			{
				moduleId: moduleId || "unknown",
				mappedError: mapped.ok ? null : mapped.error,
				totalMs: elapsedMs(startedAt),
			},
			error,
		);
		return mapped;
	}
}

export async function extractReadingPart7FromPdfs(
	formData: FormData,
): Promise<ExtractExamPartResult> {
	const startedAt = performance.now();
	const moduleId = "reading-part-7";

	try {
		const { supabase } = await requireAdminSession();

		const pdfSingle = parsePdfFile(formData.get("pdfSingle"));
		const pdfMulti = parsePdfFile(formData.get("pdfMulti"));

		if (!pdfSingle || !pdfMulti) {
			geminiError("action_missing_pdf", {
				moduleId,
				hasSingle: Boolean(pdfSingle),
				hasMulti: Boolean(pdfMulti),
			});
			return {
				ok: false,
				error: copy.admin.exams.create.readingPart7BothPdfsRequired,
			};
		}

		geminiLog("action_start", {
			moduleId,
			singleFileName: pdfSingle.name,
			singleFileSizeKb: Math.round(pdfSingle.size / 1024),
			multiFileName: pdfMulti.name,
			multiFileSizeKb: Math.round(pdfMulti.size / 1024),
		});

		const [singleBytes, multiBytes] = await Promise.all([
			pdfSingle.arrayBuffer(),
			pdfMulti.arrayBuffer(),
		]);

		const bookTest = parseBookTestContext(formData);
		const context: ExtractExamPartContext | undefined = bookTest
			? { supabase, ...bookTest }
			: undefined;

		const rawJson = await extractReadingPart7FromPdfBuffers(
			Buffer.from(singleBytes),
			Buffer.from(multiBytes),
			context,
		);

		geminiLog("action_success", {
			moduleId,
			rawJsonChars: rawJson.length,
			totalMs: elapsedMs(startedAt),
		});

		return { ok: true, rawJson };
	} catch (error) {
		const mapped = mapExtractError(moduleId, error);
		geminiError(
			"action_failed",
			{
				moduleId,
				mappedError: mapped.ok ? null : mapped.error,
				totalMs: elapsedMs(startedAt),
			},
			error,
		);
		return mapped;
	}
}
