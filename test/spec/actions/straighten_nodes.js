describe('iD.actionStraightenNodes', function () {
    var projection = function (l) { return l; };
    projection.invert = projection;

    it('straightens points', function() {
        var graph = iD.coreGraph([
            iD.osmNode({ id: 'a', loc: [0, -1] }),
            iD.osmNode({ id: 'b', loc: [5, 1], tags: { foo: 'bar' } }),
            iD.osmNode({ id: 'c', loc: [10, -1] }),  // untagged
            iD.osmNode({ id: 'd', loc: [15, 1] })
        ]);

        graph = iD.actionStraightenNodes(['a','b','c','d'], projection)(graph);
        expect(graph.entity('a').loc[0]).to.be.closeTo(0, 1e-6);
        expect(graph.entity('a').loc[1]).to.be.closeTo(0, 1e-6);
        expect(graph.entity('b').loc[0]).to.be.closeTo(5, 1e-6);
        expect(graph.entity('b').loc[1]).to.be.closeTo(0, 1e-6);
        expect(graph.entity('c').loc[0]).to.be.closeTo(10, 1e-6);  // doesn't delete untagged
        expect(graph.entity('c').loc[1]).to.be.closeTo(0, 1e-6);   // doesn't delete untagged
        expect(graph.entity('d').loc[0]).to.be.closeTo(15, 1e-6);
        expect(graph.entity('d').loc[1]).to.be.closeTo(0, 1e-6);
    });


    describe('transitions', function () {
        it('is transitionable', function() {
            expect(iD.actionStraightenNodes().transitionable).to.be.true;
        });

        it('straighten at t = 0', function() {
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'a', loc: [0, -1] }),
                iD.osmNode({ id: 'b', loc: [5, 1], tags: { foo: 'bar' } }),
                iD.osmNode({ id: 'c', loc: [10, -1] }),  // untagged
                iD.osmNode({ id: 'd', loc: [15, 1] })
            ]);

            graph = iD.actionStraightenNodes(['a','b','c','d'], projection)(graph, 0);
            expect(graph.entity('a').loc[0]).to.be.closeTo(0, 1e-6);
            expect(graph.entity('a').loc[1]).to.be.closeTo(-1, 1e-6);
            expect(graph.entity('b').loc[0]).to.be.closeTo(5, 1e-6);
            expect(graph.entity('b').loc[1]).to.be.closeTo(1, 1e-6);
            expect(graph.entity('c').loc[0]).to.be.closeTo(10, 1e-6);   // doesn't delete untagged
            expect(graph.entity('c').loc[1]).to.be.closeTo(-1, 1e-6);   // doesn't delete untagged
            expect(graph.entity('d').loc[0]).to.be.closeTo(15, 1e-6);
            expect(graph.entity('d').loc[1]).to.be.closeTo(1, 1e-6);
        });

        it('straighten at t = 0.5', function() {
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'a', loc: [0, -1] }),
                iD.osmNode({ id: 'b', loc: [5, 1], tags: { foo: 'bar' } }),
                iD.osmNode({ id: 'c', loc: [10, -1] }),  // untagged
                iD.osmNode({ id: 'd', loc: [15, 1] })
            ]);

            graph = iD.actionStraightenNodes(['a','b','c','d'], projection)(graph, 0.5);
            expect(graph.entity('a').loc[0]).to.be.closeTo(0, 1e-6);
            expect(graph.entity('a').loc[1]).to.be.closeTo(-0.5, 1e-6);
            expect(graph.entity('b').loc[0]).to.be.closeTo(5, 1e-6);
            expect(graph.entity('b').loc[1]).to.be.closeTo(0.5, 1e-6);
            expect(graph.entity('c').loc[0]).to.be.closeTo(10, 1e-6);   // doesn't delete untagged
            expect(graph.entity('c').loc[1]).to.be.closeTo(-0.5, 1e-6);   // doesn't delete untagged
            expect(graph.entity('d').loc[0]).to.be.closeTo(15, 1e-6);
            expect(graph.entity('d').loc[1]).to.be.closeTo(0.5, 1e-6);
        });

        it('straighten at t = 1', function() {
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'a', loc: [0, -1] }),
                iD.osmNode({ id: 'b', loc: [5, 1], tags: { foo: 'bar' } }),
                iD.osmNode({ id: 'c', loc: [10, -1] }),  // untagged
                iD.osmNode({ id: 'd', loc: [15, 1] })
            ]);

            graph = iD.actionStraightenNodes(['a','b','c','d'], projection)(graph, 1);
            expect(graph.entity('a').loc[0]).to.be.closeTo(0, 1e-6);
            expect(graph.entity('a').loc[1]).to.be.closeTo(0, 1e-6);
            expect(graph.entity('b').loc[0]).to.be.closeTo(5, 1e-6);
            expect(graph.entity('b').loc[1]).to.be.closeTo(0, 1e-6);
            expect(graph.entity('c').loc[0]).to.be.closeTo(10, 1e-6);   // doesn't delete untagged
            expect(graph.entity('c').loc[1]).to.be.closeTo(0, 1e-6);   // doesn't delete untagged
            expect(graph.entity('d').loc[0]).to.be.closeTo(15, 1e-6);
            expect(graph.entity('d').loc[1]).to.be.closeTo(0, 1e-6);
        });
    });

});
