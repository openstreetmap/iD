describe('iD.operationDisconnect', function () {
    let graph;

    const fakeContext = {
        graph: () => graph,
        entity: (id) => graph.entity(id),
        hasHiddenConnections: () => false,
        map: () => ({
            extent: () => iD.geoExtent([-180, -90], [180, 90])
        }),
        inIntro: () => false,
        connection: () => undefined,
        perform: (action) => graph = action(graph),
        validator: () => ({ validate: () => {} })
    };

    beforeEach(function () {
        // a --- b --- c    e --- f    g
        //       |
        //       d
        graph = new iD.coreGraph([
            new iD.osmNode({ id: 'a', loc: [0, 0] }),
            new iD.osmNode({ id: 'b', loc: [1, 0] }),
            new iD.osmNode({ id: 'c', loc: [2, 0] }),
            new iD.osmNode({ id: 'd', loc: [1, 1] }),
            new iD.osmNode({ id: 'e', loc: [3, 0] }),
            new iD.osmNode({ id: 'f', loc: [4, 0] }),
            new iD.osmNode({ id: 'g', loc: [5, 0] }),
            new iD.osmWay({ id: 'w1', nodes: ['a', 'b', 'c'] }),
            new iD.osmWay({ id: 'w2', nodes: ['d', 'b'] }),
            new iD.osmWay({ id: 'w3', nodes: ['e', 'f'] })
        ]);
    });

    it('disconnects connected nodes in a node-only multiselection', function () {
        const operation = iD.operationDisconnect(fakeContext, ['b', 'e', 'g']);

        expect(operation.available()).toBeTruthy();
        expect(operation.disabled()).toBeFalsy();
        operation();

        const w1 = graph.entity('w1');
        const w2 = graph.entity('w2');
        expect(w1.nodes.filter(nodeID => w2.nodes.includes(nodeID))).toEqual([]);
        expect(graph.entity('w3').nodes).toEqual(['e', 'f']);
        expect(graph.entity('g').loc).toEqual([5, 0]);
    });

    it('does not partially disconnect a mixed node and way selection', function () {
        const operation = iD.operationDisconnect(fakeContext, ['b', 'e', 'w1']);

        expect(operation.available()).toBeTruthy();
        expect(operation.disabled()).toEqual('not_connected');
    });

    it('keeps other disable reasons for a node-only multiselection', function () {
        graph = graph.replace(new iD.osmRelation({
            id: 'r',
            members: [{ id: 'w1' }, { id: 'w2' }]
        }));

        const operation = iD.operationDisconnect(fakeContext, ['b', 'e']);

        expect(operation.available()).toBeTruthy();
        expect(operation.disabled()).toEqual('relation');
    });
});
