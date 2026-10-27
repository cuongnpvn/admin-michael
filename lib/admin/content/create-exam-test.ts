"use server";

import {
  createExamTestInit,
  createExamTestPipelineStep,
  finalizeCreateExamTest,
  rollbackCreateExamTest,
  type CreateExamPipelineStepId,
} from "@/lib/admin/content/create-exam-test-pipeline";

export type CreateExamTestResult =
  | { ok: true; data: { bookId: string; testId: string; redirectPath: string } }
  | { ok: false; error: string };

export {
  createExamTestInit,
  createExamTestPipelineStep,
  finalizeCreateExamTest,
  rollbackCreateExamTest,
  type CreateExamPipelineStepId,
};

const PIPELINE_STEPS: CreateExamPipelineStepId[] = [
  "listeningPart12",
  "listeningPart3",
  "listeningPart4",
  "reading",
];

/** Runs the full pipeline in one request (legacy / fallback). */
export async function createAdminExamTest(
  formData: FormData,
): Promise<CreateExamTestResult> {
  const init = await createExamTestInit(formData);
  if (!init.ok) return init;

  const { bookId, testId, testLabel } = init.data;

  for (const step of PIPELINE_STEPS) {
    const result = await createExamTestPipelineStep(
      step,
      bookId,
      testId,
      testLabel,
      formData,
    );
    if (!result.ok) {
      await rollbackCreateExamTest(bookId, testId);
      return result;
    }
  }

  const finalized = await finalizeCreateExamTest(bookId, testId);
  if (!finalized.ok) {
    await rollbackCreateExamTest(bookId, testId);
    return finalized;
  }

  return {
    ok: true,
    data: {
      bookId,
      testId,
      redirectPath: `/admin/exams?bookId=${encodeURIComponent(bookId)}&testId=${encodeURIComponent(testId)}`,
    },
  };
}
