export function wrapExampleQuotes(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("“") && trimmed.endsWith("”"))
  ) {
    return trimmed;
  }

  return `"${trimmed}"`;
}
