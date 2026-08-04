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

    it('is available for points with numeric direction tags', () => {
        const node = new iD.osmNode({ id: 'n1', tags: { direction: '45' } });
        graph = new iD.coreGraph().replace(node);

        expect(iD.operationRotate(fakeContext, [node.id]).available()).toBeTruthy();
    });

    it('is not available for points with non-numeric direction tags', () => {
        const node = new iD.osmNode({ id: 'n1', tags: { direction: 'forward' } });
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
