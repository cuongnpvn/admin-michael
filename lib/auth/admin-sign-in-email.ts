const ADMIN_EMAIL_DOMAIN = "michael.local";

/** Map a bare username such as admin1101 to the seeded mailbox. */
export function resolveAdminSignInEmail(value: string): string {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || trimmed.includes("@")) return trimmed;
  return `${trimmed}@${ADMIN_EMAIL_DOMAIN}`;
}
