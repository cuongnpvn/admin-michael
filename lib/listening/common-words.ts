import { isNonTranscriptToken } from "@/lib/listening/non-transcript-text";

/**
 * High-frequency function words for TOEIC-style answer cloze.
 * Prefer keeping these visible; may still be hidden to meet the visibility % quota.
 */
const COMMON_WORDS_LIST = [
  // pronouns
  "i",
  "me",
  "my",
  "mine",
  "myself",
  "you",
  "your",
  "yours",
  "yourself",
  "yourselves",
  "he",
  "him",
  "his",
  "himself",
  "she",
  "her",
  "hers",
  "herself",
  "it",
  "its",
  "itself",
  "we",
  "us",
  "our",
  "ours",
  "ourselves",
  "they",
  "them",
  "their",
  "theirs",
  "themselves",
  "one",
  "ones",
  "someone",
  "anyone",
  "everyone",
  "nobody",
  "somebody",
  "anybody",
  "everybody",
  "something",
  "anything",
  "everything",
  "nothing",
  "who",
  "whom",
  "whose",
  "which",
  "what",
  "that",
  "this",
  "these",
  "those",
  "there",
  "here",

  // articles & determiners
  "a",
  "an",
  "the",
  "some",
  "any",
  "no",
  "every",
  "each",
  "all",
  "both",
  "few",
  "fewer",
  "fewest",
  "many",
  "more",
  "most",
  "much",
  "less",
  "least",
  "several",
  "such",
  "same",
  "other",
  "another",
  "own",
  "enough",
  "either",
  "neither",
  "half",
  "double",
  "twice",

  // be / have / do
  "am",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "having",
  "do",
  "does",
  "did",
  "doing",
  "done",

  // modals & auxiliaries
  "can",
  "cannot",
  "can't",
  "could",
  "couldn't",
  "will",
  "won't",
  "would",
  "wouldn't",
  "shall",
  "should",
  "shouldn't",
  "may",
  "might",
  "must",
  "mustn't",
  "ought",
  "need",
  "dare",
  "used",

  // contractions (spoken answers)
  "i'm",
  "you're",
  "we're",
  "they're",
  "he's",
  "she's",
  "it's",
  "that's",
  "there's",
  "here's",
  "what's",
  "who's",
  "where's",
  "when's",
  "how's",
  "isn't",
  "aren't",
  "wasn't",
  "weren't",
  "don't",
  "doesn't",
  "didn't",
  "haven't",
  "hasn't",
  "hadn't",
  "i've",
  "you've",
  "we've",
  "they've",
  "i'd",
  "you'd",
  "he'd",
  "she'd",
  "it'd",
  "we'd",
  "they'd",
  "i'll",
  "you'll",
  "he'll",
  "she'll",
  "it'll",
  "we'll",
  "they'll",
  "let's",
  "ain't",

  // prepositions
  "in",
  "on",
  "at",
  "by",
  "for",
  "with",
  "about",
  "against",
  "among",
  "between",
  "into",
  "through",
  "during",
  "before",
  "after",
  "above",
  "below",
  "beneath",
  "beside",
  "besides",
  "beyond",
  "within",
  "without",
  "toward",
  "towards",
  "upon",
  "under",
  "over",
  "off",
  "out",
  "up",
  "down",
  "from",
  "to",
  "of",
  "near",
  "past",
  "per",
  "via",
  "like",
  "unlike",
  "except",
  "plus",
  "minus",
  "across",
  "along",
  "around",
  "behind",
  "inside",
  "outside",
  "onto",
  "upon",
  "until",
  "till",
  "since",
  "throughout",
  "underneath",
  "amid",
  "amidst",

  // conjunctions & subordinators
  "and",
  "or",
  "nor",
  "but",
  "so",
  "yet",
  "both",
  "either",
  "neither",
  "not",
  "because",
  "if",
  "when",
  "while",
  "although",
  "though",
  "unless",
  "until",
  "whereas",
  "whether",
  "once",
  "since",
  "as",
  "than",
  "how",
  "why",
  "where",
  "whenever",
  "wherever",
  "however",
  "moreover",
  "furthermore",
  "therefore",
  "thus",
  "hence",
  "otherwise",
  "instead",
  "besides",
  "meanwhile",
  "afterward",
  "afterwards",
  "then",

  // common adverbs / discourse
  "very",
  "too",
  "also",
  "just",
  "only",
  "even",
  "still",
  "already",
  "always",
  "never",
  "often",
  "sometimes",
  "usually",
  "seldom",
  "rarely",
  "quite",
  "rather",
  "almost",
  "nearly",
  "hardly",
  "barely",
  "scarcely",
  "perhaps",
  "maybe",
  "probably",
  "possibly",
  "certainly",
  "surely",
  "really",
  "actually",
  "especially",
  "particularly",
  "generally",
  "typically",
  "usually",
  "commonly",
  "simply",
  "merely",
  "mostly",
  "mainly",
  "largely",
  "partly",
  "fully",
  "completely",
  "totally",
  "entirely",
  "absolutely",
  "exactly",
  "approximately",
  "roughly",
  "about",
  "around",
  "again",
  "once",
  "twice",
  "soon",
  "later",
  "earlier",
  "now",
  "today",
  "tomorrow",
  "yesterday",
  "tonight",
  "away",
  "back",
  "together",
  "apart",
  "ahead",
  "behind",
  "forward",
  "backward",
  "upstairs",
  "downstairs",
  "indoors",
  "outdoors",
  "abroad",
  "home",
  "elsewhere",
  "everywhere",
  "anywhere",
  "somewhere",
  "nowhere",

  // negation & comparison
  "no",
  "not",
  "nor",
  "n't",
  "non",
  "vs",
  "versus",

  // polite / filler (sometimes in audio scripts)
  "please",
  "thanks",
  "thank",
  "yes",
  "no",
  "ok",
  "okay",
  "well",
  "oh",
  "ah",
  "um",
  "uh",
  "hmm",
  "hi",
  "hello",
  "hey",
  "dear",
  "sir",
  "madam",
  "mr",
  "mrs",
  "ms",
  "dr",

  // numbers as words (dates in answers)
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
  "hundred",
  "thousand",
  "million",
  "first",
  "second",
  "third",
  "fourth",
  "fifth",
  "last",
  "next",
  "previous",
] as const;

