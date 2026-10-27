"use client";

import { NotebookPen, Search } from "lucide-react";
import { useEffect, useState } from "react";
import {
	Popover,
	PopoverAnchor,
	PopoverContent,
} from "@/components/ui/popover";
import { copy } from "@/lib/copy/vi";
import { cn } from "@/lib/utils";

export type TextSelectionMenuState = {
	text: string;
	rect: DOMRect;
} | null;

interface TextSelectionMenuProps {
	menu: TextSelectionMenuState;
	onAddNote: () => void;
	onLookup: () => void;
	onDismiss: () => void;
}

const VIEWPORT_PADDING = 8;
const ESTIMATED_MENU_HEIGHT = 88;

type MenuPlacement = {
	side: "top" | "bottom";
	align: "start" | "end";
};

function resolveMenuPlacement(rect: DOMRect): MenuPlacement {
	const spaceAbove = rect.top - VIEWPORT_PADDING;
	const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_PADDING;

	if (spaceAbove >= ESTIMATED_MENU_HEIGHT || spaceAbove >= spaceBelow) {
		return { side: "top", align: "end" };
	}

	return { side: "bottom", align: "end" };
}

export function TextSelectionMenu({
	menu,
	onAddNote,
	onLookup,
	onDismiss,
}: TextSelectionMenuProps) {
	const [placement, setPlacement] = useState<MenuPlacement>({
		side: "top",
		align: "end",
	});

	useEffect(() => {
		if (!menu) {
			return;
		}

		setPlacement(resolveMenuPlacement(menu.rect));

		const handleReposition = () => {
			setPlacement(resolveMenuPlacement(menu.rect));
		};

		window.addEventListener("resize", handleReposition);

		return () => {
			window.removeEventListener("resize", handleReposition);
		};
	}, [menu]);

	return (
		<Popover
			open={Boolean(menu)}
			onOpenChange={(open) => {
				if (!open) {
					onDismiss();
				}
			}}
		>
			{menu ? (
				<PopoverAnchor asChild>
					<span
						aria-hidden
						className="pointer-events-none fixed"
						style={{
							top: menu.rect.top,
							left: menu.rect.left + menu.rect.width / 2,
							width: 0,
							height: menu.rect.height,
						}}
					/>
				</PopoverAnchor>
			) : null}
			<PopoverContent
				side={placement.side}
				align={placement.align}
				sideOffset={12}
				alignOffset={-12}
				collisionPadding={VIEWPORT_PADDING}
				avoidCollisions
				onOpenAutoFocus={(event) => event.preventDefault()}
				className={cn(
					"z-[61] w-auto overflow-hidden rounded-[10px] p-0",
				)}
			>
				<div className="flex flex-col">
					<button
						type="button"
						className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-foreground transition-calm hover:bg-muted"
						onClick={onAddNote}
					>
						<NotebookPen className="size-4 text-primary" />
						{copy.notebook.addNote}
					</button>
					<button
						type="button"
						className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-foreground transition-calm hover:bg-muted"
						onClick={onLookup}
					>
						<Search className="size-4 text-primary" />
						{copy.notebook.lookup}
					</button>
				</div>
			</PopoverContent>
		</Popover>
	);
}
