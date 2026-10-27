import type { SupabaseClient } from "@supabase/supabase-js";
import {
  validateExamTestForPublish,
  type ExamTestValidationResult,
} from "@/lib/content/validate-exam-test";

export type { PublishSection } from "@/lib/content/validate-section-counts";

export class PublishValidationError extends Error {
  readonly validation: ExamTestValidationResult;

  constructor(validation: ExamTestValidationResult) {
    const summary =
      validation.issues[0]?.message ??
      "Exam test validation failed before publish.";
    super(summary);
    this.name = "PublishValidationError";
    this.validation = validation;
  }
}

interface PublishTestOptions {
  bookId: string;
  testId: string;
}

export async function validateExamTest(
  supabase: SupabaseClient,
  options: PublishTestOptions,
): Promise<ExamTestValidationResult> {
  return validateExamTestForPublish(supabase, options.bookId, options.testId);
}

/** Publish a full exam test after TOEIC validation checks pass. */
export async function publishTest(
  supabase: SupabaseClient,
  options: PublishTestOptions,
): Promise<{ publishedAt: string }> {
  const validation = await validateExamTestForPublish(
    supabase,
    options.bookId,
    options.testId,
  );

  if (!validation.valid) {
    throw new PublishValidationError(validation);
  }

  const publishedAt = new Date().toISOString();
  const { error: testError } = await supabase
    .from("tests")
    .update({
      published: true,
      published_at: publishedAt,
      listening_published: true,
      listening_published_at: publishedAt,
      reading_published: true,
      reading_published_at: publishedAt,
    })
    .eq("book_id", options.bookId)
    .eq("id", options.testId);

  if (testError) throw testError;
  return { publishedAt };
}

export async function unpublishTest(
  supabase: SupabaseClient,
  options: PublishTestOptions,
): Promise<void> {
  const { error: testError } = await supabase
    .from("tests")
    .update({
      published: false,
      published_at: null,
      listening_published: false,
      listening_published_at: null,
      reading_published: false,
      reading_published_at: null,
    })
    .eq("book_id", options.bookId)
    .eq("id", options.testId);

  if (testError) throw testError;
}
