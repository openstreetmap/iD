describe('iD.operationDisconnect', function () {
    let graph;

    const fakeContext = {
        graph: () => graph,
        entity: (id) => graph.entity(id),
        hasEntity: (id) => graph.hasEntity(id),
        perform: (action) => graph = action(graph),
        validator: () => ({ validate: () => {} }),
        map: () => ({ extent: () => new iD.geoExtent([-180, -90], [180, 90]) }),
        hasHiddenConnections: () => false,
    };

    // https://github.com/openstreetmap/iD/issues/8362
    // Selecting several vertices and disconnecting them used to fail
    // entirely as soon as even one of them couldn't be disconnected
    // (e.g. because it isn't actually shared by two ways). Disconnect
    // should instead act on whichever vertices it can, and leave the
    // rest untouched.
    it('disconnects the vertices that can be disconnected and leaves the rest alone', function () {
        //   a ---- b ---- c       e ---- f ---- g
        //          |
        //          d
        // b is shared by w1 and w2, so it can be disconnected.
        // f only belongs to w3, so it can't be (actionDisconnect: 'not_connected').
        graph = new iD.coreGraph([
            new iD.osmNode({ id: 'a', loc: [0, 0] }),
            new iD.osmNode({ id: 'b', loc: [1, 0] }),
            new iD.osmNode({ id: 'c', loc: [2, 0] }),
            new iD.osmNode({ id: 'd', loc: [1, 1] }),
            new iD.osmWay({ id: 'w1', nodes: ['a', 'b', 'c'] }),
            new iD.osmWay({ id: 'w2', nodes: ['b', 'd'] }),
            new iD.osmNode({ id: 'e', loc: [3, 0] }),
            new iD.osmNode({ id: 'f', loc: [4, 0] }),
            new iD.osmNode({ id: 'g', loc: [5, 0] }),
            new iD.osmWay({ id: 'w3', nodes: ['e', 'f', 'g'] }),
        ]);

        const operation = iD.operationDisconnect(fakeContext, ['b', 'f']);

        // With both an actionable and a non-actionable vertex selected, the
        // operation as a whole must stay available/enabled.
        expect(operation.disabled()).toBeFalsy();

        operation();

        const w1 = fakeContext.graph().entity('w1');
        const w2 = fakeContext.graph().entity('w2');
        const w3 = fakeContext.graph().entity('w3');

        // b was disconnected: w1 and w2 no longer share a node.
        const shared = w1.nodes.filter((id) => w2.nodes.includes(id));
        expect(shared.length).toBe(0);

        // f could not be disconnected and was left untouched.
        expect(w3.nodes).toEqual(['e', 'f', 'g']);
    });

    it('still reports the specific disabled reason for a single undisconnectable vertex', function () {
        graph = new iD.coreGraph([
            new iD.osmNode({ id: 'e' }),
            new iD.osmNode({ id: 'f' }),
            new iD.osmNode({ id: 'g' }),
            new iD.osmWay({ id: 'w3', nodes: ['e', 'f', 'g'] }),
        ]);

        const operation = iD.operationDisconnect(fakeContext, ['f']);
        expect(operation.disabled()).toEqual('not_connected');
    });
});
