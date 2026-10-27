const VOID_TAGS = new Set(["br", "hr", "img"]);
const INLINE_TAGS = new Set(["strong", "em", "b", "i", "u", "span", "br"]);
const TAG_RE = /<\/?([A-Za-z][A-Za-z0-9]*)\b[^>]*>/g;

type HtmlNode =
  | { kind: "text"; value: string }
  | { kind: "void"; raw: string }
  | {
      kind: "element";
      name: string;
      open: string;
      close: string;
      children: HtmlNode[];
    };

type ParseFrame = {
  node: Extract<HtmlNode, { kind: "element" }> | null;
  children: HtmlNode[];
};

export function prettyPrintLectureHtml(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) return "";
  return formatNodes(parseHtml(trimmed), 0).join("\n");
}

function parseHtml(html: string): HtmlNode[] {
  const root: HtmlNode[] = [];
  const stack: ParseFrame[] = [{ node: null, children: root }];
  let lastIndex = 0;

  TAG_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TAG_RE.exec(html))) {
    if (match.index > lastIndex) {
      pushText(stack[stack.length - 1]!.children, html.slice(lastIndex, match.index));
    }

    const raw = match[0];
    const name = match[1]!.toLowerCase();
    const isClose = raw.startsWith("</");
    const isVoid = VOID_TAGS.has(name) || raw.endsWith("/>");

    if (isClose) {
      closeUntil(stack, name, raw);
    } else if (isVoid) {
      stack[stack.length - 1]!.children.push({ kind: "void", raw });
    } else {
      const element: Extract<HtmlNode, { kind: "element" }> = {
        kind: "element",
        name,
        open: raw,
        close: `</${name}>`,
        children: [],
      };
      stack[stack.length - 1]!.children.push(element);
      stack.push({ node: element, children: element.children });
    }

    lastIndex = match.index + raw.length;
  }

  if (lastIndex < html.length) {
    pushText(stack[stack.length - 1]!.children, html.slice(lastIndex));
  }

  return root;
}

function closeUntil(stack: ParseFrame[], name: string, raw: string): void {
  for (let index = stack.length - 1; index > 0; index -= 1) {
    const frame = stack[index];
    if (frame?.node?.name !== name) continue;
    frame.node.close = raw;
    stack.length = index;
    return;
  }

  stack[stack.length - 1]!.children.push({ kind: "text", value: raw });
}

function pushText(children: HtmlNode[], value: string): void {
  if (!value) return;
  children.push({ kind: "text", value });
}

function isInlineName(name: string): boolean {
  return INLINE_TAGS.has(name);
}

function hasBlockChild(nodes: HtmlNode[]): boolean {
  return nodes.some((node) => {
    if (node.kind === "void") return false;
    if (node.kind === "text") return false;
    if (!isInlineName(node.name)) return true;
    return hasBlockChild(node.children);
  });
}

function collapseInlineText(value: string): string {
  return value.replace(/[ \t]*\n[ \t]*/g, " ");
}

function serializeInline(nodes: HtmlNode[]): string {
  return nodes
    .map((node) => {
      if (node.kind === "text") return collapseInlineText(node.value);
      if (node.kind === "void") return node.raw;
      return `${node.open}${serializeInline(node.children)}${node.close}`;
    })
    .join("")
    .replace(/^\s+|\s+$/g, "");
}

function formatNodes(nodes: HtmlNode[], indent: number): string[] {
  const pad = "  ".repeat(indent);
  const lines: string[] = [];

  for (const node of nodes) {
    if (node.kind === "text") {
      const text = collapseInlineText(node.value).trim();
      if (text) lines.push(`${pad}${text}`);
      continue;
    }

    if (node.kind === "void") {
      lines.push(`${pad}${node.raw}`);
      continue;
    }

    if (isInlineName(node.name) || !hasBlockChild(node.children)) {
      lines.push(`${pad}${node.open}${serializeInline(node.children)}${node.close}`);
      continue;
    }

    lines.push(`${pad}${node.open}`);
    lines.push(...formatNodes(node.children, indent + 1));
    lines.push(`${pad}${node.close}`);
  }

  return lines;
}
