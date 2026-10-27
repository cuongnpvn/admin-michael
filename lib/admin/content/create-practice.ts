"use server";

import { adminSectionTestPath } from "@/lib/admin/admin-paths";
import { requireAdminSession, AdminAccessError } from "@/lib/admin/auth/require-admin";
import { COMMON_BOOK_ID } from "@/lib/content/catalog-ids";
import { listeningParts, readingParts } from "@/lib/mock";
import type { PublishSection } from "@/lib/content/publish-test";

export interface CreatePracticeInput {
  section: PublishSection;
  label: string;
  slug?: string;
}

function accessError(code: string): string {
  return code;
}

function defaultSlug(): string {
  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  return `practice-${id}`;
}

export async function createAdminPracticeEntry(
  input: CreatePracticeInput,
): Promise<
  | { ok: true; data: { bookId: string; testId: string; redirectPath: string } }
  | { ok: false; error: string }
> {
  try {
    const { supabase } = await requireAdminSession();
    const testId = (input.slug?.trim() || defaultSlug()).replace(/\s+/g, "-");
    const label = input.label.trim();

    if (!label) {
      return { ok: false, error: "Label is required" };
    }

    const { data: existing } = await supabase
      .from("tests")
      .select("id")
      .eq("book_id", COMMON_BOOK_ID)
      .eq("id", testId)
      .maybeSingle();

    if (existing) {
      return { ok: false, error: `Practice id already exists: ${testId}` };
    }

    const { data: maxSortRow } = await supabase
      .from("tests")
      .select("sort_order")
      .eq("book_id", COMMON_BOOK_ID)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const sortOrder = ((maxSortRow?.sort_order as number | undefined) ?? 0) + 1;

    const { error: testError } = await supabase.from("tests").insert({
      book_id: COMMON_BOOK_ID,
      id: testId,
      label,
      sort_order: sortOrder,
      published: false,
      listening_published: false,
      reading_published: false,
      access_tier: "free",
    });

    if (testError) throw testError;

    const parts =
      input.section === "listening" ? listeningParts : readingParts;

    const rows = parts.map((part) => ({
      book_id: COMMON_BOOK_ID,
      test_id: testId,
      part: String(part.part),
      title: part.title,
      question_count_target: part.questionCount,
      sort_order: part.part,
    }));

    const { error: partsError } = await supabase.from("test_parts").insert(rows);
    if (partsError) throw partsError;

    const redirectPath = adminSectionTestPath(
      input.section,
      COMMON_BOOK_ID,
      testId,
    );


    return {
      ok: true,
      data: { bookId: COMMON_BOOK_ID, testId, redirectPath },
    };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : accessError("generic"),
    };
  }
}
