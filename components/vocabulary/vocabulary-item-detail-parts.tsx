import type { ReactNode } from "react";
import { Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function highlightTerm(example: string, term: string): ReactNode {
  const trimmed = term.trim();
  if (!trimmed) return example;

  const parts = example.split(new RegExp(`(${escapeRegExp(trimmed)})`, "gi"));
  return parts.map((part, index) =>
    part.toLowerCase() === trimmed.toLowerCase() ? (
      <strong key={index} className="font-semibold text-foreground">
        {part}
      </strong>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

export function CefrLevelBadge({
  level,
}: {
  level: string | null | undefined;
}) {
  if (!level) return null;

  return (
    <Badge
      variant="secondary"
      className="rounded-full px-2 py-0 text-[10px] font-medium"
    >
      {level}
    </Badge>
  );
}

export function ChipList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((value) => (
        <Badge key={value} variant="secondary" className="font-normal">
          {value}
        </Badge>
      ))}
    </div>
  );
}

export function SpeakButton({
  label,
  onClick,
  showLabel = true,
  className,
}: {
  label: string;
  onClick: () => void;
  showLabel?: boolean;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        "h-7 text-muted-foreground",
        showLabel ? "gap-1 px-2 text-xs" : "size-7 px-0",
        className,
      )}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <Volume2 className="size-3.5" />
      {showLabel ? <span>{label}</span> : null}
    </Button>
  );
}
