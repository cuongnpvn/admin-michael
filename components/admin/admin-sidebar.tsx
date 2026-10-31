"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	Bell,
	ClipboardCheck,
	ClipboardList,
	Crown,
	KeyRound,
	LayoutDashboard,
	Menu,
	AudioLines,
	BookOpen,
	Newspaper,
	SpellCheck,
	Users,
} from "lucide-react";
import { useState } from "react";
import { APP_NAME, copy } from "@/lib/copy/vi";
import {
	ADMIN_ENTRANCE_TEST_PATH,
	adminAnswerKeysPath,
	adminNotificationsPath,
	adminSubscriptionsPath,
	adminUsersPath,
} from "@/lib/admin/admin-paths";
import { learnerAppUrl } from "@/lib/learner-app-url";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";

const NAV_ITEMS = [
	{
		href: "/",
		label: copy.admin.nav.dashboard,
		icon: LayoutDashboard,
		match: (path: string) => path === "/",
	},
	{
		href: "/exams",
		label: copy.admin.nav.exams,
		icon: ClipboardList,
		match: (path: string) => path.startsWith("/exams"),
	},
	{
		href: ADMIN_ENTRANCE_TEST_PATH,
		label: copy.admin.nav.entranceTest,
		icon: ClipboardCheck,
		match: (path: string) => path.startsWith(ADMIN_ENTRANCE_TEST_PATH),
	},
	{
		href: adminAnswerKeysPath(),
		label: copy.admin.nav.answerKeys,
		icon: KeyRound,
		match: (path: string) => path.startsWith("/answer-keys"),
	},
	{
		href: "/vocab",
		label: copy.admin.nav.vocab,
		icon: SpellCheck,
		match: (path: string) => path.startsWith("/vocab"),
	},
	{
		href: "/dictation",
		label: copy.nav.dictation,
		icon: AudioLines,
		match: (path: string) => path.startsWith("/dictation"),
	},
	{
		href: "/courses",
		label: copy.admin.nav.courses,
		icon: BookOpen,
		match: (path: string) => path.startsWith("/courses"),
	},
	{
		href: "/blog",
		label: copy.admin.nav.blog,
		icon: Newspaper,
		match: (path: string) => path.startsWith("/blog"),
	},
	{
		href: adminUsersPath(),
		label: copy.admin.nav.users,
		icon: Users,
		match: (path: string) => path.startsWith("/users"),
	},
	{
		href: adminSubscriptionsPath(),
		label: copy.admin.nav.subscriptions,
		icon: Crown,
		match: (path: string) => path.startsWith("/subscriptions"),
	},
	{
		href: adminNotificationsPath(),
		label: copy.admin.nav.notifications,
		icon: Bell,
		match: (path: string) => path.startsWith("/notifications"),
	},
] as const;

function NavLink({
	href,
	label,
	icon: Icon,
	isActive,
	onNavigate,
}: {
	href: string;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
	isActive: boolean;
	onNavigate?: () => void;
}) {
	return (
		<Link
			href={href}
			onClick={onNavigate}
			className={cn(
				"relative flex items-center gap-2.5 rounded-[12px] px-3 py-2 text-sm transition-calm",
				isActive
					? "bg-primary/10 font-medium text-primary"
					: "text-muted-foreground hover:bg-muted hover:text-foreground",
			)}
		>
			{isActive && (
				<span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
			)}
			<Icon className="size-4 shrink-0" />
			{label}
		</Link>
	);
}

function AdminSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
	const pathname = usePathname();

	return (
		<nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
			{NAV_ITEMS.map((item) => (
				<NavLink
					key={item.href}
					href={item.href}
					label={item.label}
					icon={item.icon}
					isActive={item.match(pathname)}
					onNavigate={onNavigate}
				/>
			))}
		</nav>
	);
}

export function AdminSidebar() {
	const learnerUrl = learnerAppUrl();

	return (
		<aside className="hidden h-full w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
			<div className="flex h-14 items-center gap-2 border-b border-border px-4">
				<LayoutDashboard className="size-5 text-primary" />
				<div className="min-w-0">
					<p className="truncate text-sm font-semibold text-foreground">
						{copy.admin.title}
					</p>
					<p className="truncate text-[11px] text-muted-foreground">
						{APP_NAME}
					</p>
				</div>
			</div>
			<AdminSidebarNav />
			{learnerUrl ? (
				<div className="border-t border-border p-3">
					<Link
						href={learnerUrl}
						className="flex items-center gap-2 rounded-[12px] px-3 py-2 text-sm text-muted-foreground transition-calm hover:bg-muted hover:text-foreground"
					>
						{copy.admin.backToApp}
					</Link>
				</div>
			) : null}
		</aside>
	);
}

export function AdminMobileNav() {
	const [open, setOpen] = useState(false);

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="lg:hidden"
					aria-label={copy.common.openMenu}
				>
					<Menu className="size-5" />
				</Button>
			</SheetTrigger>
			<SheetContent side="left" className="w-72 p-0">
				<SheetHeader className="border-b border-border px-4 py-4 text-left">
					<SheetTitle className="text-base">
						{copy.admin.title}
					</SheetTitle>
				</SheetHeader>
				<AdminSidebarNav onNavigate={() => setOpen(false)} />
			</SheetContent>
		</Sheet>
	);
}
