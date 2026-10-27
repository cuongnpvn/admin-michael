import {
	yieldProgressUi,
	type ExamModulePhaseStatus,
} from "@/components/admin/exams/admin-create-exam-test-progress";
import {
	exportExamPartContentVocabulary,
	exportExamPartPassageTranslations,
	exportListeningTranscriptTranslations,
	extractExamPartContentVocabularyExport,
	importExamPartContentVocabularyJson,
	importExamPartPassageTranslationJson,
	importListeningTranscriptTranslationJson,
	translateExamPartPassageExport,
	translateListeningTranscriptExport,
} from "@/lib/admin/content/import-exam-part-from-raw";
import {
	extractExamPartFromPdf,
	extractReadingPart7FromPdfs,
	type ExtractExamPartResult,
} from "@/lib/admin/gemini/actions";
import type { AdminInstructionId } from "@/lib/admin/instructions/catalog";
import {
	contentVocabularyPartsForExamModule,
} from "@/lib/admin/instructions/exam-part-modules";
import type { ContentVocabularyPart } from "@/lib/content/content-vocabulary-export-schema";
import {
	isReadingPart5ValidationError,
	READING_PART5_VALIDATION_MAX_ATTEMPTS,
} from "@/lib/admin/gemini/validate-reading-part-5-extract";

type ProgressPatch = Partial<ExamModulePhaseStatus>;
type OnPhaseProgress = (patch: ProgressPatch) => void;

function geminiAttemptProgress(
	moduleId: AdminInstructionId,
	attempt: number,
): Pick<ExamModulePhaseStatus, "retryAttempt" | "maxAttempts"> {
	if (moduleId !== "reading-part-5") return {};
	return {
		retryAttempt: attempt,
		maxAttempts: READING_PART5_VALIDATION_MAX_ATTEMPTS,
	};
}

async function extractExamPartWithValidationRetries(
	moduleId: AdminInstructionId,
	formData: FormData,
	onProgress: OnPhaseProgress,
): Promise<ExtractExamPartResult> {
	const maxAttempts =
		moduleId === "reading-part-5"
			? READING_PART5_VALIDATION_MAX_ATTEMPTS
			: 1;

	let lastError = "";

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		if (attempt > 1) {
			onProgress({
				status: "running",
				detail: "retrying",
				error: lastError,
				...geminiAttemptProgress(moduleId, attempt),
			});
			await yieldProgressUi();
		}

		onProgress({
			status: "running",
			detail: "sending",
			...geminiAttemptProgress(moduleId, attempt),
		});
		await yieldProgressUi();
		onProgress({
			status: "running",
			detail: "waiting",
			...geminiAttemptProgress(moduleId, attempt),
		});
		await yieldProgressUi();

		const result = await extractExamPartFromPdf(formData);
		if (result.ok) return result;

		lastError = result.error;

		const shouldRetry =
			moduleId === "reading-part-5" &&
			isReadingPart5ValidationError(result.error) &&
			attempt < maxAttempts;

		if (!shouldRetry) {
			onProgress({
				status: "error",
				detail: attempt > 1 ? "retrying" : "waiting",
				error: result.error,
				...geminiAttemptProgress(moduleId, attempt),
			});
			return result;
		}
	}

	return { ok: false, error: lastError };
}

/**
 * One or more `extractExamPartFromPdf` server actions per call.
 * Part 5 validation failures retry up to READING_PART5_VALIDATION_MAX_RETRIES times.
 * UI "sending" / "waiting" / "retrying" states are cosmetic between server calls.
 * Server-side transport retries (rate limits) are capped by GEMINI_MAX_RETRIES (default 4).
 */
export async function runGeminiExtractWithProgress(
	moduleId: AdminInstructionId,
	formData: FormData,
	onProgress: OnPhaseProgress,
): Promise<{ ok: true; rawJson: string } | { ok: false; error: string }> {
	const result = await extractExamPartWithValidationRetries(
		moduleId,
		formData,
		onProgress,
	);

	if (!result.ok) return result;

	onProgress({ status: "done", detail: "complete" });
	return result;
}

