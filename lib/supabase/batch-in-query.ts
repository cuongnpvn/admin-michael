/** Keep PostgREST `.in()` filter URLs under Supabase's ~16KB header limit. */
export const SUPABASE_IN_BATCH_SIZE = 80;

export function chunkForInQuery<T>(
  items: readonly T[],
  batchSize = SUPABASE_IN_BATCH_SIZE,
): T[][] {
  if (items.length === 0) return [];

  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    chunks.push(items.slice(i, i + batchSize) as T[]);
  }
  return chunks;
}