export const COMMON_WORDS = new Set<string>(COMMON_WORDS_LIST);

/** Tokens that count toward the visibility % (letters or digits). */
export function isWordToken(token: string): boolean {
  return /\S/u.test(token) && /[a-zA-Z0-9]/u.test(token);
}

/**
 * Conversation turn markers (Part 3 transcripts). Never cloze-mask these.
 * e.g. W:, M:, N:, Woman:, Man:, Speaker 1:, A:
 */
export function isConversationSpeakerLabel(token: string): boolean {
  const trimmed = token.trim();
  if (/^[WMNAB]:$/iu.test(trimmed)) return true;
  if (/^(?:woman|man|narrator):$/iu.test(trimmed)) return true;
  if (/^speaker\s*\d+:$/iu.test(trimmed)) return true;
  return false;
}

/** Word tokens eligible for cloze masking (excludes non-spoken markup). */
export function isClozeEligibleToken(token: string): boolean {
  return isWordToken(token) && !isNonTranscriptToken(token);
}

/** Strip leading/trailing punctuation; lowercase for lookup. */
export function normalizeAnswerToken(token: string): string | null {
  const core = token
    .replace(/^[^a-zA-Z0-9']+/u, "")
    .replace(/[^a-zA-Z0-9']+$/u, "")
    .toLowerCase();

  if (!core) return null;
  return core;
}

export function isCommonWord(token: string): boolean {
  const word = normalizeAnswerToken(token);
  if (!word) return true;
  if (COMMON_WORDS.has(word)) return true;

  // "'s" / "'re" style split tokens (e.g. "document." only — rare)
  const apostrophe = word.match(/^(.+?)('(?:s|re|ve|ll|d|m|t))$/);
  if (apostrophe) {
    const base = apostrophe[1];
    const suffix = apostrophe[2];
    if (COMMON_WORDS.has(base) && COMMON_WORDS.has(base + suffix)) {
      return true;
    }
    if (COMMON_WORDS.has(base)) {
      return true;
    }
  }

  return false;
}

/** Content-bearing words (not in the common list). */
export function isHideableWord(token: string): boolean {
  if (!isWordToken(token)) return false;
  if (isNonTranscriptToken(token)) return false;

  const word = normalizeAnswerToken(token);
  if (!word) return false;
  if (isCommonWord(token)) return false;

  // Pure punctuation attached to nothing useful
  if (!/[a-z]/iu.test(word) && !/\d/u.test(word)) return false;

  return true;
}

/**
 * Higher score = more informative → prefer hiding at low visibility %.
 */
export function hidePriority(token: string): number {
  const word = normalizeAnswerToken(token) ?? "";
  let score = word.length;
  if (/\d/u.test(word)) score += 2;
  if (word.length >= 8) score += 2;
  if (word.length >= 12) score += 2;
  return score;
}
