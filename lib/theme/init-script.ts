export const THEME_INIT_CONFIG = {
  attribute: "class",
  storageKey: "theme",
  defaultTheme: "light",
  forcedTheme: null as string | null,
  themes: ["light", "dark"],
  value: null as Record<string, string> | null,
  enableSystem: true,
  enableColorScheme: true,
} as const;

/** Blocking script body — mirrors next-themes init, runs before paint. */
const THEME_INIT_FUNCTION = String.raw`function(attribute,storageKey,defaultTheme,forcedTheme,themes,value,enableSystem,enableColorScheme){var documentElement=document.documentElement,colorSchemes=["light","dark"];function applyTheme(theme){(Array.isArray(attribute)?attribute:[attribute]).forEach(function(attr){var isClass=attr==="class",themeValues=isClass&&value?themes.map(function(t){return value[t]||t}):themes;if(isClass){documentElement.classList.remove.apply(documentElement.classList,themeValues);var className=value&&value[theme]?value[theme]:theme;className&&documentElement.classList.add(className)}else attr.startsWith("data-")&&((value&&value[theme]?value[theme]:theme)?documentElement.setAttribute(attr,value&&value[theme]?value[theme]:theme):documentElement.removeAttribute(attr))});enableColorScheme&&colorSchemes.includes(theme)&&(documentElement.style.colorScheme=theme)}function getSystemTheme(){return window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}if(forcedTheme)applyTheme(forcedTheme);else try{var stored=localStorage.getItem(storageKey)||defaultTheme,resolved=enableSystem&&stored==="system"?getSystemTheme():stored;applyTheme(resolved)}catch(e){}}`;

export function buildThemeInitScript(
  config: typeof THEME_INIT_CONFIG = THEME_INIT_CONFIG,
): string {
  const args = JSON.stringify([
    config.attribute,
    config.storageKey,
    config.defaultTheme,
    config.forcedTheme,
    config.themes,
    config.value,
    config.enableSystem,
    config.enableColorScheme,
  ]).slice(1, -1);

  return `(${THEME_INIT_FUNCTION})(${args})`;
}
