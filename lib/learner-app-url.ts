/** Public learner app origin, without a trailing slash. */
export function learnerAppUrl(): string | null {
  const value = process.env.NEXT_PUBLIC_LEARNER_APP_URL?.trim().replace(
    /\/$/,
    "",
  );
  return value || null;
}
