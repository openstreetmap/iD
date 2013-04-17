describe("iD.svg.Points", function () {
    var surface,
        projection = Object,
        filter = d3.functor(true),
        context;

    beforeEach(function () {
        context = iD();
        surface = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'svg'))
            .call(iD.svg.Surface(iD()));
    });

    it("adds tag classes", function () {
        var node = iD.Node({tags: {amenity: "cafe"}, loc: [0, 0], _poi: true}),
            graph = iD.Graph([node]);

        surface.call(iD.svg.Points(projection, context), graph, [node], filter);

        expect(surface.select('.point')).to.be.classed('tag-amenity');
        expect(surface.select('.point')).to.be.classed('tag-amenity-cafe');
    });
});
