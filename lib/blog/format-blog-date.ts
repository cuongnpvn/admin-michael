export function formatBlogDate(isoDate: string | null): string {
  if (!isoDate) return "";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(isoDate));
}
