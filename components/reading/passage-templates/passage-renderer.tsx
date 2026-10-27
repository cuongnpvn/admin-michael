import { PassageHtmlContent } from "@/lib/reading/passage-html";

interface PassageRendererProps {
  content: string;
  className?: string;
}

export function PassageRenderer({ content, className }: PassageRendererProps) {
  return <PassageHtmlContent html={content} className={className} />;
}
