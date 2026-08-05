describe('iD.utilDirectionFieldKey / iD.utilRotatePointDirectionKey', () => {
    beforeEach(() => {
        const cached: any = iD.fileFetcher.cache();
        cached.preset_fields = {
            direction: { key: 'direction', type: 'number' },
            'camera/direction': { key: 'camera:direction', type: 'number' },
            direction_relative: { key: 'direction', type: 'combo' }
        };
        cached.preset_presets = {
            Bench: {
                tags: { amenity: 'bench' },
                geometry: ['point', 'vertex'],
                fields: ['direction']
            },
            'Surveillance Camera': {
                tags: { 'man_made': 'surveillance' },
                geometry: ['point', 'vertex'],
                fields: ['camera/direction']
            },
            'Give Way Sign': {
                tags: { highway: 'give_way' },
                geometry: ['point', 'vertex'],
                fields: ['direction_relative']
            }
        };
    });

    it('recognizes direction and *:direction keys', () => {
        expect(iD.utilIsDirectionKey('direction')).toBeTruthy();
        expect(iD.utilIsDirectionKey('camera:direction')).toBeTruthy();
        expect(iD.utilIsDirectionKey('highway')).toBeFalsy();
        expect(iD.utilIsDirectionKey(undefined)).toBeFalsy();
    });

    it('finds a numeric direction field on the preset', async () => {
        await (iD.presetManager as any).ensureLoaded(true);
        const node = new iD.osmNode({ tags: { amenity: 'bench' } });
        const graph = new iD.coreGraph().replace(node);

        expect(iD.utilDirectionFieldKey(node, graph, true)).toEqual('direction');
        expect(iD.utilDirectionFieldKey(node, graph, false)).toBeFalsy();
    });

    it('finds a relative direction field on the preset', async () => {
        await (iD.presetManager as any).ensureLoaded(true);
        const node = new iD.osmNode({ tags: { highway: 'give_way' } });
        const graph = new iD.coreGraph().replace(node);

        expect(iD.utilDirectionFieldKey(node, graph, false)).toEqual('direction');
        expect(iD.utilDirectionFieldKey(node, graph, true)).toBeFalsy();
    });

    it('prefers an existing prefixed numeric direction tag', async () => {
        await (iD.presetManager as any).ensureLoaded(true);
        const node = new iD.osmNode({
            tags: { 'man_made': 'surveillance', 'camera:direction': '45', direction: '10' }
        });
        const graph = new iD.coreGraph().replace(node);

        expect(iD.utilRotatePointDirectionKey(node, graph)).toEqual('camera:direction');
    });

    it('falls back to a numeric preset field when the tag is absent', async () => {
        await (iD.presetManager as any).ensureLoaded(true);
        const node = new iD.osmNode({ tags: { 'man_made': 'surveillance' } });
        const graph = new iD.coreGraph().replace(node);

        expect(iD.utilRotatePointDirectionKey(node, graph)).toEqual('camera:direction');
    });

    it('resolves a selected node for point-direction rotate', async () => {
        await (iD.presetManager as any).ensureLoaded(true);
        const node = new iD.osmNode({ id: 'n1', tags: { direction: '45' } });
        const graph = new iD.coreGraph().replace(node);

        expect(iD.utilSelectedRotatePointDirectionKey([node.id], graph)).toEqual('direction');
        expect(iD.utilSelectedRotatePointDirectionKey([node.id, 'n2'], graph)).toBeFalsy();
    });

});
