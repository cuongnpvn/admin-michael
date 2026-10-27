export type TranslationProvider = "gemini" | "deepseek";

export function requireTranslationProvider(): TranslationProvider {
  const provider = process.env.TRANSLATION_PROVIDER?.trim().toLowerCase();
  if (provider === "gemini" || provider === "deepseek") {
    return provider;
  }
  throw new Error("TRANSLATION_PROVIDER must be gemini or deepseek.");
}

export function requireTranslationAiModel(): string {
  const model = process.env.TRANSLATION_AI_MODEL?.trim();
  if (!model) {
    throw new Error("TRANSLATION_AI_MODEL is not configured.");
  }
  return model;
}

export function requireGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return key;
}

export function requireDeepseekApiKey(): string {
  const key = process.env.DEEPSEEK_API_KEY?.trim();
  if (!key) {
    throw new Error("DEEPSEEK_API_KEY is not configured.");
  }
  return key;
}
