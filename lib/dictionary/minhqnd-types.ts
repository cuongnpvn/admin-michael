export type MinhqndPronunciation = {
  ipa: string;
  region: string | null;
};

export type MinhqndMeaning = {
  definition: string;
  definition_lang: string;
  example: string | null;
  pos: string | null;
  sub_pos: string | null;
  source: string;
  links: string[];
};

export type MinhqndLanguageResult = {
  lang_code: string;
  lang_name: string;
  audio: string;
  meanings: MinhqndMeaning[];
  pronunciations: MinhqndPronunciation[];
  translations: unknown[];
  relations: unknown[];
};

export type MinhqndLookupResponse = {
  exists: boolean;
  word: string;
  results: MinhqndLanguageResult[];
};

export type NormalizedDictionaryEntry = {
  word: string;
  pronunciations: string[];
  meanings: Array<{
    pos: string | null;
    definition: string;
    example: string | null;
  }>;
};
