import type { SupabaseClient } from "@supabase/supabase-js";
import { copy } from "@/lib/copy/vi";
import type {
	ExamPartScoreBreakdown,
	ExamScoreResult,
} from "@/lib/exam/score-exam";
import {
	partEnumToNumber,
	type LearningActivityRow,
	type PracticeScoreData,
	type VocabularyScoreData,
} from "@/lib/learning/types";
import type { Database } from "@/types/database";
import type { StudentActivitySummary } from "@/lib/classes/types";
import {
  catalogDisplayKey,
  type CatalogDisplayNames,
} from "@/lib/content/resolve-catalog-display";

interface ActivityDbRow {
	id: string;
	activity_type: LearningActivityRow["activityType"];
	book_id: string;
	test_id: string;
	section: LearningActivityRow["section"];
	parts: LearningActivityRow["parts"];
	completed_at: string;
	total_count: number;
	correct_count: number;
	finished_time: number | null;
	score_data: Record<string, unknown>;
	metadata: Record<string, unknown>;
}

function mapRow(row: ActivityDbRow): LearningActivityRow {
	return {
		id: row.id,
		activityType: row.activity_type,
		bookId: row.book_id,
		testId: row.test_id,
		section: row.section,
		parts: row.parts ?? [],
		completedAt: row.completed_at,
		totalCount: row.total_count,
		correctCount: row.correct_count,
		wrongCount: 0,
		unansweredCount: 0,
		finishedTimeSeconds: row.finished_time,
		scoreData: row.score_data ?? {},
		metadata: row.metadata ?? {},
	};
}

export function readExamScore(
	scoreData: Record<string, unknown>,
): ExamScoreResult | null {
	const totalScaled = scoreData.totalScaled;
	const listening = scoreData.listening;
	const reading = scoreData.reading;

	if (
		typeof totalScaled !== "number" ||
		typeof listening !== "object" ||
		listening == null ||
		typeof reading !== "object" ||
		reading == null
	) {
		return null;
	}

	return scoreData as unknown as ExamScoreResult;
}

export function readPartScores(
	scoreData: Record<string, unknown>,
): ExamPartScoreBreakdown[] {
	const partScores = scoreData.partScores;
	if (!Array.isArray(partScores)) return [];

	return partScores.filter(
		(entry): entry is ExamPartScoreBreakdown =>
			typeof entry === "object" &&
			entry != null &&
			typeof (entry as ExamPartScoreBreakdown).part === "number",
	);
}

export function formatFinishedTime(seconds: number | null): string {
	if (seconds == null || seconds <= 0) return copy.user.noData;

	const minutes = Math.floor(seconds / 60);
	const remainder = seconds % 60;

	if (minutes === 0) {
		return copy.classes.finishedTime.seconds(remainder);
	}

	return copy.classes.finishedTime.minutesSeconds(minutes, remainder);
}

export function buildPartScoresSummary(
	row: LearningActivityRow,
): string | null {
	if (row.activityType === "exam") {
		const score = readExamScore(row.scoreData);
		if (score) {
			return copy.classes.scoreDetail.examSections(
				score.listening.scaled,
				score.reading.scaled,
			);
		}
	}

	const partScores = readPartScores(row.scoreData);
	if (partScores.length > 0) {
		return partScores
			.map((entry) =>
				copy.classes.scoreDetail.partScore(
					entry.part,
					entry.correct,
					entry.total,
				),
			)
			.join(" · ");
	}

	if (row.activityType === "practice" && row.parts.length > 0) {
		const part = partEnumToNumber(row.parts[0]);
		return copy.classes.scoreDetail.partScore(
			part,
			row.correctCount,
			row.totalCount,
		);
	}

	return null;
}

export function buildActivitySummary(row: LearningActivityRow): string {
	if (row.activityType === "exam") {
		const score = readExamScore(row.scoreData);
		if (score) {
			return score.totalScaled.toString();
		}
	}

	if (row.activityType === "practice") {
		const part = row.parts[0] ? partEnumToNumber(row.parts[0]) : null;
		return copy.user.historyPracticeSummary(
			row.correctCount,
			row.totalCount,
			part,
		);
	}

	const vocabScore = row.scoreData as Partial<VocabularyScoreData>;
	const words =
		typeof vocabScore.wordsCompleted === "number"
			? vocabScore.wordsCompleted
			: row.totalCount;

	return copy.user.historyVocabularySummary(words);
}

export function toStudentActivitySummary(
	row: LearningActivityRow,
	displayLookup?: Map<string, CatalogDisplayNames>,
): StudentActivitySummary {
	const examScore =
		row.activityType === "exam" ? readExamScore(row.scoreData) : null;
	const display = displayLookup?.get(catalogDisplayKey(row.bookId, row.testId));

	return {
		id: row.id,
		activityType: row.activityType,
		bookId: row.bookId,
		testId: row.testId,
		bookName: display?.bookName ?? row.bookId,
		testLabel: display?.testLabel ?? row.testId,
		section: row.section,
		parts: row.parts.map(partEnumToNumber),
		completedAt: row.completedAt,
		summary: buildActivitySummary(row),
		totalCount: row.totalCount,
		correctCount: row.correctCount,
		finishedTimeSeconds: row.finishedTimeSeconds,
		listeningScore: examScore?.listening.scaled ?? null,
		readingScore: examScore?.reading.scaled ?? null,
		partScoresSummary: buildPartScoresSummary(row),
		hasAnswerSheet: false,
	};
}

export function readLatestExamScore(
	rows: LearningActivityRow[],
): number | null {
	for (const row of rows) {
		if (row.activityType !== "exam") continue;
		const score = readExamScore(row.scoreData);
		if (score) return score.totalScaled;
	}

	return null;
}

export function countExamsCompleted(rows: LearningActivityRow[]): number {
	return rows.filter((row) => row.activityType === "exam").length;
}

export async function fetchActivityRowsForUser(
	supabase: SupabaseClient<Database>,
	userId: string,
	limit?: number,
): Promise<LearningActivityRow[]> {
	let query = supabase
		.from("learning_activities")
		.select(
			"id, activity_type, book_id, test_id, section, parts, completed_at, total_count, correct_count, finished_time, score_data, metadata",
		)
		.eq("user_id", userId)
		.order("completed_at", { ascending: false });

	if (limit != null) {
		query = query.limit(limit);
	}

	const { data, error } = await query;
	if (error) throw error;

	return ((data ?? []) as ActivityDbRow[]).map(mapRow);
}

export function summarizePracticeAccuracy(
	scoreData: Record<string, unknown>,
): number | null {
	const practice = scoreData as Partial<PracticeScoreData>;
	if (typeof practice.accuracy === "number") {
		return Math.round(practice.accuracy * 100);
	}

	return null;
}
