describe("iD.svg.Vertices", function () {
    var surface,
        projection = Object,
        context;

    beforeEach(function () {
        context = iD();
        surface = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'svg'))
            .call(iD.svg.Surface(context));
    });

    it("adds tag classes", function () {
        var node = iD.Node({tags: {highway: "traffic_signals"}, loc: [0, 0]}),
            way  = iD.Way({nodes: [node.id]}),
            graph = iD.Graph([node, way]);

        surface.call(iD.svg.Vertices(projection, context), graph, [node], 17);

        expect(surface.select('.vertex')).to.be.classed('tag-highway');
        expect(surface.select('.vertex')).to.be.classed('tag-highway-traffic_signals');
    });

    it("adds the .shared class to vertices that are members of two or more ways", function () {
        var node = iD.Node({loc: [0, 0]}),
            way1 = iD.Way({nodes: [node.id]}),
            way2 = iD.Way({nodes: [node.id]}),
            graph = iD.Graph([node, way1, way2]);

        surface.call(iD.svg.Vertices(projection, context), graph, [node], 17);

        expect(surface.select('.vertex')).to.be.classed('shared');
    });
});
