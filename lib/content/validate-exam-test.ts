import type { SupabaseClient } from "@supabase/supabase-js";
import { enforceOfficialQuestionNumberQa } from "@/lib/content/catalog-ids";
import {
  buildPublicAssetUrlForBucket,
  normalizeMediaStorageInput,
} from "@/lib/content/media-storage-paths";
import { TOEIC_PART_QUESTION_COUNTS } from "@/lib/content/toeic-global-item-number";
import { copy } from "@/lib/copy/vi";

export const TOEIC_EXAM_TOTAL_QUESTIONS = 200;
export const TOEIC_SECTION_TOTAL_QUESTIONS = 100;

/** Standard TOEIC Part 6: 4 text-completion passages × 4 questions. */
export const TOEIC_PART6_PASSAGE_SET_COUNT = 4;
export const TOEIC_PART6_QUESTIONS_PER_SET = 4;

/** Standard TOEIC Part 7: 2–5 questions per passage set, up to 3 passages per set. */
export const TOEIC_PART7_MIN_QUESTIONS_PER_SET = 2;
export const TOEIC_PART7_MAX_QUESTIONS_PER_SET = 5;
export const TOEIC_PART7_MAX_PASSAGES_PER_SET = 3;

export interface ExamTestValidationIssue {
  code: string;
  message: string;
}

export interface ExamTestValidationResult {
  valid: boolean;
  issues: ExamTestValidationIssue[];
}

function issue(code: string, message: string): ExamTestValidationIssue {
  return { code, message };
}

function isValidImageAssetUrl(
  storageBucket: string,
  storagePath: string,
): boolean {
  const normalized = normalizeMediaStorageInput(storagePath, "image");
  if (!normalized) return false;
  return Boolean(
    buildPublicAssetUrlForBucket(
      normalized.storageBucket ?? storageBucket,
      normalized.storagePath,
    ),
  );
}

async function validateQuestionCounts(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  issues: ExamTestValidationIssue[],
): Promise<number> {
  const validationCopy = copy.admin.exams.validation;
  if (!enforceOfficialQuestionNumberQa(bookId)) return 0;

  let totalQuestions = 0;

  for (const [partKey, expectedCount] of Object.entries(TOEIC_PART_QUESTION_COUNTS)) {
    const part = partKey;
    const { count, error } = await supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("book_id", bookId)
      .eq("test_id", testId)
      .eq("part", part);

    if (error) throw error;

    const actualCount = count ?? 0;
    totalQuestions += actualCount;

    if (actualCount !== expectedCount) {
      issues.push(
        issue(
          `part_${part}_count`,
          validationCopy.partCount(Number(part), actualCount, expectedCount),
        ),
      );
    }
  }

  if (totalQuestions !== TOEIC_EXAM_TOTAL_QUESTIONS) {
    issues.push(
      issue(
        "total_questions",
        validationCopy.totalQuestions(totalQuestions, TOEIC_EXAM_TOTAL_QUESTIONS),
      ),
    );
  }

  return totalQuestions;
}

async function validatePart1Images(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  issues: ExamTestValidationIssue[],
): Promise<void> {
  const validationCopy = copy.admin.exams.validation;
  const expectedCount = TOEIC_PART_QUESTION_COUNTS[1];

  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select("id, global_item_number")
    .eq("book_id", bookId)
    .eq("test_id", testId)
    .eq("part", "1")
    .order("global_item_number", { ascending: true });

  if (questionsError) throw questionsError;

  const rows = questions ?? [];
  if (
    enforceOfficialQuestionNumberQa(bookId) &&
    rows.length !== expectedCount
  ) {
    return;
  }

  const questionIds = rows.map((row) => String(row.id));
  const { data: part1Items, error: part1Error } = await supabase
    .from("listening_part1_items")
    .select("question_id, image_asset_id")
    .in("question_id", questionIds);

  if (part1Error) throw part1Error;

  const itemByQuestionId = new Map(
    (part1Items ?? []).map((row) => [String(row.question_id), row]),
  );

  const assetIds = (part1Items ?? [])
    .map((row) => row.image_asset_id)
    .filter((id): id is string => Boolean(id));

  const assetById = new Map<string, { storage_bucket: string; storage_path: string }>();
  if (assetIds.length > 0) {
    const { data: assets, error: assetsError } = await supabase
      .from("media_assets")
      .select("id, storage_bucket, storage_path")
      .in("id", assetIds);

    if (assetsError) throw assetsError;

    for (const asset of assets ?? []) {
      assetById.set(String(asset.id), {
        storage_bucket: String(asset.storage_bucket),
        storage_path: String(asset.storage_path),
      });
    }
  }

  for (const question of rows) {
    const globalItemNumber = Number(question.global_item_number);
    const part1Item = itemByQuestionId.get(String(question.id));

    if (!part1Item?.image_asset_id) {
      issues.push(
        issue(
          `part1_image_missing_${globalItemNumber}`,
          validationCopy.part1ImageMissing(globalItemNumber),
        ),
      );
      continue;
    }

    const asset = assetById.get(String(part1Item.image_asset_id));
    if (!asset?.storage_path) {
      issues.push(
        issue(
          `part1_image_missing_${globalItemNumber}`,
          validationCopy.part1ImageMissing(globalItemNumber),
        ),
      );
      continue;
    }

    if (!isValidImageAssetUrl(asset.storage_bucket, asset.storage_path)) {
      issues.push(
        issue(
          `part1_image_invalid_${globalItemNumber}`,
          validationCopy.part1ImageInvalidUrl(globalItemNumber, asset.storage_path),
        ),
      );
    }
  }
}

