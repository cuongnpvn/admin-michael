import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-calm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
	{
		variants: {
			variant: {
				default:
					"bg-primary text-primary-foreground shadow-soft hover:bg-primary-hover hover:-translate-y-px",
				secondary:
					"border border-border-subtle bg-surface text-foreground shadow-soft hover:bg-muted hover:-translate-y-px",
				ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
				outline:
					"border border-border-subtle bg-transparent text-foreground hover:bg-muted",
				destructive:
					"bg-destructive text-destructive-foreground shadow-soft hover:opacity-90",
			},
			size: {
				default: "h-11 rounded-[10px] px-5 py-3.5 text-base",
				sm: "h-9 rounded-[8px] px-4 text-sm",
				lg: "h-12 rounded-[14px] px-6 text-base",
				icon: "size-9 rounded-[10px]",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Button({
	className,
	variant,
	size,
	asChild = false,
	...props
}: React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	}) {
	const Comp = asChild ? Slot : "button";

	return (
		<Comp
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
