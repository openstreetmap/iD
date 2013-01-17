describe("iD.svg.Areas", function () {
    var surface,
        projection = Object,
        filter = d3.functor(true);

    beforeEach(function () {
        surface = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'svg'))
            .call(iD.svg.Surface());
    });

    it("adds way and area classes", function () {
        var area = iD.Way({tags: {area: 'yes'}}),
            graph = iD.Graph([area]);

        surface.call(iD.svg.Areas(projection), graph, [area], filter);

        expect(surface.select('path')).to.be.classed('way');
        expect(surface.select('path')).to.be.classed('area');
    });

    it("adds tag classes", function () {
        var area = iD.Way({tags: {area: 'yes', building: 'yes'}}),
            graph = iD.Graph([area]);

        surface.call(iD.svg.Areas(projection), graph, [area], filter);

        expect(surface.select('.area')).to.be.classed('tag-building');
        expect(surface.select('.area')).to.be.classed('tag-building-yes');
    });

    it("preserves non-area paths", function () {
        var area = iD.Way({tags: {area: 'yes'}}),
            graph = iD.Graph([area]);

        surface.select('.layer-fill')
            .append('path')
            .attr('class', 'other');

        surface.call(iD.svg.Areas(projection), graph, [area], filter);

        expect(surface.selectAll('.other')[0].length).to.equal(1);
    });
});
