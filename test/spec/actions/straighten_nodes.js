describe('iD.actionStraightenNodes', function () {
    var projection = function (l) { return l; };
    projection.invert = projection;

    it('straightens points', function() {
        var graph = new iD.coreGraph([
            new iD.osmNode({ id: 'a', loc: [0, -1] }),
            new iD.osmNode({ id: 'b', loc: [5, 1], tags: { foo: 'bar' } }),
            new iD.osmNode({ id: 'c', loc: [10, -1] }),  // untagged
            new iD.osmNode({ id: 'd', loc: [15, 1] })
        ]);

        graph = iD.actionStraightenNodes(['a','b','c','d'], projection)(graph);
        expect(graph.entity('a').loc[0]).toBeCloseTo(0, 6);
        expect(graph.entity('a').loc[1]).toBeCloseTo(0, 6);
        expect(graph.entity('b').loc[0]).toBeCloseTo(5, 6);
        expect(graph.entity('b').loc[1]).toBeCloseTo(0, 6);
        expect(graph.entity('c').loc[0]).toBeCloseTo(10, 6);  // doesn't delete untagged
        expect(graph.entity('c').loc[1]).toBeCloseTo(0, 6);   // doesn't delete untagged
        expect(graph.entity('d').loc[0]).toBeCloseTo(15, 6);
        expect(graph.entity('d').loc[1]).toBeCloseTo(0, 6);
    });


    describe('transitions', function () {
        it('is transitionable', function() {
            expect(iD.actionStraightenNodes().transitionable).toBe(true);
        });

        it('straighten at t = 0', function() {
            var graph = new iD.coreGraph([
                new iD.osmNode({ id: 'a', loc: [0, -1] }),
                new iD.osmNode({ id: 'b', loc: [5, 1], tags: { foo: 'bar' } }),
                new iD.osmNode({ id: 'c', loc: [10, -1] }),  // untagged
                new iD.osmNode({ id: 'd', loc: [15, 1] })
            ]);

            graph = iD.actionStraightenNodes(['a','b','c','d'], projection)(graph, 0);
            expect(graph.entity('a').loc[0]).toBeCloseTo(0, 6);
            expect(graph.entity('a').loc[1]).toBeCloseTo(-1, 6);
            expect(graph.entity('b').loc[0]).toBeCloseTo(5, 6);
            expect(graph.entity('b').loc[1]).toBeCloseTo(1, 6);
            expect(graph.entity('c').loc[0]).toBeCloseTo(10, 6);   // doesn't delete untagged
            expect(graph.entity('c').loc[1]).toBeCloseTo(-1, 6);   // doesn't delete untagged
            expect(graph.entity('d').loc[0]).toBeCloseTo(15, 6);
            expect(graph.entity('d').loc[1]).toBeCloseTo(1, 6);
        });

        it('straighten at t = 0.5', function() {
            var graph = new iD.coreGraph([
                new iD.osmNode({ id: 'a', loc: [0, -1] }),
                new iD.osmNode({ id: 'b', loc: [5, 1], tags: { foo: 'bar' } }),
                new iD.osmNode({ id: 'c', loc: [10, -1] }),  // untagged
                new iD.osmNode({ id: 'd', loc: [15, 1] })
            ]);

            graph = iD.actionStraightenNodes(['a','b','c','d'], projection)(graph, 0.5);
            expect(graph.entity('a').loc[0]).toBeCloseTo(0, 6);
            expect(graph.entity('a').loc[1]).toBeCloseTo(-0.5, 6);
            expect(graph.entity('b').loc[0]).toBeCloseTo(5, 6);
            expect(graph.entity('b').loc[1]).toBeCloseTo(0.5, 6);
            expect(graph.entity('c').loc[0]).toBeCloseTo(10, 6);   // doesn't delete untagged
            expect(graph.entity('c').loc[1]).toBeCloseTo(-0.5, 6);   // doesn't delete untagged
            expect(graph.entity('d').loc[0]).toBeCloseTo(15, 6);
            expect(graph.entity('d').loc[1]).toBeCloseTo(0.5, 6);
        });

        it('straighten at t = 1', function() {
            var graph = new iD.coreGraph([
                new iD.osmNode({ id: 'a', loc: [0, -1] }),
                new iD.osmNode({ id: 'b', loc: [5, 1], tags: { foo: 'bar' } }),
                new iD.osmNode({ id: 'c', loc: [10, -1] }),  // untagged
                new iD.osmNode({ id: 'd', loc: [15, 1] })
            ]);

            graph = iD.actionStraightenNodes(['a','b','c','d'], projection)(graph, 1);
            expect(graph.entity('a').loc[0]).toBeCloseTo(0, 6);
            expect(graph.entity('a').loc[1]).toBeCloseTo(0, 6);
            expect(graph.entity('b').loc[0]).toBeCloseTo(5, 6);
            expect(graph.entity('b').loc[1]).toBeCloseTo(0, 6);
            expect(graph.entity('c').loc[0]).toBeCloseTo(10, 6);   // doesn't delete untagged
            expect(graph.entity('c').loc[1]).toBeCloseTo(0, 6);   // doesn't delete untagged
            expect(graph.entity('d').loc[0]).toBeCloseTo(15, 6);
            expect(graph.entity('d').loc[1]).toBeCloseTo(0, 6);
        });
    });

});
