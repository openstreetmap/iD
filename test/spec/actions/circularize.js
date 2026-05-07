import { MAX_VERTICES, MIN_VERTICES } from '../../../modules/actions/circularize';

describe('iD.actionCircularize', function () {
    const projection = d3.geoMercator().scale(150);

    function isCircular(id, graph, _projection) {
        if (!_projection) _projection = projection;
        const points = graph.childNodes(graph.entity(id))
            .map(function (n) { return _projection(n.loc); });
        const centroid = d3.polygonCentroid(points);
        const radius = iD.geoVecLength(centroid, points[0]);
        const n = points.length - 1;
        const estArea = Math.pow(radius, 2) * n / 2 * Math.sin(2 * Math.PI / n); // regular n-gon area
        const trueArea = Math.abs(d3.polygonArea(points));
        const pctDiff = Math.abs(estArea - trueArea) / estArea;

        return pctDiff < 1E-3; // area within 0.1% of expected area of regular polygon with n vertices
    }

    function intersection(a, b) {
        var seen = a.reduce(function (h, k) {
            h[k] = true;
            return h;
        }, {});

        return b.filter(function (k) {
            var exists = seen[k];
            delete seen[k];
            return exists;
        });
    }

    function area(id, graph) {
        var points = graph.childNodes(graph.entity(id)).map(function (n) { return n.loc; });
        return d3.polygonArea(points);
    }


    it('creates nodes if necessary', function () {
        //    d ---- c
        //    |      |
        //    a ---- b
        var graph = new iD.coreGraph([
                new iD.osmNode({id: 'a', loc: [0, 0]}),
                new iD.osmNode({id: 'b', loc: [2, 0]}),
                new iD.osmNode({id: 'c', loc: [2, 2]}),
                new iD.osmNode({id: 'd', loc: [0, 2]}),
                new iD.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
            ]);

        graph = iD.actionCircularize('-', projection)(graph);

        expect(isCircular('-', graph)).toBeTruthy();
        expect(graph.entity('-').nodes).to.have.length(MAX_VERTICES + 1);
    });

    it('creates fewer nodes for small features', function () {
        //    d - c
        //    |   |
        //    a - b
        var graph = new iD.coreGraph([
                new iD.osmNode({id: 'a', loc: [   0,    0]}),
                new iD.osmNode({id: 'b', loc: [2e-5,    0]}),
                new iD.osmNode({id: 'c', loc: [2e-5, 2e-5]}),
                new iD.osmNode({id: 'd', loc: [   0, 2e-5]}),
                new iD.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
            ]);

        const projection = d3.geoMercator().scale(150 * 1e5);
        graph = iD.actionCircularize('-', projection)(graph);

        expect(isCircular('-', graph, projection)).toBeTruthy();
        expect(graph.entity('-').nodes).to.have.length(MIN_VERTICES + 1);
    });

    it('reuses existing nodes', function () {
        //    d,e -- c
        //    |      |
        //    a ---- b
        var graph = new iD.coreGraph([
                new iD.osmNode({id: 'a', loc: [0, 0]}),
                new iD.osmNode({id: 'b', loc: [2, 0]}),
                new iD.osmNode({id: 'c', loc: [2, 2]}),
                new iD.osmNode({id: 'd', loc: [0, 2]}),
                new iD.osmNode({id: 'e', loc: [0, 2]}),
                new iD.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'e', 'a']})
            ]),
            nodes;

        graph = iD.actionCircularize('-', projection)(graph);

        expect(isCircular('-', graph)).toBeTruthy();

        nodes = graph.entity('-').nodes;
        expect(nodes).to.contain('a');
        expect(nodes).to.contain('b');
        expect(nodes).to.contain('c');
        expect(nodes).to.contain('d');
        expect(nodes).to.contain('e');
    });

    it('limits movement of nodes that are members of other ways', function () {
        //    b ---- a
        //    |      |
        //    c ---- d
        var graph = new iD.coreGraph([
                new iD.osmNode({id: 'a', loc: [2, 2]}),
                new iD.osmNode({id: 'b', loc: [-2, 2]}),
                new iD.osmNode({id: 'c', loc: [-2, -2]}),
                new iD.osmNode({id: 'd', loc: [2, -2]}),
                new iD.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']}),
                new iD.osmWay({id: '=', nodes: ['d']})
            ]);

        graph = iD.actionCircularize('-', projection)(graph);

        expect(isCircular('-', graph)).toBeTruthy();
        expect(iD.geoVecLength(graph.entity('d').loc, [2, -2])).to.be.lt(0.5);
    });

    it('leaves clockwise ways clockwise', function () {
        //    d ---- c
        //    |      |
        //    a ---- b
        var graph = new iD.coreGraph([
                new iD.osmNode({id: 'a', loc: [0, 0]}),
                new iD.osmNode({id: 'b', loc: [2, 0]}),
                new iD.osmNode({id: 'c', loc: [2, 2]}),
                new iD.osmNode({id: 'd', loc: [0, 2]}),
                new iD.osmWay({id: '+', nodes: ['a', 'd', 'c', 'b', 'a']})
            ]);

        expect(area('+', graph)).to.be.gt(0);

        graph = iD.actionCircularize('+', projection)(graph);

        expect(isCircular('+', graph)).toBeTruthy();
        expect(area('+', graph)).to.be.gt(0);
    });

    it('leaves counter-clockwise ways counter-clockwise', function () {
        //    d ---- c
        //    |      |
        //    a ---- b
        var graph = new iD.coreGraph([
                new iD.osmNode({id: 'a', loc: [0, 0]}),
                new iD.osmNode({id: 'b', loc: [2, 0]}),
                new iD.osmNode({id: 'c', loc: [2, 2]}),
                new iD.osmNode({id: 'd', loc: [0, 2]}),
                new iD.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
            ]);

        expect(area('-', graph)).to.be.lt(0);

        graph = iD.actionCircularize('-', projection)(graph);

        expect(isCircular('-', graph)).toBeTruthy();
        expect(area('-', graph)).to.be.lt(0);
    });

    it('adds new nodes on shared way wound in opposite direction', function () {
        //    c ---- b ---- f
        //    |     /       |
        //    |    a        |
        //    |     \       |
        //    d ---- e ---- g
        //
        //  a-b-c-d-e-a is counterclockwise
        //  a-b-f-g-e-a is clockwise
        //
        var graph = new iD.coreGraph([
                new iD.osmNode({id: 'a', loc: [ 0,  0]}),
                new iD.osmNode({id: 'b', loc: [ 1,  2]}),
                new iD.osmNode({id: 'c', loc: [-2,  2]}),
                new iD.osmNode({id: 'd', loc: [-2, -2]}),
                new iD.osmNode({id: 'e', loc: [ 1, -2]}),
                new iD.osmNode({id: 'f', loc: [ 3,  2]}),
                new iD.osmNode({id: 'g', loc: [ 3, -2]}),
                new iD.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'e', 'a']}),
                new iD.osmWay({id: '=', nodes: ['a', 'b', 'f', 'g', 'e', 'a']})
            ]);

        expect(intersection(graph.entity('-').nodes, graph.entity('=').nodes).length).to.eql(3);
        expect(graph.entity('-').isConvex(graph)).to.be.false;
        expect(graph.entity('=').isConvex(graph)).toBe(true);

        graph = iD.actionCircularize('-', projection)(graph);

        expect(isCircular('-', graph)).toBeTruthy();
        expect(intersection(graph.entity('-').nodes, graph.entity('=').nodes).length).to.be.gt(3);
        expect(graph.entity('-').isConvex(graph)).toBe(true);
        expect(graph.entity('=').isConvex(graph)).to.be.false;
    });

    it('adds new nodes on shared way wound in similar direction', function () {
        //    c ---- b ---- f
        //    |     /       |
        //    |    a        |
        //    |     \       |
        //    d ---- e ---- g
        //
        //  a-b-c-d-e-a is counterclockwise
        //  a-e-g-f-b-a is counterclockwise
        //
        var graph = new iD.coreGraph([
                new iD.osmNode({id: 'a', loc: [ 0,  0]}),
                new iD.osmNode({id: 'b', loc: [ 1,  2]}),
                new iD.osmNode({id: 'c', loc: [-2,  2]}),
                new iD.osmNode({id: 'd', loc: [-2, -2]}),
                new iD.osmNode({id: 'e', loc: [ 1, -2]}),
                new iD.osmNode({id: 'f', loc: [ 3,  2]}),
                new iD.osmNode({id: 'g', loc: [ 3, -2]}),
                new iD.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'e', 'a']}),
                new iD.osmWay({id: '=', nodes: ['a', 'e', 'g', 'f', 'b', 'a']})
            ]);

        expect(intersection(graph.entity('-').nodes, graph.entity('=').nodes).length).to.eql(3);
        expect(graph.entity('-').isConvex(graph)).to.be.false;
        expect(graph.entity('=').isConvex(graph)).toBe(true);

        graph = iD.actionCircularize('-', projection)(graph);

        expect(isCircular('-', graph)).toBeTruthy();
        expect(intersection(graph.entity('-').nodes, graph.entity('=').nodes).length).to.be.gt(3);
        expect(graph.entity('-').isConvex(graph)).toBe(true);
        expect(graph.entity('=').isConvex(graph)).to.be.false;
    });

    it('circularizes extremely concave ways with a key node on the wrong side of the centroid', function () {
        //    c ------------ b -- f
        //    |       ___---      |
        //    |  a ===            |
        //    |       ---___      |
        //    d ------------ e -- g
        //
        //  a-b-c-d-e-a is extremely concave and 'a' is to the left of centoid..
        //
        var graph = new iD.coreGraph([
                new iD.osmNode({id: 'a', loc: [ 0,  0]}),
                new iD.osmNode({id: 'b', loc: [10,  2]}),
                new iD.osmNode({id: 'c', loc: [-2,  2]}),
                new iD.osmNode({id: 'd', loc: [-2, -2]}),
                new iD.osmNode({id: 'e', loc: [10, -2]}),
                new iD.osmNode({id: 'f', loc: [15,  2]}),
                new iD.osmNode({id: 'g', loc: [15, -2]}),
                new iD.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'e', 'a']}),
                new iD.osmWay({id: '=', nodes: ['a', 'b', 'f', 'g', 'e', 'a']})
            ]);

        expect(graph.entity('-').isConvex(graph)).to.be.false;

        graph = iD.actionCircularize('-', projection)(graph);

        expect(isCircular('-', graph)).toBeTruthy();
        expect(graph.entity('-').isConvex(graph)).toBe(true);
        expect(graph.entity('-').nodes).to.have.length(MAX_VERTICES + 1);
    });

    it('circularizes a closed single line way', function () {
        var graph = new iD.coreGraph([
                new iD.osmNode({id: 'a', loc: [0, 0]}),
                new iD.osmNode({id: 'b', loc: [0, 2]}),
                new iD.osmNode({id: 'c', loc: [2, 0]}),
                new iD.osmWay({id: '-', nodes: ['a', 'b', 'c', 'a']})
            ]);

        expect(area('-', graph)).to.eql(2);

        graph = iD.actionCircularize('-', projection)(graph);

        expect(isCircular('-', graph)).toBeTruthy();
    });

    it('not disable circularize when its not circular', function(){
        var graph = new iD.coreGraph([
            new iD.osmNode({id: 'a', loc: [0, 0]}),
            new iD.osmNode({id: 'b', loc: [2, 0]}),
            new iD.osmNode({id: 'c', loc: [2, 2]}),
            new iD.osmNode({id: 'd', loc: [0, 2]}),
            new iD.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
        ]);
        var result = iD.actionCircularize('-', projection).disabled(graph);
        expect(result).to.be.false;

    });

    it('disable circularize twice', function(){
        var graph = new iD.coreGraph([
            new iD.osmNode({id: 'a', loc: [0, 0]}),
            new iD.osmNode({id: 'b', loc: [2, 0]}),
            new iD.osmNode({id: 'c', loc: [2, 2]}),
            new iD.osmNode({id: 'd', loc: [0, 2]}),
            new iD.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
        ]);
        graph = iD.actionCircularize('-', projection)(graph);
        var result = iD.actionCircularize('-', projection).disabled(graph);
        expect(result).to.eql('already_circular');

    });


    describe('transitions', function () {
        it('is transitionable', function() {
            expect(iD.actionCircularize().transitionable).toBe(true);
        });

        it('circularize at t = 0', function() {
            var graph = new iD.coreGraph([
                    new iD.osmNode({id: 'a', loc: [0, 0]}),
                    new iD.osmNode({id: 'b', loc: [2, 0]}),
                    new iD.osmNode({id: 'c', loc: [2, 2]}),
                    new iD.osmNode({id: 'd', loc: [0, 2]}),
                    new iD.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
                ]);
            graph = iD.actionCircularize('-', projection)(graph, 0);
            expect(isCircular('-', graph)).toBeFalsy();
            expect(graph.entity('-').nodes).to.have.length(MAX_VERTICES + 1);
            expect(area('-', graph)).to.be.closeTo(-4, 1e-2);
        });

        it('circularize at t = 0.5', function() {
            var graph = new iD.coreGraph([
                    new iD.osmNode({id: 'a', loc: [0, 0]}),
                    new iD.osmNode({id: 'b', loc: [2, 0]}),
                    new iD.osmNode({id: 'c', loc: [2, 2]}),
                    new iD.osmNode({id: 'd', loc: [0, 2]}),
                    new iD.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
                ]);
            graph = iD.actionCircularize('-', projection)(graph, 0.5);
            expect(isCircular('-', graph)).toBeFalsy();
            expect(graph.entity('-').nodes).to.have.length(MAX_VERTICES + 1);
            expect(area('-', graph)).to.be.closeTo(-4.74, 1e-2);
        });

        it('circularize at t = 1', function() {
            var graph = new iD.coreGraph([
                    new iD.osmNode({id: 'a', loc: [0, 0]}),
                    new iD.osmNode({id: 'b', loc: [2, 0]}),
                    new iD.osmNode({id: 'c', loc: [2, 2]}),
                    new iD.osmNode({id: 'd', loc: [0, 2]}),
                    new iD.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
                ]);
            graph = iD.actionCircularize('-', projection)(graph, 1);
            expect(isCircular('-', graph)).toBeTruthy();
            expect(graph.entity('-').nodes).to.have.length(MAX_VERTICES + 1);
            expect(area('-', graph)).to.be.closeTo(-6.24, 1e-2);
        });
    });

});
