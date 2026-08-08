import { prefs } from '../core/preferences';

/** A saved custom background entry, as persisted in preferences. */
export interface CustomTemplate {
    id: string;
    name: string;
    template: string;
}

// localStorage preference holding the list of saved custom backgrounds (JSON).
const CUSTOM_TEMPLATES_KEY = 'background-custom-templates';
// Legacy preference holding a single custom template (pre multi-custom support).
const CUSTOM_TEMPLATE_LEGACY_KEY = 'background-custom-template';
// Monotonic counter so custom ids are never reused, even after a deletion.
const CUSTOM_NEXT_ID_KEY = 'background-custom-next-id';
// Legacy single-custom source id (pre multi-custom support).
const LEGACY_CUSTOM_SOURCE_ID = 'custom';
// Id assigned when migrating the legacy single custom entry.
const MIGRATED_LEGACY_CUSTOM_ID = 'custom-1';


/**
 * Normalize a custom tile URL template before persistence and dedupe.
 * Strips paste noise (leading/trailing whitespace, newlines) so localStorage
 * never keeps an unclean copy of what the user pasted.
 * @param template - raw template from the modal, hash, etc.
 * @returns the cleaned template (may be empty)
 */
export function cleanCustomTemplate(template: string): string {
    return (template || '')
        .replace(/[\r\n]+/g, '')
        .trim();
}


/**
 * Produce a display-friendly label from a custom tile URL template when the
 * user did not supply a name. Keeps host + path folders only: strips protocol,
 * leading "www.", query/hash, and tile-template tokens (from the first `{`
 * onward). e.g.
 * "https://www.example.com/tiles/berlin/{z}/{x}/{y}.png?token=x"
 * → "example.com/tiles/berlin"
 * @param template - the tile URL template
 * @returns the cleaned, display-friendly template
 */
export function customTemplateLabel(template: string): string {
    let s = (template || '').replace(/\s+/g, ' ').trim();
    s = s.replace(/^https?:\/\//i, '');
    s = s.replace(/^www\./i, '');
    s = s.split(/[?#]/, 1)[0];          // drop query string and hash
    s = s.replace(/\{[\s\S]*$/, '');   // drop tile tokens and anything after
    s = s.replace(/\/+$/, '');         // trailing slashes
    s = s.replace(/^\.+/, '');         // leading dots left by e.g. `{switch}.host`
    return s;
}


/**
 * The numeric suffix of a `custom-<n>` source id.
 * Used both for minting new ids and for stable list ordering.
 * @param id - a background source id
 * @returns the id number, or 0 if this is not a custom id
 */
export function customIdNumber(id: string): number {
    const match = /^custom-(\d+)$/.exec(id || '');
    return match ? +match[1] : 0;
}


/**
 * The highest `custom-<n>` id number in a list (0 if none).
 */
function maxCustomIdNumber(list: CustomTemplate[]): number {
    return list.reduce((max, entry) => Math.max(max, customIdNumber(entry.id)), 0);
}


/**
 * Read the saved custom background entries from preferences.
 *
 * One-time migration (only when the new list key is absent): copy the legacy
 * single-template pref into `custom-1`, rewrite `background-last-used*` from
 * `custom` → `custom-1`, and delete the legacy key. Afterwards the list key is
 * the only source of truth.
 *
 * The monotonic id counter is seeded on first read so a `custom-<n>` id is
 * never reused after the highest entry is deleted.
 * @returns the saved entries
 */
export function readCustomTemplates(): CustomTemplate[] {
    const raw = prefs(CUSTOM_TEMPLATES_KEY);
    let list: CustomTemplate[];

    if (raw === null) {
        const legacy = prefs(CUSTOM_TEMPLATE_LEGACY_KEY);
        if (legacy) {
            list = [{ id: MIGRATED_LEGACY_CUSTOM_ID, name: '', template: legacy }];
            writeCustomTemplates(list);
            prefs(CUSTOM_TEMPLATE_LEGACY_KEY, null);
            if (prefs('background-last-used') === LEGACY_CUSTOM_SOURCE_ID) {
                prefs('background-last-used', MIGRATED_LEGACY_CUSTOM_ID);
            }
            if (prefs('background-last-used-toggle') === LEGACY_CUSTOM_SOURCE_ID) {
                prefs('background-last-used-toggle', MIGRATED_LEGACY_CUSTOM_ID);
            }
        } else {
            list = [];
        }
    } else {
        try {
            const parsed = JSON.parse(raw);
            list = Array.isArray(parsed) ? parsed : [];
        } catch {
            list = [];
        }
    }

    if (prefs(CUSTOM_NEXT_ID_KEY) === null) {
        prefs(CUSTOM_NEXT_ID_KEY, String(maxCustomIdNumber(list)));
    }
    return list;
}


/**
 * Persist the saved custom background entries to preferences.
 * @param list - the entries to store
 */
export function writeCustomTemplates(list: CustomTemplate[]): void {
    prefs(CUSTOM_TEMPLATES_KEY, JSON.stringify(list));
}


/**
 * Generate a new, stable, never-reused id for a custom entry (e.g. "custom-3").
 * Reads and bumps the persisted monotonic counter (seeded by readCustomTemplates),
 * so an id is never recycled after deletion — which would otherwise let a stale
 * `background-last-used` reference resolve to a different layer.
 * @returns a fresh, unique id
 */
export function nextCustomId(): string {
    let seq = parseInt(prefs(CUSTOM_NEXT_ID_KEY) ?? '', 10);
    if (isNaN(seq)) seq = 0;
    seq += 1;
    prefs(CUSTOM_NEXT_ID_KEY, String(seq));
    return 'custom-' + seq;
}
