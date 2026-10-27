export function extractActiveTagQuery(
  value: string,
  cursor: number,
): { start: number; query: string } | null {
  const beforeCursor = value.slice(0, cursor);
  const hashIndex = beforeCursor.lastIndexOf("#");

  if (hashIndex === -1) {
    return null;
  }

  const charBeforeHash = beforeCursor[hashIndex - 1];
  if (charBeforeHash && !/\s/u.test(charBeforeHash)) {
    return null;
  }

  const query = beforeCursor.slice(hashIndex + 1);
  if (/\s/u.test(query)) {
    return null;
  }

  return { start: hashIndex, query };
}
