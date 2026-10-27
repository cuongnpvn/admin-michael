import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-calm",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/10 text-primary",
        secondary:
          "border-transparent bg-secondary/25 text-secondary",
        success: "border-transparent bg-success/10 text-success",
        outline: "border-border-subtle text-muted-foreground",
        topic:
          "border-violet-300/80 bg-violet-100 text-violet-950",
        grammar:
          "border-emerald-300/80 bg-emerald-100 text-emerald-950",
        skill:
          "border-pink-300/80 bg-pink-100 text-pink-950",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
