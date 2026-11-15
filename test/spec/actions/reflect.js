import { geoMercator as d3_geoMercator } from 'd3-geo';

describe('iD.actionReflect', function() {
    var projection = d3_geoMercator();

    it('does not create or remove nodes', function () {
        var graph = new iD.coreGraph([
                new iD.osmNode({id: 'a', loc: [0, 0]}),
                new iD.osmNode({id: 'b', loc: [4, 0]}),
                new iD.osmNode({id: 'c', loc: [4, 2]}),
                new iD.osmNode({id: 'd', loc: [1, 2]}),
                new iD.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
            ]);
        graph = iD.actionReflect(['-'], projection)(graph);
        expect(graph.entity('-').nodes).toHaveLength(5);
    });


    it('reflects across long axis', function () {
        //
        //    d -- c      a ---- b
        //   /     |  ->   \     |
        //  a ---- b        d -- c
        //
        var graph = new iD.coreGraph([
                new iD.osmNode({id: 'a', loc: [0, 0]}),
                new iD.osmNode({id: 'b', loc: [4, 0]}),
                new iD.osmNode({id: 'c', loc: [4, 2]}),
                new iD.osmNode({id: 'd', loc: [1, 2]}),
                new iD.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
            ]);
        graph = iD.actionReflect(['-'], projection)(graph);
        expect(graph.entity('a').loc[0]).toBeCloseTo(0, 6);
        expect(graph.entity('a').loc[1]).toBeCloseTo(2, 6);
        expect(graph.entity('b').loc[0]).toBeCloseTo(4, 6);
        expect(graph.entity('b').loc[1]).toBeCloseTo(2, 6);
        expect(graph.entity('c').loc[0]).toBeCloseTo(4, 6);
        expect(graph.entity('c').loc[1]).toBeCloseTo(0, 6);
        expect(graph.entity('d').loc[0]).toBeCloseTo(1, 6);
        expect(graph.entity('d').loc[1]).toBeCloseTo(0, 6);
    });


    it('reflects across short axis', function () {
        //
        //    d -- c      c -- d
        //   /     |  ->  |     \
        //  a ---- b      b ---- a
        //
        var graph = new iD.coreGraph([
                new iD.osmNode({id: 'a', loc: [0, 0]}),
                new iD.osmNode({id: 'b', loc: [4, 0]}),
                new iD.osmNode({id: 'c', loc: [4, 2]}),
                new iD.osmNode({id: 'd', loc: [1, 2]}),
                new iD.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
            ]);
        graph = iD.actionReflect(['-'], projection).useLongAxis(false)(graph);
        expect(graph.entity('a').loc[0]).toBeCloseTo(4, 6);
        expect(graph.entity('a').loc[1]).toBeCloseTo(0, 6);
        expect(graph.entity('b').loc[0]).toBeCloseTo(0, 6);
        expect(graph.entity('b').loc[1]).toBeCloseTo(0, 6);
        expect(graph.entity('c').loc[0]).toBeCloseTo(0, 6);
        expect(graph.entity('c').loc[1]).toBeCloseTo(2, 6);
        expect(graph.entity('d').loc[0]).toBeCloseTo(3, 6);
        expect(graph.entity('d').loc[1]).toBeCloseTo(2, 6);
    });


    describe('transitions', function () {
        it('is transitionable', function() {
            expect(iD.actionReflect().transitionable).toBe(true);
        });

        it('reflect long at t = 0', function() {
            var graph = new iD.coreGraph([
                    new iD.osmNode({id: 'a', loc: [0, 0]}),
                    new iD.osmNode({id: 'b', loc: [4, 0]}),
                    new iD.osmNode({id: 'c', loc: [4, 2]}),
                    new iD.osmNode({id: 'd', loc: [1, 2]}),
                    new iD.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
                ]);
            graph = iD.actionReflect(['-'], projection)(graph, 0);
            expect(graph.entity('a').loc[0]).toBeCloseTo(0, 6);
            expect(graph.entity('a').loc[1]).toBeCloseTo(0, 6);
            expect(graph.entity('b').loc[0]).toBeCloseTo(4, 6);
            expect(graph.entity('b').loc[1]).toBeCloseTo(0, 6);
            expect(graph.entity('c').loc[0]).toBeCloseTo(4, 6);
            expect(graph.entity('c').loc[1]).toBeCloseTo(2, 6);
            expect(graph.entity('d').loc[0]).toBeCloseTo(1, 6);
            expect(graph.entity('d').loc[1]).toBeCloseTo(2, 6);
        });

        it('reflect long at t = 0.5', function() {
            var graph = new iD.coreGraph([
                    new iD.osmNode({id: 'a', loc: [0, 0]}),
                    new iD.osmNode({id: 'b', loc: [4, 0]}),
                    new iD.osmNode({id: 'c', loc: [4, 2]}),
                    new iD.osmNode({id: 'd', loc: [1, 2]}),
                    new iD.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
                ]);
            graph = iD.actionReflect(['-'], projection)(graph, 0.5);
            expect(graph.entity('a').loc[0]).toBeCloseTo(0, 6);
            expect(graph.entity('a').loc[1]).toBeCloseTo(1, 6);
            expect(graph.entity('b').loc[0]).toBeCloseTo(4, 6);
            expect(graph.entity('b').loc[1]).toBeCloseTo(1, 6);
            expect(graph.entity('c').loc[0]).toBeCloseTo(4, 6);
            expect(graph.entity('c').loc[1]).toBeCloseTo(1, 6);
            expect(graph.entity('d').loc[0]).toBeCloseTo(1, 6);
            expect(graph.entity('d').loc[1]).toBeCloseTo(1, 6);
        });

        it('reflect long at t = 1', function() {
            var graph = new iD.coreGraph([
                    new iD.osmNode({id: 'a', loc: [0, 0]}),
                    new iD.osmNode({id: 'b', loc: [4, 0]}),
                    new iD.osmNode({id: 'c', loc: [4, 2]}),
                    new iD.osmNode({id: 'd', loc: [1, 2]}),
                    new iD.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
                ]);
            graph = iD.actionReflect(['-'], projection)(graph, 1);
            expect(graph.entity('a').loc[0]).toBeCloseTo(0, 6);
            expect(graph.entity('a').loc[1]).toBeCloseTo(2, 6);
            expect(graph.entity('b').loc[0]).toBeCloseTo(4, 6);
            expect(graph.entity('b').loc[1]).toBeCloseTo(2, 6);
            expect(graph.entity('c').loc[0]).toBeCloseTo(4, 6);
            expect(graph.entity('c').loc[1]).toBeCloseTo(0, 6);
            expect(graph.entity('d').loc[0]).toBeCloseTo(1, 6);
            expect(graph.entity('d').loc[1]).toBeCloseTo(0, 6);
        });

        it('reflect short at t = 0', function() {
            var graph = new iD.coreGraph([
                    new iD.osmNode({id: 'a', loc: [0, 0]}),
                    new iD.osmNode({id: 'b', loc: [4, 0]}),
                    new iD.osmNode({id: 'c', loc: [4, 2]}),
                    new iD.osmNode({id: 'd', loc: [1, 2]}),
                    new iD.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
                ]);
            graph = iD.actionReflect(['-'], projection).useLongAxis(false)(graph, 0);
            expect(graph.entity('a').loc[0]).toBeCloseTo(0, 6);
            expect(graph.entity('a').loc[1]).toBeCloseTo(0, 6);
            expect(graph.entity('b').loc[0]).toBeCloseTo(4, 6);
            expect(graph.entity('b').loc[1]).toBeCloseTo(0, 6);
            expect(graph.entity('c').loc[0]).toBeCloseTo(4, 6);
            expect(graph.entity('c').loc[1]).toBeCloseTo(2, 6);
            expect(graph.entity('d').loc[0]).toBeCloseTo(1, 6);
            expect(graph.entity('d').loc[1]).toBeCloseTo(2, 6);
        });

        it('reflect short at t = 0.5', function() {
            var graph = new iD.coreGraph([
                    new iD.osmNode({id: 'a', loc: [0, 0]}),
                    new iD.osmNode({id: 'b', loc: [4, 0]}),
                    new iD.osmNode({id: 'c', loc: [4, 2]}),
                    new iD.osmNode({id: 'd', loc: [1, 2]}),
                    new iD.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
                ]);
            graph = iD.actionReflect(['-'], projection).useLongAxis(false)(graph, 0.5);
            expect(graph.entity('a').loc[0]).toBeCloseTo(2, 6);
            expect(graph.entity('a').loc[1]).toBeCloseTo(0, 6);
            expect(graph.entity('b').loc[0]).toBeCloseTo(2, 6);
            expect(graph.entity('b').loc[1]).toBeCloseTo(0, 6);
            expect(graph.entity('c').loc[0]).toBeCloseTo(2, 6);
            expect(graph.entity('c').loc[1]).toBeCloseTo(2, 6);
            expect(graph.entity('d').loc[0]).toBeCloseTo(2, 6);
            expect(graph.entity('d').loc[1]).toBeCloseTo(2, 6);
        });

        it('reflect short at t = 1', function() {
            var graph = new iD.coreGraph([
                    new iD.osmNode({id: 'a', loc: [0, 0]}),
                    new iD.osmNode({id: 'b', loc: [4, 0]}),
                    new iD.osmNode({id: 'c', loc: [4, 2]}),
                    new iD.osmNode({id: 'd', loc: [1, 2]}),
                    new iD.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
                ]);
            graph = iD.actionReflect(['-'], projection).useLongAxis(false)(graph, 1);
            expect(graph.entity('a').loc[0]).toBeCloseTo(4, 6);
            expect(graph.entity('a').loc[1]).toBeCloseTo(0, 6);
            expect(graph.entity('b').loc[0]).toBeCloseTo(0, 6);
            expect(graph.entity('b').loc[1]).toBeCloseTo(0, 6);
            expect(graph.entity('c').loc[0]).toBeCloseTo(0, 6);
            expect(graph.entity('c').loc[1]).toBeCloseTo(2, 6);
            expect(graph.entity('d').loc[0]).toBeCloseTo(3, 6);
            expect(graph.entity('d').loc[1]).toBeCloseTo(2, 6);
        });

    });
});
