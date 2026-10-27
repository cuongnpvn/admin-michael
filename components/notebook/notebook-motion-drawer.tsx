"use client";

import type { ReactNode } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface NotebookMotionDrawerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	children: ReactNode;
	ariaLabelledBy?: string;
}

export function NotebookMotionDrawer({
	open,
	onOpenChange,
	children,
	ariaLabelledBy,
}: NotebookMotionDrawerProps) {
	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				hideClose
				aria-labelledby={ariaLabelledBy}
				aria-describedby={undefined}
				className="flex w-full max-w-md flex-col gap-0 p-0 sm:max-w-md"
			>
				{children}
			</SheetContent>
		</Sheet>
	);
}
