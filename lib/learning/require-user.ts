import { createClient } from "@/lib/supabase/server";

export class UserAccessError extends Error {
  constructor(public readonly code: "not_signed_in") {
    super(code);
    this.name = "UserAccessError";
  }
}

export async function requireUserSession() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new UserAccessError("not_signed_in");
  }

  return { supabase, user };
}
