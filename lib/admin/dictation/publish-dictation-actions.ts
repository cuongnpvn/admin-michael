"use server";

import { revalidatePath } from "next/cache";
import {
  AdminAccessError,
  requireAdminSession,
} from "@/lib/admin/auth/require-admin";
import { dictationAudioLocation } from "@/lib/admin/dictation/load-admin-dictation";
import { copy } from "@/lib/copy/vi";

const PAGE_SIZE = 1000;
const UPDATE_CHUNK = 100;

export type PublishDictationTestResult =
  | { ok: true; status: "published"; count: number }
  | { ok: true; status: "empty" }
  | { ok: true; status: "already" }
  | { ok: false; error: string };

interface ItemRow {
  set_id: string;
  audio_path: string;
  segments: unknown;
}

function accessError(code: string): string {
  if (code === "not_signed_in") return copy.admin.import.errors.notSignedIn;
  if (code === "not_admin") return copy.admin.import.errors.notAdmin;
  return copy.admin.cms.turnAlignment.errors.generic;
}

function likePrefix(bookId: string, testId: string): string {
  const escape = (value: string) => value.replace(/[%_\\]/g, "\\$&");
  return `${escape(bookId)}/${escape(testId)}/%`;
}

function hasSegments(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}

export async function publishDictationTest(
  bookId: string,
  testId: string,
): Promise<PublishDictationTestResult> {
  const book = bookId.trim();
  const test = testId.trim();
  if (!book || !test || book.includes("/") || test.includes("/")) {
    return { ok: false, error: copy.admin.cms.turnAlignment.errors.generic };
  }

  try {
    const { supabase } = await requireAdminSession();
    const items: ItemRow[] = [];

    for (let from = 0; ; from += PAGE_SIZE) {
      const { data, error } = await supabase
        .from("dictation_items")
        .select("set_id, audio_path, segments")
        .like("audio_path", likePrefix(book, test))
        .order("id", { ascending: true })
        .range(from, from + PAGE_SIZE - 1);

      if (error) throw error;
      const page = (data ?? []) as ItemRow[];
      items.push(...page);
      if (page.length < PAGE_SIZE) break;
    }

    const itemsBySet = new Map<string, number>();
    for (const item of items) {
      const location = dictationAudioLocation(item.audio_path);
      if (!location || location.bookId !== book || location.testId !== test) {
        continue;
      }
      if (!hasSegments(item.segments)) continue;
      itemsBySet.set(item.set_id, (itemsBySet.get(item.set_id) ?? 0) + 1);
    }

    const setIds = [...itemsBySet.keys()];
    if (setIds.length === 0) return { ok: true, status: "empty" };

    const draftIds: string[] = [];
    for (let index = 0; index < setIds.length; index += UPDATE_CHUNK) {
      const chunk = setIds.slice(index, index + UPDATE_CHUNK);
      const { data, error } = await supabase
        .from("dictation_sets")
        .select("id, published")
        .in("id", chunk);

      if (error) throw error;
      for (const row of (data ?? []) as Array<{ id: string; published: boolean }>) {
        if (!row.published) draftIds.push(row.id);
      }
    }

    if (draftIds.length === 0) return { ok: true, status: "already" };

    for (let index = 0; index < draftIds.length; index += UPDATE_CHUNK) {
      const chunk = draftIds.slice(index, index + UPDATE_CHUNK);
      const { error } = await supabase
        .from("dictation_sets")
        .update({ published: true })
        .in("id", chunk)
        .eq("published", false);

      if (error) throw error;
    }

    const count = draftIds.reduce(
      (sum, id) => sum + (itemsBySet.get(id) ?? 0),
      0,
    );
    revalidatePath("/dictation");
    return { ok: true, status: "published", count };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    const message = error instanceof Error ? error.message : "";
    return {
      ok: false,
      error: message.trim() || copy.admin.cms.turnAlignment.errors.generic,
    };
  }
}
