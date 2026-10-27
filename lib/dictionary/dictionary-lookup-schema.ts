import { z } from "zod";
import { VOCABULARY_CEFR_LEVELS } from "@/lib/vocabulary/cefr-level";

/** Zod schema for Tra cứu AI structured output (DeepSeek generateObject / shared). */
export const dictionaryLookupZodSchema = z.object({
  term: z.string(),
  lemma: z.string(),
  meaningVi: z.string(),
  definitionEn: z.string(),
  ipaUs: z.string(),
  ipaUk: z.string(),
  wordTypes: z.array(z.string()),
  synonyms: z.array(z.string()),
  collocations: z.array(z.string()),
  example: z.string(),
  level: z.union([z.enum(VOCABULARY_CEFR_LEVELS), z.literal("")]).optional(),
});

export type DictionaryLookupZod = z.infer<typeof dictionaryLookupZodSchema>;
