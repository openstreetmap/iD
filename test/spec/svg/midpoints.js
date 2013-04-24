describe("iD.svg.Midpoints", function () {
    var surface,
        projection = Object,
        filter = d3.functor(true),
        context;

    beforeEach(function () {
        context = iD();
        surface = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'svg'))
            .call(iD.svg.Surface(context));
    });

    it("finds the location of the midpoints", function () {
        var a = iD.Node({loc: [0, 0]}),
            b = iD.Node({loc: [50, 0]}),
            line = iD.Way({nodes: [a.id, b.id]}),
            graph = iD.Graph([a, b, line]),
            extent = iD.geo.Extent([0, 0], [100, 100]);

        context.selection = function() { return [line.id]; };
        surface.call(iD.svg.Midpoints(projection, context), graph, [line], filter, extent);

        expect(surface.select('.midpoint').datum().loc).to.eql([25, 0]);
    });

    it("doesn't create midpoints on segments with pixel length less than 40", function () {
        var a = iD.Node({loc: [0, 0]}),
            b = iD.Node({loc: [39, 0]}),
            line = iD.Way({nodes: [a.id, b.id]}),
            graph = iD.Graph([a, b, line]),
            extent = iD.geo.Extent([0, 0], [100, 100]);

        context.selection = function() { return [line.id]; };
        surface.call(iD.svg.Midpoints(projection, context), graph, [line], filter, extent);

        expect(surface.selectAll('.midpoint')[0]).to.have.length(0);
    });
});
