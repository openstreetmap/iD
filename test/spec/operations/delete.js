describe('iD.operationDelete', function () {
    let graph;

    const fakeContext = {
        graph: () => graph,
        entity: (id) => graph.entity(id),
        hasEntity: (id) => graph.hasEntity(id),
        perform: (action) => graph = action(graph),
        validator: () => ({ validate: () => {} }),
        enter: () => {},
        ui: () => ({
            sidebar:{}
        }),
        container: () => d3.select()
    };

    describe('selects next node automatically', function () {
        it('selects next node after deleting first node of a way', function () {
            graph = new iD.coreGraph([
                new iD.osmNode({ id: 'n1', type: 'node' }),
                new iD.osmNode({ id: 'n2', type: 'node' }),
                new iD.osmNode({ id: 'n3', type: 'node' }),
                new iD.osmWay({ id: 'w', nodes: ['n1', 'n2', 'n3'] }),
            ]);

            const operation = iD.operationDelete(fakeContext, ['n1']);
            fakeContext.enter = vi.fn();
            operation();
            expect(fakeContext.graph().hasEntity('w')).toBeTruthy();
            expect(fakeContext.enter).to.toHaveBeenCalledOnce();
            expect(fakeContext.enter.mock.calls[0][0].selectedIDs()).to.eql(['n2']);
        });

        it('selects previous node after deleting last node of a way', function () {
            graph = new iD.coreGraph([
                new iD.osmNode({ id: 'n1', type: 'node' }),
                new iD.osmNode({ id: 'n2', type: 'node' }),
                new iD.osmNode({ id: 'n3', type: 'node' }),
                new iD.osmNode({ id: 'n4', type: 'node' }),
                new iD.osmWay({ id: 'w', nodes: ['n1', 'n2', 'n3', 'n4'] }),
            ]);

            const operation = iD.operationDelete(fakeContext, ['n4']);
            fakeContext.enter = vi.fn();
            operation();
            expect(fakeContext.graph().hasEntity('w')).toBeTruthy();
            expect(fakeContext.enter).to.toHaveBeenCalledOnce();
            expect(fakeContext.enter.mock.calls[0][0].selectedIDs()).to.eql(['n3']);
        });

        it('selects nearest node after deleting a middle node of a way', function () {
            graph = new iD.coreGraph([
                new iD.osmNode({ id: 'n1', type: 'node', loc: [0, 0] }),
                new iD.osmNode({ id: 'n2', type: 'node', loc: [1, 0] }),
                new iD.osmNode({ id: 'n3', type: 'node', loc: [3, 0] }),
                new iD.osmWay({ id: 'w', nodes: ['n1', 'n2', 'n3'] }),
            ]);

            const operation = iD.operationDelete(fakeContext, ['n2']);
            fakeContext.enter = vi.fn();
            operation();
            expect(fakeContext.graph().hasEntity('w')).toBeTruthy();
            expect(fakeContext.enter).to.toHaveBeenCalledOnce();
            expect(fakeContext.enter.mock.calls[0][0].selectedIDs()).to.eql(['n1']);
        });

        it('does not crash for a single-noded way', function () {
            // https://github.com/openstreetmap/iD/issues/9007
            graph = new iD.coreGraph([
                new iD.osmNode({ id: 'n', type: 'node' }),
                new iD.osmWay({ id: 'w', nodes: ['n'] }),
            ]);

            const operation = iD.operationDelete(fakeContext, ['n']);
            operation();
            expect(fakeContext.graph().hasEntity('w')).toBeFalsy();
        });
    });
});
