describe('iD.actions.Circularize', function () {
    var projection = d3.geoMercator();

    function isCircular(id, graph) {
        var points = _.map(graph.childNodes(graph.entity(id)), 'loc').map(projection),
            centroid = d3.geom.polygon(points).centroid(),
            radius = iD.geo.euclideanDistance(centroid, points[0]),
            estArea = Math.PI * radius * radius,
            trueArea = Math.abs(d3.geom.polygon(points).area()),
            pctDiff = (estArea - trueArea) / estArea;

        return (pctDiff < 0.025);   // within 2.5% of circular area..
    }

    it('creates nodes if necessary', function () {
        //    d ---- c
        //    |      |
        //    a ---- b
        var graph = iD.Graph([
                iD.Node({id: 'a', loc: [0, 0]}),
                iD.Node({id: 'b', loc: [2, 0]}),
                iD.Node({id: 'c', loc: [2, 2]}),
                iD.Node({id: 'd', loc: [0, 2]}),
                iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
            ]);

        graph = iD.actions.Circularize('-', projection)(graph);

        expect(isCircular('-', graph)).to.be.ok;
        expect(graph.entity('-').nodes).to.have.length(20);
    });

    it('reuses existing nodes', function () {
        //    d,e -- c
        //    |      |
        //    a ---- b
        var graph = iD.Graph([
                iD.Node({id: 'a', loc: [0, 0]}),
                iD.Node({id: 'b', loc: [2, 0]}),
                iD.Node({id: 'c', loc: [2, 2]}),
                iD.Node({id: 'd', loc: [0, 2]}),
                iD.Node({id: 'e', loc: [0, 2]}),
                iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd', 'e', 'a']})
            ]),
            nodes;

        graph = iD.actions.Circularize('-', projection)(graph);

        expect(isCircular('-', graph)).to.be.ok;

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
        var graph = iD.Graph([
                iD.Node({id: 'a', loc: [2, 2]}),
                iD.Node({id: 'b', loc: [-2, 2]}),
                iD.Node({id: 'c', loc: [-2, -2]}),
                iD.Node({id: 'd', loc: [2, -2]}),
                iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']}),
                iD.Way({id: '=', nodes: ['d']})
            ]);

        graph = iD.actions.Circularize('-', projection)(graph);

        expect(isCircular('-', graph)).to.be.ok;
        expect(iD.geo.euclideanDistance(graph.entity('d').loc, [2, -2])).to.be.lt(0.5);
    });

    function angle(point1, point2, center) {
        var vector1 = [point1[0] - center[0], point1[1] - center[1]],
            vector2 = [point2[0] - center[0], point2[1] - center[1]],
            distance;

        distance = iD.geo.euclideanDistance(vector1, [0, 0]);
        vector1 = [vector1[0] / distance, vector1[1] / distance];

        distance = iD.geo.euclideanDistance(vector2, [0, 0]);
        vector2 = [vector2[0] / distance, vector2[1] / distance];

        return 180 / Math.PI * Math.acos(vector1[0] * vector2[0] + vector1[1] * vector2[1]);
    }

    it('creates circle respecting min-angle limit', function() {
        //    d ---- c
        //    |      |
        //    a ---- b
        var graph = iD.Graph([
                iD.Node({id: 'a', loc: [0, 0]}),
                iD.Node({id: 'b', loc: [2, 0]}),
                iD.Node({id: 'c', loc: [2, 2]}),
                iD.Node({id: 'd', loc: [0, 2]}),
                iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
            ]),
            centroid, points;

        graph = iD.actions.Circularize('-', projection, 20)(graph);

        expect(isCircular('-', graph)).to.be.ok;
        points = _.map(graph.childNodes(graph.entity('-')), 'loc').map(projection);
        centroid = d3.geom.polygon(points).centroid();

        for (var i = 0; i < points.length - 1; i++) {
            expect(angle(points[i], points[i+1], centroid)).to.be.lte(20);
        }

        expect(angle(points[points.length - 1], points[0], centroid)).to.be.lte(20);
    });

    function area(id, graph) {
        return d3.geom.polygon(_.map(graph.childNodes(graph.entity(id)), 'loc')).area();
    }

    it('leaves clockwise ways clockwise', function () {
        //    d ---- c
        //    |      |
        //    a ---- b
        var graph = iD.Graph([
                iD.Node({id: 'a', loc: [0, 0]}),
                iD.Node({id: 'b', loc: [2, 0]}),
                iD.Node({id: 'c', loc: [2, 2]}),
                iD.Node({id: 'd', loc: [0, 2]}),
                iD.Way({id: '+', nodes: ['a', 'd', 'c', 'b', 'a']})
            ]);

        expect(area('+', graph)).to.be.gt(0);

        graph = iD.actions.Circularize('+', projection)(graph);

        expect(isCircular('+', graph)).to.be.ok;
        expect(area('+', graph)).to.be.gt(0);
    });

    it('leaves counter-clockwise ways counter-clockwise', function () {
        //    d ---- c
        //    |      |
        //    a ---- b
        var graph = iD.Graph([
                iD.Node({id: 'a', loc: [0, 0]}),
                iD.Node({id: 'b', loc: [2, 0]}),
                iD.Node({id: 'c', loc: [2, 2]}),
                iD.Node({id: 'd', loc: [0, 2]}),
                iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
            ]);

        expect(area('-', graph)).to.be.lt(0);

        graph = iD.actions.Circularize('-', projection)(graph);

        expect(isCircular('-', graph)).to.be.ok;
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
        var graph = iD.Graph([
                iD.Node({id: 'a', loc: [ 0,  0]}),
                iD.Node({id: 'b', loc: [ 1,  2]}),
                iD.Node({id: 'c', loc: [-2,  2]}),
                iD.Node({id: 'd', loc: [-2, -2]}),
                iD.Node({id: 'e', loc: [ 1, -2]}),
                iD.Node({id: 'f', loc: [ 3,  2]}),
                iD.Node({id: 'g', loc: [ 3, -2]}),
                iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd', 'e', 'a']}),
                iD.Way({id: '=', nodes: ['a', 'b', 'f', 'g', 'e', 'a']})
            ]);

        expect(_.intersection(graph.entity('-').nodes, graph.entity('=').nodes).length).to.eql(3);
        expect(graph.entity('-').isConvex(graph)).to.be.false;
        expect(graph.entity('=').isConvex(graph)).to.be.true;

        graph = iD.actions.Circularize('-', projection)(graph);

        expect(isCircular('-', graph)).to.be.ok;
        expect(_.intersection(graph.entity('-').nodes, graph.entity('=').nodes).length).to.be.gt(3);
        expect(graph.entity('-').isConvex(graph)).to.be.true;
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
        var graph = iD.Graph([
                iD.Node({id: 'a', loc: [ 0,  0]}),
                iD.Node({id: 'b', loc: [ 1,  2]}),
                iD.Node({id: 'c', loc: [-2,  2]}),
                iD.Node({id: 'd', loc: [-2, -2]}),
                iD.Node({id: 'e', loc: [ 1, -2]}),
                iD.Node({id: 'f', loc: [ 3,  2]}),
                iD.Node({id: 'g', loc: [ 3, -2]}),
                iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd', 'e', 'a']}),
                iD.Way({id: '=', nodes: ['a', 'e', 'g', 'f', 'b', 'a']})
            ]);

        expect(_.intersection(graph.entity('-').nodes, graph.entity('=').nodes).length).to.eql(3);
        expect(graph.entity('-').isConvex(graph)).to.be.false;
        expect(graph.entity('=').isConvex(graph)).to.be.true;

        graph = iD.actions.Circularize('-', projection)(graph);

        expect(isCircular('-', graph)).to.be.ok;
        expect(_.intersection(graph.entity('-').nodes, graph.entity('=').nodes).length).to.be.gt(3);
        expect(graph.entity('-').isConvex(graph)).to.be.true;
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
        var graph = iD.Graph([
                iD.Node({id: 'a', loc: [ 0,  0]}),
                iD.Node({id: 'b', loc: [10,  2]}),
                iD.Node({id: 'c', loc: [-2,  2]}),
                iD.Node({id: 'd', loc: [-2, -2]}),
                iD.Node({id: 'e', loc: [10, -2]}),
                iD.Node({id: 'f', loc: [15,  2]}),
                iD.Node({id: 'g', loc: [15, -2]}),
                iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd', 'e', 'a']}),
                iD.Way({id: '=', nodes: ['a', 'b', 'f', 'g', 'e', 'a']})
            ]);

        expect(graph.entity('-').isConvex(graph)).to.be.false;

        graph = iD.actions.Circularize('-', projection)(graph);

        expect(isCircular('-', graph)).to.be.ok;
        expect(graph.entity('-').isConvex(graph)).to.be.true;
        expect(graph.entity('-').nodes).to.have.length(20);
    });

    it('circularizes a closed single line way', function () {
        var graph = iD.Graph([
                iD.Node({id: 'a', loc: [0, 0]}),
                iD.Node({id: 'b', loc: [0, 2]}),
                iD.Way({id: '-', nodes: ['a', 'b', 'a']})
            ]);

        expect(area('-', graph)).to.eql(0);

        graph = iD.actions.Circularize('-', projection)(graph);

        expect(isCircular('-', graph)).to.be.ok;
    });

});
