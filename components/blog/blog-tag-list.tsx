import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BlogTagListProps {
  tags: string[];
  className?: string;
  maxVisible?: number;
}

export function BlogTagList({
  tags,
  className,
  maxVisible = 4,
}: BlogTagListProps) {
  if (tags.length === 0) return null;

  const visibleTags = tags.slice(0, maxVisible);
  const remainingCount = tags.length - visibleTags.length;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {visibleTags.map((tag) => (
        <Badge key={tag} variant="outline" className="px-2.5 py-0.5 text-xs font-normal">
          {tag}
        </Badge>
      ))}
      {remainingCount > 0 ? (
        <Badge variant="outline" className="px-2.5 py-0.5 text-xs font-normal">
          +{remainingCount}
        </Badge>
      ) : null}
    </div>
  );
}
