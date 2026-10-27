import type { User } from "@supabase/supabase-js";
import {
  createFallbackDisplayName,
  resolveAuthMetadataDisplayName,
  shouldSyncProfileDisplayName,
} from "@/lib/user/resolve-display-name";

export async function syncProfileDisplayNameFromAuth(
  supabase: Awaited<
    ReturnType<typeof import("@/lib/supabase/server").createClient>
  >,
  user: User,
): Promise<void> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const currentDisplayName =
    typeof profile?.display_name === "string" ? profile.display_name : null;

  if (!shouldSyncProfileDisplayName(currentDisplayName, user.email)) {
    return;
  }

  const metadataName = resolveAuthMetadataDisplayName(user.user_metadata);
  const displayName = metadataName || createFallbackDisplayName();

  await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id);
}
