/** Standard TOEIC Listening & Reading section size. */
export const TOEIC_SECTION_QUESTION_COUNT = 100;

export type ToeicExamSection = "listening" | "reading";

/**
 * Listening raw-correct → scaled score.
 * Source: luyenthi-toeic.com "Thang điểm Listening" reference table.
 * Index = number of correct answers (0–100); partial exams use the same lookup.
 */
export const TOEIC_LISTENING_SCALED_BY_CORRECT: readonly number[] = [
	// 0–25
	5, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100,
	105, 110, 115, 120, 125, 130, 135,
	// 26–50
	140, 145, 150, 155, 160, 165, 170, 175, 180, 185, 190, 195, 200, 205, 210,
	215, 220, 225, 230, 235, 240, 245, 250, 255, 260,
	// 51–75
	265, 270, 275, 280, 285, 290, 295, 300, 305, 310, 315, 320, 325, 330, 335,
	340, 345, 350, 355, 360, 365, 370, 375, 380, 385,
	// 76–100
	395, 400, 405, 410, 415, 420, 425, 430, 435, 440, 445, 450, 455, 460, 465,
	470, 475, 480, 485, 490, 495, 495, 495, 495, 495,
];

/**
 * Reading raw-correct → scaled score.
 * Source: reference "THANG ĐIỂM READING" table (matches luyenthi-toeic.com).
 * Index = number of correct answers (0–100); partial exams use the same lookup.
 *
 * 0–2 → 5 | 3–100 → +5 each
 */
export const TOEIC_READING_SCALED_BY_CORRECT: readonly number[] = [
	// 0–2
	5, 5, 5,
	// 3–27
	10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100,
	105, 110, 115, 120, 125, 130,
	// 28–52
	135, 140, 145, 150, 155, 160, 165, 170, 175, 180, 185, 190, 195, 200, 205,
	210, 215, 220, 225, 230, 235, 240, 245, 250, 255,
	// 53–77
	260, 265, 270, 275, 280, 285, 290, 295, 300, 305, 310, 315, 320, 325, 330,
	335, 340, 345, 350, 355, 360, 365, 370, 375, 380,
	// 78–100
	385, 390, 395, 400, 405, 410, 415, 420, 425, 430, 435, 440, 445, 450, 455,
	460, 465, 470, 475, 480, 485, 490, 495,
];

const TABLE_BY_SECTION: Record<ToeicExamSection, readonly number[]> = {
	listening: TOEIC_LISTENING_SCALED_BY_CORRECT,
	reading: TOEIC_READING_SCALED_BY_CORRECT,
};

/** Look up scaled score from the number of correct answers (5–495). */
export function scaleToToeicScore(
	correct: number,
	total: number,
	section: ToeicExamSection,
): number {
	if (total <= 0) return 0;
	if (!Number.isFinite(correct)) return TABLE_BY_SECTION[section][0] ?? 5;
	const index = Math.max(
		0,
		Math.min(TOEIC_SECTION_QUESTION_COUNT, Math.round(correct)),
	);
	return TABLE_BY_SECTION[section][index] ?? 5;
}
