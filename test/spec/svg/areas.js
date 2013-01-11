describe("iD.svg.Areas", function () {
    var surface,
        projection = d3.geo.mercator(),
        filter = d3.functor(true);

    beforeEach(function () {
        surface = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));

        surface.append('g')
            .attr('class', 'layer-fill');
    });

    it("adds tag classes", function () {
        var area = iD.Way({tags: {area: 'yes', building: 'yes'}}),
            graph = iD.Graph([area]);

        surface.call(iD.svg.Areas(), graph, [area], filter, projection);

        expect(surface.select('.area')).to.be.classed('tag-building');
        expect(surface.select('.area')).to.be.classed('tag-building-yes');
    });
});
