describe("iD.svg.Vertices", function () {
    var surface,
        projection = d3.geo.mercator(),
        filter = d3.functor(true);

    beforeEach(function () {
        surface = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));

        surface.append('g')
            .attr('class', 'layer-hit');
    });

    it("adds tag classes", function () {
        var node = iD.Node({tags: {highway: "traffic_signals"}, loc: [0, 0]}),
            graph = iD.Graph([node]);

        surface.call(iD.svg.Vertices(), graph, [node], filter, projection);

        expect(surface.select('.vertex')).to.be.classed('tag-highway');
        expect(surface.select('.vertex')).to.be.classed('tag-highway-traffic_signals');
    });

    it("adds the .shared class to vertices that are members of two or more ways", function () {
        var node = iD.Node({loc: [0, 0]}),
            way1 = iD.Way({nodes: [node.id]}),
            way2 = iD.Way({nodes: [node.id]}),
            graph = iD.Graph([node, way1, way2]);

        surface.call(iD.svg.Vertices(), graph, [node], filter, projection);

        expect(surface.select('.vertex')).to.be.classed('shared');
    });
});
