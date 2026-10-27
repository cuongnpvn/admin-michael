export interface VocabularyDeckSummary {
  id: string;
  name: string;
  published: boolean;
  wordCount: number;
  createdAt: string;
}

export interface ImportVocabularyJsonSummary {
  deckId: string;
  deckName: string;
  wordCount: number;
}
