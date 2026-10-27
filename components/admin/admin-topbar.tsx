import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { AdminMobileNav } from "@/components/admin/admin-sidebar";
import { copy } from "@/lib/copy/vi";
import { learnerAppUrl } from "@/lib/learner-app-url";

export function AdminTopBar() {
  const learnerUrl = learnerAppUrl();

  return (
    <header className="z-40 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-sm lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <AdminMobileNav />
        <div className="min-w-0 lg:hidden">
          <p className="truncate text-sm font-semibold">{copy.admin.title}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {learnerUrl ? (
          <Link
            href={learnerUrl}
            className="hidden text-sm text-muted-foreground transition-calm hover:text-foreground sm:inline"
          >
            {copy.admin.backToApp}
          </Link>
        ) : null}
        <ThemeToggle />
        <SignOutButton />
      </div>
    </header>
  );
}
