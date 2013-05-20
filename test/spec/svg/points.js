describe("iD.svg.Points", function () {
    var surface,
        projection = Object,
        context;

    beforeEach(function () {
        context = iD();
        surface = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'svg'))
            .call(iD.svg.Surface(context));
    });

    it("adds tag classes", function () {
        var point = iD.Node({tags: {amenity: "cafe"}, loc: [0, 0]});

        surface.call(iD.svg.Points(projection, context), [point]);

        expect(surface.select('.point')).to.be.classed('tag-amenity');
        expect(surface.select('.point')).to.be.classed('tag-amenity-cafe');
    });
});
