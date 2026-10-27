import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface QuestionExplanationMarkdownProps {
	content: string;
	className?: string;
}

function paragraphStartsWithArrow(children: ReactNode): boolean {
	if (typeof children === "string") {
		return children.trimStart().startsWith("→");
	}

	if (!Array.isArray(children)) return false;

	for (const child of children) {
		if (typeof child === "string") {
			const trimmed = child.trimStart();
			if (trimmed.length > 0) {
				return trimmed.startsWith("→");
			}
			continue;
		}

		if (
			child &&
			typeof child === "object" &&
			"props" in child &&
			typeof child.props?.children === "string"
		) {
			return child.props.children.trimStart().startsWith("→");
		}
	}

	return false;
}

export function QuestionExplanationMarkdown({
	content,
	className,
}: QuestionExplanationMarkdownProps) {
	return (
		<div className={cn("explanation-markdown", className)}>
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				rehypePlugins={[rehypeRaw]}
				components={{
					p: ({ children, ...props }) => {
						if (paragraphStartsWithArrow(children)) {
							return (
								<p
									className="explanation-markdown-conclusion"
									{...props}
								>
									{children}
								</p>
							);
						}

						return <p {...props}>{children}</p>;
					},
				}}
			>
				{content}
			</ReactMarkdown>
		</div>
	);
}
