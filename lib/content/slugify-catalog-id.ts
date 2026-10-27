/** Slug for catalog ids: "TEST 1" → "test-1", "ETS 2026" → "ets-2026" */
export function slugifyCatalogId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
