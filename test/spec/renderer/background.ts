// The stored JSDoc type of iD.prefs reports the setter's boolean result and
// disallows null; at runtime a get returns the stored string (or null) and a
// set accepts null to clear. Wrap it for the tests.
import type { CustomTemplate } from '../../../modules/renderer/custom_backgrounds';

function setPref(key: string, value: string | null): void {
    (iD.prefs as any)(key, value);
}
function getPref(key: string): string | null {
    return (iD.prefs as any)(key);
}

// The runtime background sources are built in loosely-typed JS (they surface as
// `object`), so we narrow the surface the tests actually read.
interface CustomSource {
    id: string;
    isCustom: boolean;
    template(): string;
    customName(): string;
}

/** Assert a background source is present (not null) and narrow its type. */
function asSource(value: object | null | undefined): CustomSource {
    expect(value).toBeTruthy();
    return value as unknown as CustomSource;
}

/** Assert a value is defined (not null/undefined) and narrow its type. */
function defined<T>(value: T | null | undefined): T {
    expect(value).toBeTruthy();
    return value as T;
}


describe('iD.rendererBackground', function() {
    let _uniqCounter = 0;
    function uniq(): string { return (++_uniqCounter).toString(); }

    function clearCustomPrefs() {
        setPref('background-custom-templates', null);
        setPref('background-custom-template', null);
        setPref('background-custom-next-id', null);
    }

    let context: iD.Context;


    describe('custom template migration', function() {
        // The prefs must be set up *before* the context is created, because
        // creating it kicks off an async background load that itself migrates.
        beforeEach(function() {
            clearCustomPrefs();
        });

        it('migrates a legacy single custom template into the list', function() {
            setPref('background-custom-template', 'https://legacy/{z}/{x}/{y}.png');
            context = iD.coreContext().assetPath('../dist/').init();

            const list = context.background().customTemplates();
            expect(list).toHaveLength(1);
            expect(list[0].template).toBe('https://legacy/{z}/{x}/{y}.png');
            expect(list[0].id).toBe('custom-1');
        });

        it('rewrites legacy background-last-used prefs on migration', function() {
            setPref('background-custom-template', 'https://legacy/{z}/{x}/{y}.png');
            setPref('background-last-used', 'custom');
            setPref('background-last-used-toggle', 'custom');
            context = iD.coreContext().assetPath('../dist/').init();
            context.background().customTemplates();

            expect(getPref('background-last-used')).toBe('custom-1');
            expect(getPref('background-last-used-toggle')).toBe('custom-1');
        });

        it('migrates to an empty list when there is no legacy template', function() {
            context = iD.coreContext().assetPath('../dist/').init();
            expect(context.background().customTemplates()).toEqual([]);
        });

        it('does not re-migrate once the new list preference exists', function() {
            setPref('background-custom-templates', JSON.stringify([]));
            setPref('background-custom-template', 'https://legacy/{z}/{x}/{y}.png');
            context = iD.coreContext().assetPath('../dist/').init();

            expect(context.background().customTemplates()).toEqual([]);
        });
    });


    describe('custom source helpers', function() {
        let bg: ReturnType<iD.Context['background']>;

        beforeEach(async function() {
            // prefs must be clean before context creation (background load reads them)
            clearCustomPrefs();
            context = iD.coreContext().assetPath('../dist/').init();
            bg = context.background();
            await bg.ensureLoaded();
        });

        it('addOrGetCustomSource creates, persists and dedupes by exact template', function() {
            const tmpl = 'https://create-' + uniq() + '/{z}/{x}/{y}.png';
            const a = asSource(bg.addOrGetCustomSource(tmpl, 'A name'));
            expect(a.isCustom).toBe(true);
            expect(a.template()).toBe(tmpl);

            const again = asSource(bg.addOrGetCustomSource(tmpl));
            expect(again.id).toBe(a.id);   // deduped -> same source

            const entries = bg.customTemplates().filter((e: CustomTemplate) => e.template === tmpl);
            expect(entries).toHaveLength(1);
            expect(entries[0].name).toBe('A name');
        });

        it('updateCustomSource keeps the id stable while changing the template', function() {
            const t1 = 'https://one-' + uniq() + '/{z}/{x}/{y}.png';
            const t2 = 'https://two-' + uniq() + '/{z}/{x}/{y}.png';
            const id = asSource(bg.addOrGetCustomSource(t1)).id;

            const updated = asSource(bg.updateCustomSource(id, { template: t2, name: 'renamed' }));
            expect(updated.id).toBe(id);
            expect(updated.template()).toBe(t2);

            const entry = defined(bg.customTemplates().find((e: CustomTemplate) => e.id === id));
            expect(entry.template).toBe(t2);
            expect(entry.name).toBe('renamed');
        });

        it('updateCustomSource merges into the existing entry when edited to a duplicate template', function() {
            const ta = 'https://a-' + uniq() + '/{z}/{x}/{y}.png';
            const tb = 'https://b-' + uniq() + '/{z}/{x}/{y}.png';
            const a = asSource(bg.addOrGetCustomSource(ta));
            const b = asSource(bg.addOrGetCustomSource(tb));

            const merged = asSource(bg.updateCustomSource(b.id, { template: ta }));
            expect(merged.id).toBe(a.id);   // merged into the existing duplicate
            expect(bg.customTemplates().some((e: CustomTemplate) => e.id === b.id)).toBe(false);
        });

        it('removeCustomSource removes the entry and its source', function() {
            const tmpl = 'https://del-' + uniq() + '/{z}/{x}/{y}.png';
            const id = asSource(bg.addOrGetCustomSource(tmpl)).id;

            bg.removeCustomSource(id);
            expect(bg.customTemplates().some((e: CustomTemplate) => e.id === id)).toBe(false);
            expect(bg.findSource(id)).toBeFalsy();
        });

        it('never reuses an id after an entry is removed (avoids stale last-used collisions)', function() {
            const idA = asSource(bg.addOrGetCustomSource('https://reuse-a-' + uniq() + '/{z}/{x}/{y}.png')).id;
            bg.removeCustomSource(idA);
            const b = asSource(bg.addOrGetCustomSource('https://reuse-b-' + uniq() + '/{z}/{x}/{y}.png'));
            expect(b.id).not.toBe(idA);
        });

        it('cleans paste whitespace from the template before storage and dedupe', function() {
            const base = 'https://mapproxy-' + uniq() + '/{z}/{x}/{y}.png';
            const dirty = '  ' + base + '\n\n';
            const s = asSource(bg.addOrGetCustomSource(dirty));
            expect(s.template()).toBe(base);

            const entry = defined(bg.customTemplates().find((e: CustomTemplate) => e.id === s.id));
            expect(entry.template).toBe(base);

            // unclean and clean forms dedupe to the same entry
            expect(asSource(bg.addOrGetCustomSource(dirty)).id).toBe(s.id);
            expect(asSource(bg.addOrGetCustomSource(base)).id).toBe(s.id);
        });

        it('addOrGetCustomSource ignores an empty/whitespace template (no junk entry)', function() {
            const before = bg.customTemplates().length;
            expect(bg.addOrGetCustomSource('')).toBeNull();
            expect(bg.addOrGetCustomSource('   ')).toBeNull();
            expect(bg.customTemplates().length).toBe(before);
        });

        it('updateCustomSource ignores blanking the URL (keeps the existing template)', function() {
            const tmpl = 'https://keep-' + uniq() + '/{z}/{x}/{y}.png';
            const s = asSource(bg.addOrGetCustomSource(tmpl));
            const updated = asSource(bg.updateCustomSource(s.id, { template: '   ' }));
            expect(updated.id).toBe(s.id);
            expect(updated.template()).toBe(tmpl);
        });

        it('updateCustomSource merge carries a newly-typed name onto the surviving entry', function() {
            const ta = 'https://mergename-a-' + uniq() + '/{z}/{x}/{y}.png';
            const tb = 'https://mergename-b-' + uniq() + '/{z}/{x}/{y}.png';
            const a = asSource(bg.addOrGetCustomSource(ta, 'old A'));
            const b = asSource(bg.addOrGetCustomSource(tb));
            const merged = asSource(bg.updateCustomSource(b.id, { template: ta, name: 'new name' }));
            expect(merged.id).toBe(a.id);
            expect(merged.customName()).toBe('new name');
            expect(defined(bg.customTemplates().find((e: CustomTemplate) => e.id === a.id)).name).toBe('new name');
        });

        it('clears background-last-used references when a custom is deleted', function() {
            const tmpl = 'https://lastused-' + uniq() + '/{z}/{x}/{y}.png';
            const id = asSource(bg.addOrGetCustomSource(tmpl)).id;
            setPref('background-last-used', id);
            setPref('background-last-used-toggle', id);

            bg.removeCustomSource(id);
            expect(getPref('background-last-used')).not.toBe(id);
            expect(getPref('background-last-used-toggle')).not.toBe(id);
        });
    });


    // baseLayerSource() needs an OSM connection only for imagery-blocklist checks,
    // which are orthogonal to the custom-background URL logic. Stubbing a minimal
    // connection lets us exercise selection and the URL hash it writes.
    describe('URL and selection sync', function() {
        let bg: ReturnType<iD.Context['background']>;

        beforeEach(async function() {
            clearCustomPrefs();
            context = iD.coreContext().assetPath('../dist/').init();
            bg = context.background();
            await bg.ensureLoaded();
            (context as unknown as { connection: () => unknown }).connection = function() {
                return { imageryBlocklists: function() { return []; } };
            };
        });

        afterEach(function() {
            window.location.hash = '#background=none';
        });

        it('writes the selected custom into the URL and updates it on switch, without duplicating (RC3)', function() {
            const ta = 'https://sel-a-' + uniq() + '/{z}/{x}/{y}.png';
            const tb = 'https://sel-b-' + uniq() + '/{z}/{x}/{y}.png';
            const a = asSource(bg.addOrGetCustomSource(ta));
            const b = asSource(bg.addOrGetCustomSource(tb));
            const count = bg.customTemplates().length;

            bg.baseLayerSource(a);
            expect(bg.showsLayer(a)).toBe(true);
            expect(decodeURIComponent(window.location.hash)).toContain('background=custom:' + ta);

            bg.baseLayerSource(b);
            expect(decodeURIComponent(window.location.hash)).toContain('background=custom:' + tb);

            expect(bg.customTemplates().length).toBe(count);   // switching adds nothing
        });

        it('re-selecting an already-saved custom does not duplicate it (RC1/RC2)', function() {
            const t = 'https://resel-' + uniq() + '/{z}/{x}/{y}.png';
            const s = asSource(bg.addOrGetCustomSource(t));
            bg.baseLayerSource(s);
            const count = bg.customTemplates().length;

            expect(asSource(bg.addOrGetCustomSource(t)).id).toBe(s.id);
            expect(bg.customTemplates().length).toBe(count);
            expect(bg.showsLayer(s)).toBe(true);
        });

        it('falls back to None when the selected custom is deleted (RC5)', function() {
            const t = 'https://delsel-' + uniq() + '/{z}/{x}/{y}.png';
            const s = asSource(bg.addOrGetCustomSource(t));
            bg.baseLayerSource(s);
            expect(bg.showsLayer(s)).toBe(true);

            bg.removeCustomSource(s.id);
            expect(asSource(bg.baseLayerSource()).id).toBe('none');
        });

        it('adds and selects a custom from a "custom:" background hash on init (RC1/RC2)', async function() {
            const t = 'https://inithash-' + uniq() + '/{z}/{x}/{y}.png';
            window.location.hash = '#background=custom:' + t;

            await bg.init();

            expect(bg.customTemplates().find((e: CustomTemplate) => e.template === t)).toBeTruthy();
            expect(asSource(bg.baseLayerSource()).template()).toBe(t);
        });

        it('ignores an empty "custom:" hash on init (no junk entry, no blank custom selected)', async function() {
            const before = bg.customTemplates().length;
            window.location.hash = '#background=custom:';

            await bg.init();

            expect(bg.customTemplates().length).toBe(before);   // nothing persisted
            expect(asSource(bg.baseLayerSource()).isCustom).not.toBe(true);
        });

        it('selects a saved custom for a bare "custom" background hash (legacy id)', async function() {
            const t = 'https://barecustom-' + uniq() + '/{z}/{x}/{y}.png';
            asSource(bg.addOrGetCustomSource(t));
            window.location.hash = '#background=custom';

            await bg.init();

            expect(asSource(bg.baseLayerSource()).isCustom).toBe(true);
            expect(asSource(bg.baseLayerSource()).template()).toBe(t);
        });

        it('keeps the map on the merged duplicate when the selected custom is edited to an existing template (RC4)', function() {
            const ta = 'https://mergesel-a-' + uniq() + '/{z}/{x}/{y}.png';
            const tb = 'https://mergesel-b-' + uniq() + '/{z}/{x}/{y}.png';
            const a = asSource(bg.addOrGetCustomSource(ta));
            const b = asSource(bg.addOrGetCustomSource(tb));

            bg.baseLayerSource(b);
            const merged = asSource(bg.updateCustomSource(b.id, { template: ta }));

            expect(merged.id).toBe(a.id);
            // selection moved to the duplicate; no transient fallback to 'none'
            expect(asSource(bg.baseLayerSource()).id).toBe(a.id);
        });
    });
});
