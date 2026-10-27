export function stripLeadingLectureKicker(html: string): string {
  return html.replace(
    /^\s*<p\b[^>]*\bclass="[^"]*\bkicker\b[^"]*"[^>]*>[\s\S]*?<\/p>\s*/i,
    "",
  );
}
