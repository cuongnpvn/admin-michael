import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface InstructionMarkdownPreviewProps {
  content: string;
  className?: string;
}

export function InstructionMarkdownPreview({
  content,
  className,
}: InstructionMarkdownPreviewProps) {
  return (
    <div className={cn("instruction-markdown", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
