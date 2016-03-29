describe("iD.svg.Points", function () {
    var surface,
        projection = Object,
        context;

    beforeEach(function () {
        context = iD().presets(iD.data.presets);
        surface = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'svg'))
            .call(iD.svg.Layers(context));
    });

    it("adds tag classes", function () {
        var point = iD.Node({tags: {amenity: "cafe"}, loc: [0, 0]}),
            graph = iD.Graph([point]);

        surface.call(iD.svg.Points(projection, context), graph, [point]);

        expect(surface.select('.point')).to.be.classed('tag-amenity');
        expect(surface.select('.point')).to.be.classed('tag-amenity-cafe');
    });
});
