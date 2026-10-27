export const STORAGE_LOAD_ATTEMPTS = 3;
export const STORAGE_LOAD_DELAYS_MS = [300, 800] as const;

export function withStorageCacheBust(url: string, attempt: number): string {
  if (attempt <= 0) return url;

  try {
    const parsed = new URL(url);
    parsed.searchParams.set("retry", String(attempt));
    return parsed.toString();
  } catch {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}retry=${attempt}`;
  }
}

export async function retryStorageLoad<T>(
  load: (url: string) => Promise<T>,
  url: string,
  options?: {
    attempts?: number;
    delaysMs?: readonly number[];
  },
): Promise<T> {
  const attempts = options?.attempts ?? STORAGE_LOAD_ATTEMPTS;
  const delaysMs = options?.delaysMs ?? STORAGE_LOAD_DELAYS_MS;

  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await load(withStorageCacheBust(url, attempt));
    } catch (error) {
      lastError = error;
      if (attempt >= attempts - 1) break;
      const delay = delaysMs[attempt] ?? delaysMs[delaysMs.length - 1] ?? 0;
      if (delay > 0) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, delay);
        });
      }
    }
  }

  throw lastError;
}