/**
 * Two PDFs → parallel segment extracts → merge on server.
 */
export async function runReadingPart7ExtractWithProgress(
	formData: FormData,
	onProgress: OnPhaseProgress,
): Promise<
	| { ok: true; rawJson: string }
	| { ok: false; error: string; debugJson?: string }
> {
	onProgress({ status: "running", detail: "sending" });
	await yieldProgressUi();
	onProgress({ status: "running", detail: "waiting" });
	await yieldProgressUi();

	const result = await extractReadingPart7FromPdfs(formData);

	if (!result.ok) {
		onProgress({
			status: "error",
			detail: result.debugJson ? "parsing" : "waiting",
			error: result.error,
			debugJson: result.debugJson,
		});
		return result;
	}

	onProgress({ status: "done", detail: "complete" });
	return result;
}

/**
 * Three sequential server actions (export → Gemini process → import).
 * Only `translateExamPartPassageExport` calls Gemini, once per invocation.
 */
export async function runPassageTranslationWithProgress(
	moduleId: AdminInstructionId,
	bookId: string,
	testId: string,
	onProgress: OnPhaseProgress,
): Promise<{ ok: true } | { ok: false; error: string }> {
	onProgress({ status: "running", detail: "exporting" });
	await yieldProgressUi();

	const exportResult = await exportExamPartPassageTranslations(
		moduleId,
		bookId,
		testId,
	);
	if (!exportResult.ok || !exportResult.exportJson) {
		onProgress({
			status: "error",
			detail: "exporting",
			error: exportResult.ok ? "Export failed." : exportResult.error,
		});
		return {
			ok: false,
			error: exportResult.ok ? "Export failed." : exportResult.error,
		};
	}

	onProgress({ status: "running", detail: "sending" });
	await yieldProgressUi();
	onProgress({ status: "running", detail: "waiting" });
	await yieldProgressUi();

	const translateResult = await translateExamPartPassageExport(
		exportResult.exportJson,
		moduleId,
		bookId,
		testId,
	);
	if (!translateResult.ok || !translateResult.translationJson) {
		onProgress({
			status: "error",
			detail: "waiting",
			error: translateResult.ok ? "Process failed." : translateResult.error,
		});
		return {
			ok: false,
			error: translateResult.ok ? "Process failed." : translateResult.error,
		};
	}

	onProgress({ status: "running", detail: "importing" });
	await yieldProgressUi();

	const importResult = await importExamPartPassageTranslationJson(
		moduleId,
		bookId,
		testId,
		translateResult.translationJson,
	);
	if (!importResult.ok) {
		onProgress({
			status: "error",
			detail: "importing",
			error: importResult.error,
		});
		return importResult;
	}

	onProgress({ status: "done", detail: "complete" });
	return { ok: true };
}

/** Post-import process step (translation + enrichment for Part 7 / Part 3, etc.). */
export const runModuleProcessWithProgress = runPassageTranslationWithProgress;

/**
 * Optional Part 3 transcript translation after process enrichment.
 * Export → Gemini → import (same phase UX as process).
 */
