import { prefs } from './preferences';

// UI theme support. A theme is a CSS file imported by the user and kept in
// localStorage (a single stylesheet is well within the ~5 MB quota). The active
// theme's CSS is injected into the page, and the OSM keys it styles via
// `tag-{key}` / `tag-{key}-{value}` selectors are emitted as classes on map
// elements (see svgTagClasses) so the rules actually apply.

/** Preference key holding the selected theme id. */
export const THEME_PREF = 'preferences.theme';
/** Preference key holding the JSON array of uploaded themes. */
export const UPLOADED_THEMES_PREF = 'preferences.theme.uploaded';
/** Id of the built-in (no custom CSS) theme. */
export const DEFAULT_THEME_ID = 'default';

/** A CSS theme imported by the user and stored in localStorage. */
export interface UploadedTheme {
    id: string;
    name: string;
    css: string;
}

/** A selectable entry in the theme picker. */
export interface ThemeEntry {
    id: string;
    name?: string;
    source: 'default' | 'uploaded';
}

/**
 * Uploaded themes stored in localStorage.
 * @returns the stored themes (empty array on missing/invalid data)
 */
export function getUploadedThemes(): UploadedTheme[] {
    try {
        const raw = prefs(UPLOADED_THEMES_PREF);
        const parsed = JSON.parse((typeof raw === 'string' ? raw : '') || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveUploadedThemes(themes: UploadedTheme[]): void {
    prefs(UPLOADED_THEMES_PREF, JSON.stringify(themes));
}

/**
 * Persist a new uploaded CSS theme.
 * @param theme - display name and raw CSS text
 * @returns the stored theme, with its generated id
 */
export function addUploadedTheme({ name, css }: { name: string; css: string }): UploadedTheme {
    // Date.now() alone is not unique for files added in the same millisecond.
    const id = `uploaded-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const theme: UploadedTheme = { id, name, css };
    saveUploadedThemes([...getUploadedThemes(), theme]);
    return theme;
}

/**
 * Remove an uploaded theme; resets the selection to default if it was active.
 * @param id - id of the theme to remove
 */
export function removeUploadedTheme(id: string): void {
    saveUploadedThemes(getUploadedThemes().filter((t) => t.id !== id));
    if (getSelectedThemeId() === id) setSelectedThemeId(DEFAULT_THEME_ID);
}

/** @returns the selected theme id (DEFAULT_THEME_ID when unset). */
export function getSelectedThemeId(): string {
    const raw = prefs(THEME_PREF);
    return (typeof raw === 'string' && raw) ? raw : DEFAULT_THEME_ID;
}

/** @param id - the theme id to select */
export function setSelectedThemeId(id: string): void {
    // The THEME_PREF onChange listener (registered in context.js) reacts by
    // calling applyTheme(), which refreshes the tag keys and injects the CSS.
    prefs(THEME_PREF, id);
}

/** @returns the CSS of the active theme (empty for the default/built-in theme). */
export function getActiveThemeCss(): string {
    const id = getSelectedThemeId();
    if (id === DEFAULT_THEME_ID) return '';
    const uploaded = getUploadedThemes().find((t) => t.id === id);
    return uploaded ? uploaded.css : '';
}

/** All selectable themes: built-in default, then uploaded ones. */
export function listThemes(): ThemeEntry[] {
    return [
        { id: DEFAULT_THEME_ID, source: 'default' },
        ...getUploadedThemes().map((t) => ({ id: t.id, name: t.name, source: 'uploaded' as const }))
    ];
}

// ---------------------------------------------------------------------------
// Theme-driven tag classes
//
// A theme's CSS may style features by OSM tag using `tag-{key}` /
// `tag-{key}-{value}` selectors. For those rules to match, map elements must
// carry the corresponding classes. We read the active theme's CSS, collect the
// referenced keys, and svgTagClasses emits them like secondary tags. The set is
// replaced whenever the theme changes, so classes a previous theme needed are
// dropped while the built-in secondaries always stay.
// ---------------------------------------------------------------------------

/**
 * Some `tag-*` classes are *computed* by svgTagClasses rather than coming from an
 * OSM `key=value`. Extraction takes the part before the first `-` as the key
 * (e.g. `.tag-cuisine-pizza` → `cuisine`), but for these the leading token is not
 * a real OSM key, so we skip it — otherwise we'd add a bogus secondary key and
 * try to read a tag that does not exist:
 *   - `status`   → from `tag-status` / `tag-status-{lifecycle}` (e.g. abandoned)
 *   - `wikidata` → from `tag-wikidata` (any `*:wikidata` present)
 *   - `paved` / `unpaved` / `semipaved` / `ungraded` → inferred highway surface
 *       category, not the literal `surface`/`tracktype` tag (svgTagClasses derives
 *       it and even emits it with no surface tag). The exact value stays available
 *       via the secondary `tag-surface-{value}`.
 */
const SYNTHETIC_TAG_TOKENS = new Set([
    'status', 'wikidata', 'paved', 'unpaved', 'semipaved', 'ungraded'
]);

/** Theme-required secondary keys, in their CSS-class form (`:` written as `_`). */
let themeSecondaryTagKeys = new Set<string>();

/** @param keys - secondary keys required by the active theme's CSS */
export function setThemeSecondaryTagKeys(keys: string[]): void {
    themeSecondaryTagKeys = new Set(Array.isArray(keys) ? keys : []);
}

/** @returns the theme-required secondary keys (CSS-class form) */
export function getThemeSecondaryTagKeys(): string[] {
    return [...themeSecondaryTagKeys];
}

/**
 * Collect the OSM keys referenced by `tag-*` selectors in a theme's CSS. The key
 * is the part after `tag-` up to the first `-` (OSM keys never contain `-`; the
 * `-` separates key from value). Synthetic tokens are skipped.
 *
 * @param css - raw CSS text
 * @returns unique keys (CSS-class form, e.g. `cuisine`, `piste_type`)
 */
export function extractTagKeysFromCss(css: string): string[] {
    const keys = new Set<string>();
    if (typeof css !== 'string') return [];
    const re = /\.tag-([a-z0-9_]+)/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(css)) !== null) {
        const key = match[1];
        if (!SYNTHETIC_TAG_TOKENS.has(key)) keys.add(key);
    }
    return [...keys];
}

/**
 * Append theme-required secondary tag classes for an entity. Iterates the
 * entity's actual tags and converts each key to its CSS-class form (`:` → `_`)
 * before matching the theme set. Using the real key avoids any `_`-vs-`:`
 * ambiguity (e.g. `piste:type` and a hypothetical `piste_type` both map to the
 * class `tag-piste_type`, and keys like `piste:type_for_x` round-trip cleanly).
 *
 * Known side-effect, left unhandled: two keys that differ only by `:` vs `_`
 * (e.g. `foo:bar` and `foo_bar`) collapse to the same `tag-foo_bar` class, so on
 * an element carrying both, both value-classes would be emitted. CSS classes
 * cannot contain `:`, so this collision is inherent. It's unlikely because `:`
 * is the conventional namespace separator, but no rule forbids a `_` variant of
 * an otherwise identical key. See https://wiki.openstreetmap.org/wiki/Prefix
 *
 * @param classes - class list being built (mutated)
 * @param t - entity tags
 */
export function appendThemeTagClasses(classes: string[], t: Record<string, string>): void {
    if (themeSecondaryTagKeys.size === 0) return;
    for (const realKey in t) {
        const classKey = realKey.replace(/:/g, '_');
        if (!themeSecondaryTagKeys.has(classKey)) continue;
        const value = t[realKey];
        if (!value || value === 'no') continue;
        if (classes.indexOf('tag-' + classKey) === -1) classes.push('tag-' + classKey);
        const valueClass = 'tag-' + classKey + '-' + value;
        if (classes.indexOf(valueClass) === -1) classes.push(valueClass);
    }
}

/**
 * Refresh the tag keys that the active theme's CSS needs, so map elements get the
 * matching `tag-*` classes. Call on theme change and at startup.
 */
export function refreshThemeTagKeys(): void {
    setThemeSecondaryTagKeys(extractTagKeysFromCss(getActiveThemeCss()));
}

/** id of the <style> element holding the active theme's CSS. */
const THEME_STYLE_ELEMENT_ID = 'id-theme-css';

/**
 * Inject the active theme's CSS into a dedicated <style> in the document head
 * (created on first use). Switching themes replaces its content, so the previous
 * theme's rules are dropped. No-op outside a browser (e.g. tests without a DOM).
 */
export function injectThemeCss(): void {
    if (typeof document === 'undefined') return;
    let style = document.getElementById(THEME_STYLE_ELEMENT_ID) as HTMLStyleElement | null;
    if (!style) {
        style = document.createElement('style');
        style.id = THEME_STYLE_ELEMENT_ID;
        document.head.appendChild(style);
    }
    style.textContent = getActiveThemeCss();
}

/** Apply the active theme: refresh its tag keys and inject its CSS. */
export function applyTheme(): void {
    refreshThemeTagKeys();
    injectThemeCss();
}
