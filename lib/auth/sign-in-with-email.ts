"use server";

import { resolveAdminSignInEmail } from "@/lib/auth/admin-sign-in-email";
import { createClient } from "@/lib/supabase/server";

const SEEDED_ADMIN_EMAIL = "admin1101@michael.local";
const SEEDED_ADMIN_PASSWORD = "1101";
/** Supabase Auth rejects passwords shorter than 6 characters. */
const SEEDED_AUTH_PASSWORD = "1101Aa";

export async function signInWithEmail(emailInput: string, password: string) {
  const email = resolveAdminSignInEmail(emailInput);
  const authPassword =
    email === SEEDED_ADMIN_EMAIL && password === SEEDED_ADMIN_PASSWORD
      ? SEEDED_AUTH_PASSWORD
      : password;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: authPassword,
  });

  return { ok: !error };
}
