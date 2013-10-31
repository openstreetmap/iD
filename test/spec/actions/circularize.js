describe("iD.actions.Circularize", function () {
    var projection = d3.geo.mercator();

    it("creates nodes if necessary", function () {
        var graph = iD.Graph([
                iD.Node({id: 'a', loc: [0, 0]}),
                iD.Node({id: 'b', loc: [2, 0]}),
                iD.Node({id: 'c', loc: [2, 2]}),
                iD.Node({id: 'd', loc: [0, 2]}),
                iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
            ]);

        graph = iD.actions.Circularize('-', projection)(graph);

        expect(graph.entity('-').nodes).to.have.length(20);
    });

    it("reuses existing nodes", function () {
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

        nodes = graph.entity('-').nodes;
        expect(nodes.indexOf('a')).to.be.gte(0);
        expect(nodes.indexOf('b')).to.be.gte(0);
        expect(nodes.indexOf('c')).to.be.gte(0);
        expect(nodes.indexOf('d')).to.be.gte(0);
        expect(nodes.indexOf('e')).to.be.gte(0);
    });

    it("limits movement of nodes that are members of other ways", function () {
        var graph = iD.Graph([
                iD.Node({id: 'a', loc: [2, 2]}),
                iD.Node({id: 'b', loc: [-2, 2]}),
                iD.Node({id: 'c', loc: [-2, -2]}),
                iD.Node({id: 'd', loc: [2, -2]}),
                iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']}),
                iD.Way({id: '=', nodes: ['d']})
            ]);

        graph = iD.actions.Circularize('-', projection)(graph);

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

    it("creates circle respecting min-angle limit", function() {
        var graph = iD.Graph([
                iD.Node({id: 'a', loc: [0, 0]}),
                iD.Node({id: 'b', loc: [2, 0]}),
                iD.Node({id: 'c', loc: [2, 2]}),
                iD.Node({id: 'd', loc: [0, 2]}),
                iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
            ]),
            centroid, points;

        graph = iD.actions.Circularize('-', projection, 20)(graph);
        points = _.pluck(graph.childNodes(graph.entity('-')), 'loc').map(projection);
        centroid = d3.geom.polygon(points).centroid();

        for (var i = 0; i < points.length - 1; i++) {
            expect(angle(points[i], points[i+1], centroid)).to.be.lte(20);
        }

        expect(angle(points[points.length - 1], points[0], centroid)).to.be.lte(20);
    });

    function area(id, graph) {
        return d3.geom.polygon(_.pluck(graph.childNodes(graph.entity(id)), 'loc')).area();
    }

    it("leaves clockwise ways clockwise", function () {
        var graph = iD.Graph([
                iD.Node({id: 'a', loc: [0, 0]}),
                iD.Node({id: 'b', loc: [2, 0]}),
                iD.Node({id: 'c', loc: [2, 2]}),
                iD.Node({id: 'd', loc: [0, 2]}),
                iD.Way({id: '+', nodes: ['a', 'd', 'c', 'b', 'a']})
            ]);

        expect(area('+', graph)).to.be.gt(0);

        graph = iD.actions.Circularize('+', projection)(graph);

        expect(area('+', graph)).to.be.gt(0);
    });

    it("leaves counter-clockwise ways counter-clockwise", function () {
        var graph = iD.Graph([
                iD.Node({id: 'a', loc: [0, 0]}),
                iD.Node({id: 'b', loc: [2, 0]}),
                iD.Node({id: 'c', loc: [2, 2]}),
                iD.Node({id: 'd', loc: [0, 2]}),
                iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
            ]);

        expect(area('-', graph)).to.be.lt(0);

        graph = iD.actions.Circularize('-', projection)(graph);

        expect(area('-', graph)).to.be.lt(0);
    });
});