export async function runListeningTranscriptTranslationWithProgress(
	part: 3 | 4,
	bookId: string,
	testId: string,
	onProgress: OnPhaseProgress,
): Promise<{ ok: true } | { ok: false; error: string }> {
	onProgress({ status: "running", detail: "exporting" });
	await yieldProgressUi();

	const exportResult = await exportListeningTranscriptTranslations(
		part,
		bookId,
		testId,
	);
	if (!exportResult.ok || !exportResult.exportJson) {
		onProgress({
			status: "error",
			detail: "exporting",
			error: exportResult.ok ? "Export failed." : exportResult.error,
		});
		return {
			ok: false,
			error: exportResult.ok ? "Export failed." : exportResult.error,
		};
	}

	onProgress({ status: "running", detail: "sending" });
	await yieldProgressUi();
	onProgress({ status: "running", detail: "waiting" });
	await yieldProgressUi();

	const translateResult = await translateListeningTranscriptExport(
		exportResult.exportJson,
		part,
	);
	if (!translateResult.ok || !translateResult.translationJson) {
		onProgress({
			status: "error",
			detail: "waiting",
			error: translateResult.ok
				? "Translation failed."
				: translateResult.error,
		});
		return {
			ok: false,
			error: translateResult.ok
				? "Translation failed."
				: translateResult.error,
		};
	}

	onProgress({ status: "running", detail: "importing" });
	await yieldProgressUi();

	const importResult = await importListeningTranscriptTranslationJson(
		part,
		bookId,
		testId,
		translateResult.translationJson,
	);
	if (!importResult.ok) {
		onProgress({
			status: "error",
			detail: "importing",
			error: importResult.error,
		});
		return importResult;
	}

	onProgress({ status: "done", detail: "complete" });
	return { ok: true };
}

/**
 * Content vocabulary extract for a single part (CMS Get vocab).
 * Export → Gemini → import.
 */
export async function runContentVocabularyPartWithProgress(
	part: ContentVocabularyPart,
	bookId: string,
	testId: string,
	onProgress: OnPhaseProgress,
): Promise<{ ok: true } | { ok: false; error: string }> {
	onProgress({ status: "running", detail: "exporting" });
	await yieldProgressUi();

	const exportResult = await exportExamPartContentVocabulary(
		part,
		bookId,
		testId,
	);
	if (!exportResult.ok || !exportResult.exportJson) {
		onProgress({
			status: "error",
			detail: "exporting",
			error: exportResult.ok ? "Export failed." : exportResult.error,
		});
		return {
			ok: false,
			error: exportResult.ok ? "Export failed." : exportResult.error,
		};
	}

	onProgress({ status: "running", detail: "sending" });
	await yieldProgressUi();
	onProgress({ status: "running", detail: "waiting" });
	await yieldProgressUi();

	const extractResult = await extractExamPartContentVocabularyExport(
		exportResult.exportJson,
		part,
	);
	if (!extractResult.ok || !extractResult.vocabularyJson) {
		onProgress({
			status: "error",
			detail: "waiting",
			error: extractResult.ok ? "Extract failed." : extractResult.error,
		});
		return {
			ok: false,
			error: extractResult.ok ? "Extract failed." : extractResult.error,
		};
	}

	onProgress({ status: "running", detail: "importing" });
	await yieldProgressUi();

	const importResult = await importExamPartContentVocabularyJson(
		part,
		bookId,
		testId,
		extractResult.vocabularyJson,
	);
	if (!importResult.ok) {
		onProgress({
			status: "error",
			detail: "importing",
			error: importResult.error,
		});
		return importResult;
	}

	onProgress({ status: "done", detail: "complete" });
	return { ok: true };
}

/** Content vocabulary for every part in an exam module (create-exam toggle). */
export async function runContentVocabularyWithProgress(
	moduleId: AdminInstructionId,
	bookId: string,
	testId: string,
	onProgress: OnPhaseProgress,
): Promise<{ ok: true } | { ok: false; error: string }> {
	const parts = contentVocabularyPartsForExamModule(moduleId);
	if (parts.length === 0) {
		onProgress({ status: "skipped" });
		return { ok: true };
	}

	for (let index = 0; index < parts.length; index += 1) {
		const part = parts[index];
		if (part == null) continue;
		const result = await runContentVocabularyPartWithProgress(
			part,
			bookId,
			testId,
			onProgress,
		);
		if (!result.ok) return result;
		if (index < parts.length - 1) {
			onProgress({ status: "running", detail: "exporting" });
			await yieldProgressUi();
		}
	}

	return { ok: true };
}
