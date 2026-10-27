/** Canonical app origin — no trailing slash. */
export function getAppUrl(fallbackOrigin?: string): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") return window.location.origin;
  return fallbackOrigin?.replace(/\/$/, "") ?? "";
}
