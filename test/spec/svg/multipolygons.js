describe("iD.svg.Multipolygons", function () {
    var surface,
        projection = Object,
        filter = d3.functor(true);

    beforeEach(function () {
        surface = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'svg'))
            .call(iD.svg.Surface());
    });

    it("adds relation and multipolygon classes", function () {
        var relation = iD.Relation({tags: {type: 'multipolygon'}}),
            graph = iD.Graph([relation]);

        surface.call(iD.svg.Multipolygons(projection), graph, [relation], filter);

        expect(surface.select('path')).to.be.classed('relation');
        expect(surface.select('path')).to.be.classed('multipolygon');
    });

    it("adds tag classes", function () {
        var relation = iD.Relation({tags: {type: 'multipolygon', boundary: "administrative"}}),
            graph = iD.Graph([relation]);

        surface.call(iD.svg.Multipolygons(projection), graph, [relation], filter);

        expect(surface.select('.relation')).to.be.classed('tag-boundary');
        expect(surface.select('.relation')).to.be.classed('tag-boundary-administrative');
    });

    it("preserves non-multipolygon paths", function () {
        var relation = iD.Relation({tags: {type: 'multipolygon'}}),
            graph = iD.Graph([relation]);

        surface.select('.layer-fill')
            .append('path')
            .attr('class', 'other');

        surface.call(iD.svg.Multipolygons(projection), graph, [relation], filter);

        expect(surface.selectAll('.other')[0].length).to.equal(1);
    });
});
