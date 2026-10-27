import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

const LOOKUP_PROMPT_PATH = path.join(
  process.cwd(),
  "content",
  "dictionary",
  "lookup-word.md",
);

type LoadedPrompt = {
  prompt: string;
  version: string;
};

let cached: LoadedPrompt | null = null;

async function loadPromptCache(): Promise<LoadedPrompt> {
  if (cached) return cached;

  const prompt = await readFile(LOOKUP_PROMPT_PATH, "utf8");
  cached = {
    prompt,
    version: createHash("sha256").update(prompt).digest("hex").slice(0, 16),
  };
  return cached;
}

export async function loadDictionaryLookupPrompt(): Promise<string> {
  return (await loadPromptCache()).prompt;
}

export async function getDictionaryLookupPromptVersion(): Promise<string> {
  return (await loadPromptCache()).version;
}
