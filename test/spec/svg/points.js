describe("iD.svg.Points", function () {
    var surface,
        projection = d3.geo.mercator(),
        filter = d3.functor(true);

    beforeEach(function () {
        surface = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));

        surface.append('g')
            .attr('class', 'layer-hit');
    });

    it("adds tag classes", function () {
        var node = iD.Node({tags: {amenity: "cafe"}, loc: [0, 0], _poi: true}),
            graph = iD.Graph([node]);

        surface.call(iD.svg.Points(), graph, [node], filter, projection);

        expect(surface.select('.point')).to.be.classed('tag-amenity');
        expect(surface.select('.point')).to.be.classed('tag-amenity-cafe');
    });
});
