describe('iD.operationRotate', () => {
    let graph: iD.Graph;

    const fakeContext = {
        graph: () => graph,
        map: () => ({
            extent: () => iD.geoExtent()
        }),
        inIntro: () => false,
        connection: () => null,
        hasHiddenConnections: () => false,
        entity: (id: iD.OsmEntity['id']) => graph.entity(id),
        enter: () => {}
    };

    beforeEach(() => {
        const cached: any = iD.fileFetcher.cache();
        cached.preset_fields = {
            direction: { key: 'direction', type: 'number' },
            'camera/direction': { key: 'camera:direction', type: 'number' },
            direction_relative: { key: 'direction', type: 'combo' }
        };
        cached.preset_presets = {
            'Surveillance Camera': {
                tags: { 'man_made': 'surveillance' },
                geometry: ['point', 'vertex'],
                fields: ['camera/direction']
            },
            Bench: {
                tags: { amenity: 'bench' },
                geometry: ['point', 'vertex'],
                fields: ['direction']
            },
            'Give Way Sign': {
                tags: { highway: 'give_way' },
                geometry: ['point', 'vertex'],
                fields: ['direction_relative']
            }
        };
    });

    it('is available for points with numeric direction tags', () => {
        const node = new iD.osmNode({ id: 'n1', tags: { direction: '45' } });
        graph = new iD.coreGraph().replace(node);

        expect(iD.operationRotate(fakeContext, [node.id]).available()).toBeTruthy();
    });

    it('is available for points with numeric camera:direction tags', () => {
        const node = new iD.osmNode({ id: 'n1', tags: { 'camera:direction': '90' } });
        graph = new iD.coreGraph().replace(node);

        expect(iD.operationRotate(fakeContext, [node.id]).available()).toBeTruthy();
    });

    it('is available for vertices with numeric direction tags', () => {
        const node = new iD.osmNode({ id: 'n1', loc: [0, 0], tags: { direction: '45' } });
        const node2 = new iD.osmNode({ id: 'n2', loc: [1, 0] });
        const way = new iD.osmWay({ id: 'w1', nodes: [node.id, node2.id] });
        graph = new iD.coreGraph()
            .replace(node)
            .replace(node2)
            .replace(way);

        expect(iD.operationRotate(fakeContext, [node.id]).available()).toBeTruthy();
    });

    it('is available when the tag is absent but the preset has a numeric direction field', async () => {
        await (iD.presetManager as any).ensureLoaded(true);
        const node = new iD.osmNode({ id: 'n1', tags: { amenity: 'bench' } });
        graph = new iD.coreGraph().replace(node);

        expect(iD.operationRotate(fakeContext, [node.id]).available()).toBeTruthy();
    });

    it('is not available for points with non-numeric direction tags', async () => {
        await (iD.presetManager as any).ensureLoaded(true);
        const node = new iD.osmNode({ id: 'n1', tags: { highway: 'give_way', direction: 'forward' } });
        graph = new iD.coreGraph().replace(node);

        expect(iD.operationRotate(fakeContext, [node.id]).available()).toBeFalsy();
    });

    it('is available for multi-node geometries', () => {
        const node1 = new iD.osmNode({ id: 'n1', loc: [0, 0] });
        const node2 = new iD.osmNode({ id: 'n2', loc: [1, 0] });
        const way = new iD.osmWay({ id: 'w1', nodes: [node1.id, node2.id] });
        graph = new iD.coreGraph()
            .replace(node1)
            .replace(node2)
            .replace(way);

        expect(iD.operationRotate(fakeContext, [way.id]).available()).toBeTruthy();
    });
});
