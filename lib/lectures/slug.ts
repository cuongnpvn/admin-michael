import { slugifyBlogTitle } from "@/lib/admin/blog/slug";

export function slugifyLectureTitle(title: string): string {
  return slugifyBlogTitle(title);
}

export function ensureUniqueLectureSlug(
  baseSlug: string,
  takenSlugs: string[],
): string {
  const taken = new Set(takenSlugs);
  if (!taken.has(baseSlug)) return baseSlug;

  let suffix = 2;
  while (taken.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}`;
}
