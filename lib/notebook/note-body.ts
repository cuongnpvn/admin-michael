export function isNoteBodyEmpty(body: string): boolean {
  if (!body.trim()) {
    return true;
  }

  const text = body
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text.length === 0;
}

export function isHtmlNoteBody(body: string): boolean {
  return /^<([a-z]+)[^>]*>/i.test(body.trim());
}

export function toEditorHtml(body: string): string {
  if (!body.trim()) {
    return "";
  }

  if (isHtmlNoteBody(body)) {
    return body;
  }

  const escaped = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `<p>${escaped.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>`;
}