async function validateReadingPassageSets(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  issues: ExamTestValidationIssue[],
): Promise<void> {
  const validationCopy = copy.admin.exams.validation;
  const relaxQuestionNumberQa = !enforceOfficialQuestionNumberQa(bookId);

  for (const part of [6, 7] as const) {
    const partDb = String(part);
    const expectedQuestionCount = TOEIC_PART_QUESTION_COUNTS[part];

    const { data: sets, error: setsError } = await supabase
      .from("reading_passage_sets")
      .select("id, sort_order")
      .eq("book_id", bookId)
      .eq("test_id", testId)
      .eq("part", partDb)
      .order("sort_order", { ascending: true });

    if (setsError) throw setsError;

    const passageSets = sets ?? [];

    if (
      !relaxQuestionNumberQa &&
      part === 6 &&
      passageSets.length !== TOEIC_PART6_PASSAGE_SET_COUNT
    ) {
      issues.push(
        issue(
          "part6_set_count",
          validationCopy.part6SetCount(
            passageSets.length,
            TOEIC_PART6_PASSAGE_SET_COUNT,
          ),
        ),
      );
    }

    const setIds = passageSets.map((set) => String(set.id));
    const passagesBySet = new Map<string, number>();
    const questionsBySet = new Map<string, number>();

    if (setIds.length > 0) {
      const { data: passages, error: passagesError } = await supabase
        .from("reading_passages")
        .select("passage_set_id")
        .in("passage_set_id", setIds);

      if (passagesError) throw passagesError;

      for (const passage of passages ?? []) {
        const setId = String(passage.passage_set_id);
        passagesBySet.set(setId, (passagesBySet.get(setId) ?? 0) + 1);
      }

      const { data: questions, error: questionsError } = await supabase
        .from("questions")
        .select("reading_passage_set_id")
        .eq("book_id", bookId)
        .eq("test_id", testId)
        .eq("part", partDb);

      if (questionsError) throw questionsError;

      for (const question of questions ?? []) {
        const setId = question.reading_passage_set_id
          ? String(question.reading_passage_set_id)
          : null;
        if (!setId) continue;
        questionsBySet.set(setId, (questionsBySet.get(setId) ?? 0) + 1);
      }

      const { count: orphanCount, error: orphanError } = await supabase
        .from("questions")
        .select("id", { count: "exact", head: true })
        .eq("book_id", bookId)
        .eq("test_id", testId)
        .eq("part", partDb)
        .is("reading_passage_set_id", null);

      if (orphanError) throw orphanError;

      if ((orphanCount ?? 0) > 0) {
        issues.push(
          issue(
            `part${part}_orphan_questions`,
            validationCopy.partOrphanQuestions(part, orphanCount ?? 0),
          ),
        );
      }
    }

    let groupedQuestionCount = 0;

    passageSets.forEach((set, index) => {
      const setId = String(set.id);
      const setLabel = index + 1;
      const passageCount = passagesBySet.get(setId) ?? 0;
      const questionCount = questionsBySet.get(setId) ?? 0;
      groupedQuestionCount += questionCount;

      if (passageCount < 1) {
        issues.push(
          issue(
            `part${part}_set_${setLabel}_missing_passage`,
            validationCopy.partMissingPassage(part, setLabel),
          ),
        );
      }

      if (passageCount > TOEIC_PART7_MAX_PASSAGES_PER_SET) {
        issues.push(
          issue(
            `part${part}_set_${setLabel}_passage_count`,
            validationCopy.partPassageCount(
              part,
              setLabel,
              passageCount,
              TOEIC_PART7_MAX_PASSAGES_PER_SET,
            ),
          ),
        );
      }

      if (part === 6) {
        if (
          !relaxQuestionNumberQa &&
          questionCount !== TOEIC_PART6_QUESTIONS_PER_SET
        ) {
          issues.push(
            issue(
              `part6_set_${setLabel}_question_count`,
              validationCopy.part6QuestionsPerSet(
                setLabel,
                questionCount,
                TOEIC_PART6_QUESTIONS_PER_SET,
              ),
            ),
          );
        }
        return;
      }

      if (
        !relaxQuestionNumberQa &&
        (questionCount < TOEIC_PART7_MIN_QUESTIONS_PER_SET ||
          questionCount > TOEIC_PART7_MAX_QUESTIONS_PER_SET)
      ) {
        issues.push(
          issue(
            `part7_set_${setLabel}_question_count`,
            validationCopy.part7QuestionsPerSet(
              setLabel,
              questionCount,
              TOEIC_PART7_MIN_QUESTIONS_PER_SET,
              TOEIC_PART7_MAX_QUESTIONS_PER_SET,
            ),
          ),
        );
      }
    });

    if (
      !relaxQuestionNumberQa &&
      groupedQuestionCount !== expectedQuestionCount &&
      passageSets.length > 0
    ) {
      issues.push(
        issue(
          `part${part}_grouped_question_count`,
          validationCopy.partGroupedQuestionCount(
            part,
            groupedQuestionCount,
            expectedQuestionCount,
          ),
        ),
      );
    }
  }
}

export async function validateExamTestForPublish(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
): Promise<ExamTestValidationResult> {
  const issues: ExamTestValidationIssue[] = [];

  await validateQuestionCounts(supabase, bookId, testId, issues);
  await validatePart1Images(supabase, bookId, testId, issues);
  await validateReadingPassageSets(supabase, bookId, testId, issues);

  return {
    valid: issues.length === 0,
    issues,
  };
}
