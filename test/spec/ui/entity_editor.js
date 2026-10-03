import { setTimeout } from 'node:timers/promises';
import { select as d3_select } from 'd3-selection';

describe('iD.uiEntityEditor', function () {
    beforeEach(function () {
        iD.fileFetcher.cache().preset_presets = {
            'vertex_only': { tags: { highway: 'crossing' }, geometry: ['vertex'], name: 'Crossing' },
        };
    });

    afterEach(function () {
        iD.fileFetcher.cache().preset_fields = {};
        delete iD.fileFetcher.cache().languages;
        delete iD.fileFetcher.cache().territory_languages;
    });

    it('refreshes selected entity details when history merge fires', async () => {
        await iD.presetManager.ensureLoaded(true);
        const container = d3_select(document.createElement('div'));
        const selection = container.append('div');
        const context = iD.coreContext().assetPath('../dist/').init().container(container);

        context.history().merge([
            new iD.osmNode({ id: 'n1', loc: [0, 0], tags: { crossing: 'marked', highway: 'crossing' } })
        ]);

        const editor = iD.uiEntityEditor(context)
            .state('select')
            .entityIDs(['n1']);

        editor(selection);

        expect(editor.presets()[0].id).toBe('point');

        context.history().merge([
            new iD.osmWay({ id: 'w1', nodes: ['n1', 'n2'] })
        ]);

        expect(editor.presets()[0].id).toBe('vertex_only');
    });

    it('moves a tag to a new key only on the features which have the old key', async () => {
        iD.fileFetcher.cache().preset_presets = {
            'cafe': { tags: { amenity: 'cafe' }, geometry: ['point'], fields: ['name'], name: 'Cafe' }
        };
        iD.fileFetcher.cache().preset_fields = {
            'name': { key: 'name', type: 'localized', label: 'Name' }
        };
        iD.fileFetcher.cache().languages = {
            de: { nativeName: 'Deutsch' },
            en: { nativeName: 'English' }
        };
        iD.fileFetcher.cache().territory_languages = {};
        await iD.presetManager.ensureLoaded(true);
        const container = d3_select(document.createElement('div'));
        const selection = container.append('div');
        const context = iD.coreContext().assetPath('../dist/').init().container(container);

        context.history().merge([
            new iD.osmNode({ id: 'n1', loc: [0, 0], tags: { amenity: 'cafe', 'name:de': 'Foo' } }),
            new iD.osmNode({ id: 'n2', loc: [0, 0], tags: { amenity: 'cafe', 'name:en': 'Bar' } })
        ]);

        const editor = iD.uiEntityEditor(context)
            .state('select')
            .entityIDs(['n1', 'n2']);

        editor(selection);
        await setTimeout(20);

        // change the language of the `name:de` row to English - #11337
        const langInput = selection.selectAll('.localized-multilingual .entry')
            .filter(d => d.lang === 'de')
            .select('.localized-lang');
        expect(langInput.size()).toBe(1);
        iD.utilGetSetValue(langInput, 'English');
        langInput.node().dispatchEvent(new Event('change'));

        expect(context.entity('n1').tags).toEqual({ amenity: 'cafe', 'name:en': 'Foo' });
        // n2 never had `name:de`, so its existing `name:en` must be left alone
        expect(context.entity('n2').tags).toEqual({ amenity: 'cafe', 'name:en': 'Bar' });
    });
});
