export function vocabularyDeckPath(
  deckId: string,
  options?: { selectDue?: boolean },
): string {
  const path = `/vocab/${deckId}`;
  if (!options?.selectDue) return path;
  return `${path}?selectDue=1`;
}

export function vocabularyPracticePath(deckId: string, count?: number): string {
  const path = `/vocab/${deckId}/practice`;
  if (count == null) return path;

  const params = new URLSearchParams({ count: String(count) });
  return `${path}?${params.toString()}`;
}

export function adminVocabPath(): string {
  return "/admin/vocab";
}

export function adminVocabDeckPath(deckId: string): string {
  return `/admin/vocab/${deckId}`;
}
