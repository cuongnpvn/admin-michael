/** Marker appended in extraction prompts to reduce Gemini RECITATION blocks. */
const ANTI_RECITATION_MARKER = /\s*MICHAELTOEIC\b/gi;

/**
 * Removes the literal `MICHAELTOEIC` anti-recitation marker from a string,
 * including surrounding whitespace introduced by the append rule.
 */
export function stripAntiRecitationMarkerFromText(text: string): string {
  return text
    .replace(ANTI_RECITATION_MARKER, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n");
}

/**
 * Walks parsed Gemini JSON and strips `MICHAELTOEIC` from every string value.
 * Mutates objects/arrays in place and returns the same root reference.
 */
export function stripGeminiAntiRecitationMarker<T>(value: T): T {
  if (typeof value === "string") {
    return stripAntiRecitationMarkerFromText(value) as T;
  }

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      value[index] = stripGeminiAntiRecitationMarker(value[index]);
    }
    return value;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      record[key] = stripGeminiAntiRecitationMarker(record[key]);
    }
    return value;
  }

  return value;
}
