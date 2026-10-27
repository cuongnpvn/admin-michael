import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { APP_NAME, copy } from "@/lib/copy/vi";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">{copy.admin.title}</h1>
          <p className="text-sm text-muted-foreground">{APP_NAME}</p>
        </div>
        <GoogleSignInButton redirectTo="/admin" />
      </div>
    </main>
  );
}
