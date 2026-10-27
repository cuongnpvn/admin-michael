/** Soft cap for owner deck re-generate until subscription tiers land. Admin re-generate is unlimited. */
export const MAX_VOCABULARY_DECK_REGENERATE_TERMS = 50;

export function limitVocabularyDeckRegenerateTerms(terms: string[]): string[] {
  return terms.slice(0, MAX_VOCABULARY_DECK_REGENERATE_TERMS);
}
