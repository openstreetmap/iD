describe('iD.actionMoveNode', function () {
    it('changes a node\'s location', function () {
        var node = new iD.osmNode({id: 'a', loc: [0, 0]});
        var toLoc = [2, 3];
        var graph = new iD.coreGraph([node]);

        graph = iD.actionMoveNode('a', toLoc)(graph);
        expect(graph.entity('a').loc).toEqual(toLoc);
    });

    describe('transitions', function () {
        it('is transitionable', function() {
            expect(iD.actionMoveNode().transitionable).toBe(true);
        });

        it('move node at t = 0', function() {
            var node = new iD.osmNode({id: 'a', loc: [0, 0]});
            var toLoc = [2, 3];
            var graph = new iD.coreGraph([node]);

            graph = iD.actionMoveNode('a', toLoc)(graph, 0);
            expect(graph.entity('a').loc[0]).toBeCloseTo(0, 6);
            expect(graph.entity('a').loc[1]).toBeCloseTo(0, 6);
        });

        it('move node at t = 0.5', function() {
            var node = new iD.osmNode({id: 'a', loc: [0, 0]});
            var toLoc = [2, 3];
            var graph = new iD.coreGraph([node]);

            graph = iD.actionMoveNode('a', toLoc)(graph, 0.5);
            expect(graph.entity('a').loc[0]).toBeCloseTo(1, 6);
            expect(graph.entity('a').loc[1]).toBeCloseTo(1.5, 6);
        });

        it('move node at t = 1', function() {
            var node = new iD.osmNode({id: 'a', loc: [0, 0]});
            var toLoc = [2, 3];
            var graph = new iD.coreGraph([node]);

            graph = iD.actionMoveNode('a', toLoc)(graph, 1);
            expect(graph.entity('a').loc[0]).toBeCloseTo(2, 6);
            expect(graph.entity('a').loc[1]).toBeCloseTo(3, 6);
        });
    });
});
