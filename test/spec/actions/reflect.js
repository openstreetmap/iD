describe('iD.actionReflect', function() {
    var projection = d3.geoMercator();

    it('does not create or remove nodes', function () {
        var graph = iD.coreGraph([
                iD.osmNode({id: 'a', loc: [0, 0]}),
                iD.osmNode({id: 'b', loc: [4, 0]}),
                iD.osmNode({id: 'c', loc: [4, 2]}),
                iD.osmNode({id: 'd', loc: [1, 2]}),
                iD.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
            ]);
        graph = iD.actionReflect(['-'], projection)(graph);
        expect(graph.entity('-').nodes).to.have.length(5);
    });


    it('reflects across long axis', function () {
        //
        //    d -- c      a ---- b
        //   /     |  ->   \     |
        //  a ---- b        d -- c
        //
        var graph = iD.coreGraph([
                iD.osmNode({id: 'a', loc: [0, 0]}),
                iD.osmNode({id: 'b', loc: [4, 0]}),
                iD.osmNode({id: 'c', loc: [4, 2]}),
                iD.osmNode({id: 'd', loc: [1, 2]}),
                iD.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
            ]);
        graph = iD.actionReflect(['-'], projection)(graph);
        expect(graph.entity('a').loc[0]).to.be.closeTo(0, 1e-6);
        expect(graph.entity('a').loc[1]).to.be.closeTo(2, 1e-6);
        expect(graph.entity('b').loc[0]).to.be.closeTo(4, 1e-6);
        expect(graph.entity('b').loc[1]).to.be.closeTo(2, 1e-6);
        expect(graph.entity('c').loc[0]).to.be.closeTo(4, 1e-6);
        expect(graph.entity('c').loc[1]).to.be.closeTo(0, 1e-6);
        expect(graph.entity('d').loc[0]).to.be.closeTo(1, 1e-6);
        expect(graph.entity('d').loc[1]).to.be.closeTo(0, 1e-6);
    });


    it('reflects across short axis', function () {
        //
        //    d -- c      c -- d
        //   /     |  ->  |     \
        //  a ---- b      b ---- a
        //
        var graph = iD.coreGraph([
                iD.osmNode({id: 'a', loc: [0, 0]}),
                iD.osmNode({id: 'b', loc: [4, 0]}),
                iD.osmNode({id: 'c', loc: [4, 2]}),
                iD.osmNode({id: 'd', loc: [1, 2]}),
                iD.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
            ]);
        graph = iD.actionReflect(['-'], projection).useLongAxis(false)(graph);
        expect(graph.entity('a').loc[0]).to.be.closeTo(4, 1e-6);
        expect(graph.entity('a').loc[1]).to.be.closeTo(0, 1e-6);
        expect(graph.entity('b').loc[0]).to.be.closeTo(0, 1e-6);
        expect(graph.entity('b').loc[1]).to.be.closeTo(0, 1e-6);
        expect(graph.entity('c').loc[0]).to.be.closeTo(0, 1e-6);
        expect(graph.entity('c').loc[1]).to.be.closeTo(2, 1e-6);
        expect(graph.entity('d').loc[0]).to.be.closeTo(3, 1e-6);
        expect(graph.entity('d').loc[1]).to.be.closeTo(2, 1e-6);
    });


    describe('transitions', function () {
        it('is transitionable', function() {
            expect(iD.actionReflect().transitionable).to.be.true;
        });

        it('reflect long at t = 0', function() {
            var graph = iD.coreGraph([
                    iD.osmNode({id: 'a', loc: [0, 0]}),
                    iD.osmNode({id: 'b', loc: [4, 0]}),
                    iD.osmNode({id: 'c', loc: [4, 2]}),
                    iD.osmNode({id: 'd', loc: [1, 2]}),
                    iD.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
                ]);
            graph = iD.actionReflect(['-'], projection)(graph, 0);
            expect(graph.entity('a').loc[0]).to.be.closeTo(0, 1e-6);
            expect(graph.entity('a').loc[1]).to.be.closeTo(0, 1e-6);
            expect(graph.entity('b').loc[0]).to.be.closeTo(4, 1e-6);
            expect(graph.entity('b').loc[1]).to.be.closeTo(0, 1e-6);
            expect(graph.entity('c').loc[0]).to.be.closeTo(4, 1e-6);
            expect(graph.entity('c').loc[1]).to.be.closeTo(2, 1e-6);
            expect(graph.entity('d').loc[0]).to.be.closeTo(1, 1e-6);
            expect(graph.entity('d').loc[1]).to.be.closeTo(2, 1e-6);
        });

        it('reflect long at t = 0.5', function() {
            var graph = iD.coreGraph([
                    iD.osmNode({id: 'a', loc: [0, 0]}),
                    iD.osmNode({id: 'b', loc: [4, 0]}),
                    iD.osmNode({id: 'c', loc: [4, 2]}),
                    iD.osmNode({id: 'd', loc: [1, 2]}),
                    iD.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
                ]);
            graph = iD.actionReflect(['-'], projection)(graph, 0.5);
            expect(graph.entity('a').loc[0]).to.be.closeTo(0, 1e-6);
            expect(graph.entity('a').loc[1]).to.be.closeTo(1, 1e-6);
            expect(graph.entity('b').loc[0]).to.be.closeTo(4, 1e-6);
            expect(graph.entity('b').loc[1]).to.be.closeTo(1, 1e-6);
            expect(graph.entity('c').loc[0]).to.be.closeTo(4, 1e-6);
            expect(graph.entity('c').loc[1]).to.be.closeTo(1, 1e-6);
            expect(graph.entity('d').loc[0]).to.be.closeTo(1, 1e-6);
            expect(graph.entity('d').loc[1]).to.be.closeTo(1, 1e-6);
        });

        it('reflect long at t = 1', function() {
            var graph = iD.coreGraph([
                    iD.osmNode({id: 'a', loc: [0, 0]}),
                    iD.osmNode({id: 'b', loc: [4, 0]}),
                    iD.osmNode({id: 'c', loc: [4, 2]}),
                    iD.osmNode({id: 'd', loc: [1, 2]}),
                    iD.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
                ]);
            graph = iD.actionReflect(['-'], projection)(graph, 1);
            expect(graph.entity('a').loc[0]).to.be.closeTo(0, 1e-6);
            expect(graph.entity('a').loc[1]).to.be.closeTo(2, 1e-6);
            expect(graph.entity('b').loc[0]).to.be.closeTo(4, 1e-6);
            expect(graph.entity('b').loc[1]).to.be.closeTo(2, 1e-6);
            expect(graph.entity('c').loc[0]).to.be.closeTo(4, 1e-6);
            expect(graph.entity('c').loc[1]).to.be.closeTo(0, 1e-6);
            expect(graph.entity('d').loc[0]).to.be.closeTo(1, 1e-6);
            expect(graph.entity('d').loc[1]).to.be.closeTo(0, 1e-6);
        });

        it('reflect short at t = 0', function() {
            var graph = iD.coreGraph([
                    iD.osmNode({id: 'a', loc: [0, 0]}),
                    iD.osmNode({id: 'b', loc: [4, 0]}),
                    iD.osmNode({id: 'c', loc: [4, 2]}),
                    iD.osmNode({id: 'd', loc: [1, 2]}),
                    iD.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
                ]);
            graph = iD.actionReflect(['-'], projection).useLongAxis(false)(graph, 0);
            expect(graph.entity('a').loc[0]).to.be.closeTo(0, 1e-6);
            expect(graph.entity('a').loc[1]).to.be.closeTo(0, 1e-6);
            expect(graph.entity('b').loc[0]).to.be.closeTo(4, 1e-6);
            expect(graph.entity('b').loc[1]).to.be.closeTo(0, 1e-6);
            expect(graph.entity('c').loc[0]).to.be.closeTo(4, 1e-6);
            expect(graph.entity('c').loc[1]).to.be.closeTo(2, 1e-6);
            expect(graph.entity('d').loc[0]).to.be.closeTo(1, 1e-6);
            expect(graph.entity('d').loc[1]).to.be.closeTo(2, 1e-6);
        });

        it('reflect short at t = 0.5', function() {
            var graph = iD.coreGraph([
                    iD.osmNode({id: 'a', loc: [0, 0]}),
                    iD.osmNode({id: 'b', loc: [4, 0]}),
                    iD.osmNode({id: 'c', loc: [4, 2]}),
                    iD.osmNode({id: 'd', loc: [1, 2]}),
                    iD.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
                ]);
            graph = iD.actionReflect(['-'], projection).useLongAxis(false)(graph, 0.5);
            expect(graph.entity('a').loc[0]).to.be.closeTo(2, 1e-6);
            expect(graph.entity('a').loc[1]).to.be.closeTo(0, 1e-6);
            expect(graph.entity('b').loc[0]).to.be.closeTo(2, 1e-6);
            expect(graph.entity('b').loc[1]).to.be.closeTo(0, 1e-6);
            expect(graph.entity('c').loc[0]).to.be.closeTo(2, 1e-6);
            expect(graph.entity('c').loc[1]).to.be.closeTo(2, 1e-6);
            expect(graph.entity('d').loc[0]).to.be.closeTo(2, 1e-6);
            expect(graph.entity('d').loc[1]).to.be.closeTo(2, 1e-6);
        });

        it('reflect short at t = 1', function() {
            var graph = iD.coreGraph([
                    iD.osmNode({id: 'a', loc: [0, 0]}),
                    iD.osmNode({id: 'b', loc: [4, 0]}),
                    iD.osmNode({id: 'c', loc: [4, 2]}),
                    iD.osmNode({id: 'd', loc: [1, 2]}),
                    iD.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
                ]);
            graph = iD.actionReflect(['-'], projection).useLongAxis(false)(graph, 1);
            expect(graph.entity('a').loc[0]).to.be.closeTo(4, 1e-6);
            expect(graph.entity('a').loc[1]).to.be.closeTo(0, 1e-6);
            expect(graph.entity('b').loc[0]).to.be.closeTo(0, 1e-6);
            expect(graph.entity('b').loc[1]).to.be.closeTo(0, 1e-6);
            expect(graph.entity('c').loc[0]).to.be.closeTo(0, 1e-6);
            expect(graph.entity('c').loc[1]).to.be.closeTo(2, 1e-6);
            expect(graph.entity('d').loc[0]).to.be.closeTo(3, 1e-6);
            expect(graph.entity('d').loc[1]).to.be.closeTo(2, 1e-6);
        });

    });
});
