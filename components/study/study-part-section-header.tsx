import { Badge } from "@/components/ui/badge";
import { copy } from "@/lib/copy/vi";
import { cn } from "@/lib/utils";

interface StudyPartSectionHeaderProps {
  part: number;
  title: string;
  questionCount: number;
  className?: string;
}

export function StudyPartSectionHeader({
  part,
  title,
  questionCount,
  className,
}: StudyPartSectionHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <h3 className="text-sm font-semibold text-foreground">
        {copy.study.partSectionLabel(part, title)}
      </h3>
      <Badge variant="secondary">
        {copy.study.groupCardQuestions(questionCount)}
      </Badge>
    </div>
  );
}
