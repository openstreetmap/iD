describe("iD.svg.Midpoints", function () {
    var surface,
        projection = Object,
        filter = d3.functor(true);

    beforeEach(function () {
        surface = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'svg'))
            .call(iD.svg.Surface());
    });

    it("finds the location of the midpoints", function () {
        var a = iD.Node({loc: [0, 0]}),
            b = iD.Node({loc: [50, 0]}),
            line = iD.Way({nodes: [a.id, b.id]}),
            graph = iD.Graph([a, b, line]);

        // If no vertices are drawn, no midpoints are drawn. This dependence needs to be removed
        surface.call(iD.svg.Vertices(projection), graph, [a], filter);
        surface.call(iD.svg.Midpoints(projection), graph, [line], filter);

        expect(surface.select('.midpoint').datum().loc).to.eql([25, 0]);
    });

    it("doesn't create midpoints on segments with pixel length less than 40", function () {
        var a = iD.Node({loc: [0, 0]}),
            b = iD.Node({loc: [39, 0]}),
            line = iD.Way({nodes: [a.id, b.id]}),
            graph = iD.Graph([a, b, line]);

        surface.call(iD.svg.Midpoints(projection), graph, [line], filter);

        expect(surface.selectAll('.midpoint')[0]).to.have.length(0);
    });

    it("binds a datum whose 'ways' property lists ways which include the segement", function () {
        var a = iD.Node({loc: [0, 0]}),
            b = iD.Node({loc: [50, 0]}),
            c = iD.Node({loc: [1, 1]}),
            d = iD.Node({loc: [2, 2]}),
            l1 = iD.Way({nodes: [a.id, b.id]}),
            l2 = iD.Way({nodes: [b.id, a.id]}),
            l3 = iD.Way({nodes: [c.id, a.id, b.id, d.id]}),
            l4 = iD.Way({nodes: [a.id, d.id, b.id]}),
            graph = iD.Graph([a, b, c, d, l1, l2, l3, l4]),
            ab = function (d) { return d.id === [a.id, b.id].sort().join("-"); };

        // If no vertices are drawn, no midpoints are drawn. This dependence needs to be removed
        surface.call(iD.svg.Vertices(projection), graph, [a], filter);
        surface.call(iD.svg.Midpoints(projection), graph, [l1, l2, l3, l4], filter);

        expect(surface.selectAll('.midpoint').filter(ab).datum().ways).to.eql([
            {id: l1.id, index: 1},
            {id: l2.id, index: 1},
            {id: l3.id, index: 2}]);
    });
});
