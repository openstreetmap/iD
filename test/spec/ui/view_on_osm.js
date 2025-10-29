describe('iD.uiViewOnOSM.findLastModifiedChild', () => {
    it('can recurse through relations and ways', () => {
        const graph = iD.coreGraph([
            iD.osmNode({ id: 'n1', loc: [0, 0], timestamp: 2024 }),
            iD.osmNode({ id: 'n2', loc: [0, 0], timestamp: 2025 }),
            iD.osmNode({ id: 'n3', loc: [0, 0], timestamp: 2024 }),
            iD.osmWay({ id: 'w1', nodes: ['n1', 'n2', 'n3'], timestamp: 2018 }),
            iD.osmRelation({ id: 'r1', members: [{ id: 'w1', type: 'way', role: '' }], timestamp: 2023 }),
            iD.osmRelation({ id: 'r2', members: [{ id: 'r1', type: 'relation', role: '' }], timestamp: 2023 }),
        ]);
        expect(iD.uiViewOnOSM.findLastModifiedChild(graph, graph.entity('r2'))).toStrictEqual(graph.entity('n2'));
    });
});
