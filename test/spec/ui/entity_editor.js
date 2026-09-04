import { select as d3_select } from 'd3-selection';

describe('iD.uiEntityEditor', function () {
    beforeEach(function () {
        iD.fileFetcher.cache().preset_presets = {
            'vertex_only': { tags: { highway: 'crossing' }, geometry: ['vertex'], name: 'Crossing' },
        };
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
});
