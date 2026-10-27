import { loadAdminCatalog } from "@/lib/admin/load-admin-catalog";
import { requireAdminSession } from "@/lib/admin/auth/require-admin";
import type {
  EntitlementBookGroup,
  UniversalFreeExplanationSlot,
} from "@/lib/admin/subscriptions/types";

type QuestionSlotRow = {
  part: string;
  global_item_number: number | null;
  free_explanation: boolean | null;
};

type AggregateBucket = {
  part: number;
  slotKey: number;
  enabled: number;
  total: number;
};

export async function fetchAdminEntitlementBooks(): Promise<
  EntitlementBookGroup[]
> {
  const catalog = await loadAdminCatalog();
  return catalog.books.map((book) => ({
    bookId: book.id,
    bookName: book.name,
    tests: book.tests.map((test) => ({
      testId: test.id,
      testLabel: test.label,
      accessTier: test.accessTier === "pro" ? "pro" : "free",
    })),
  }));
}

export async function fetchUniversalFreeExplanationSlots(): Promise<
  UniversalFreeExplanationSlot[]
> {
  const { supabase } = await requireAdminSession();

  const { data, error } = await supabase
    .from("questions")
    .select("part, global_item_number, free_explanation")
    .in("part", ["1", "2", "3", "4", "5", "6", "7"]);

  if (error) throw error;

  const buckets = new Map<string, AggregateBucket>();

  for (const row of (data ?? []) as QuestionSlotRow[]) {
    const part = Number(row.part);
    const slotKey = Number(row.global_item_number);
    if (!Number.isFinite(part) || !Number.isFinite(slotKey)) continue;

    const key = `${part}:${slotKey}`;
    const existing = buckets.get(key);
    if (!existing) {
      buckets.set(key, {
        part,
        slotKey,
        enabled: row.free_explanation ? 1 : 0,
        total: 1,
      });
      continue;
    }
    existing.enabled += row.free_explanation ? 1 : 0;
    existing.total += 1;
  }

  return [...buckets.values()]
    .map((bucket) => ({
      part: bucket.part,
      slotKey: bucket.slotKey,
      label: `Q${bucket.slotKey}`,
      freeExplanation: bucket.enabled === bucket.total && bucket.total > 0,
      rowCount: bucket.total,
    }))
    .sort((a, b) => {
      if (a.part !== b.part) return a.part - b.part;
      return a.slotKey - b.slotKey;
    });
}
