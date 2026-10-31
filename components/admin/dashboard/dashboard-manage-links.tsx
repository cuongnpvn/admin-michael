import Link from "next/link";
import {
  AudioLines,
  BadgePercent,
  Bell,
  ClipboardCheck,
  ClipboardList,
  KeyRound,
  SpellCheck,
  Users,
} from "lucide-react";
import {
  ADMIN_ENTRANCE_TEST_PATH,
  adminAnswerKeysPath,
  adminNotificationsPath,
  adminSubscriptionsPath,
  adminUsersPath,
} from "@/lib/admin/admin-paths";
import { copy } from "@/lib/copy/vi";
import { Card } from "@/components/ui/card";

const LINKS = [
  {
    href: adminUsersPath(),
    label: copy.admin.nav.users,
    icon: Users,
  },
  {
    href: "/exams",
    label: copy.admin.nav.exams,
    icon: ClipboardList,
  },
  {
    href: ADMIN_ENTRANCE_TEST_PATH,
    label: copy.admin.nav.entranceTest,
    icon: ClipboardCheck,
  },
  {
    href: adminSubscriptionsPath(),
    label: copy.admin.nav.subscriptions,
    icon: BadgePercent,
  },
  {
    href: adminNotificationsPath(),
    label: copy.admin.nav.notifications,
    icon: Bell,
  },
  {
    href: "/vocab",
    label: copy.admin.nav.vocab,
    icon: SpellCheck,
  },
  {
    href: "/dictation",
    label: copy.nav.dictation,
    icon: AudioLines,
  },
  {
    href: adminAnswerKeysPath(),
    label: copy.admin.nav.answerKeys,
    icon: KeyRound,
  },
] as const;

export function DashboardManageLinks() {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">
        {copy.admin.overview.manage}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="group block">
              <Card className="flex h-full flex-row items-center gap-3 p-4 transition-calm hover:-translate-y-px hover:border-primary/30 hover:shadow-card">
                <div className="flex size-9 items-center justify-center rounded-[12px] bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </div>
                <span className="text-sm font-medium">{item.label}</span>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
