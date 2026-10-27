import { buildThemeInitScript } from "@/lib/theme/init-script";

/** Server-only blocking script — must not live inside a client component tree. */
export function ThemeInitScript() {
  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: buildThemeInitScript() }}
    />
  );
}
