describe("iD.svg.Lines", function () {
    var surface,
        projection = Object,
        filter = d3.functor(true);

    beforeEach(function () {
        surface = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'svg'))
            .call(iD.svg.Surface());
    });

    it("adds way and area classes", function () {
        var line = iD.Way(),
            graph = iD.Graph([line]);

        surface.call(iD.svg.Lines(projection), graph, [line], filter);

        expect(surface.select('path')).to.be.classed('way');
        expect(surface.select('path')).to.be.classed('line');
    });

    it("adds tag classes", function () {
        var line = iD.Way({tags: {highway: 'residential'}}),
            graph = iD.Graph([line]);

        surface.call(iD.svg.Lines(projection), graph, [line], filter);

        expect(surface.select('.line')).to.be.classed('tag-highway');
        expect(surface.select('.line')).to.be.classed('tag-highway-residential');
    });

    it("adds member classes", function () {
        var line = iD.Way(),
            relation = iD.Relation({members: [{id: line.id}], tags: {type: 'route'}}),
            graph = iD.Graph([line, relation]);

        surface.call(iD.svg.Lines(projection), graph, [line], filter);

        expect(surface.select('.line')).to.be.classed('member');
        expect(surface.select('.line')).to.be.classed('member-type-route');
    });

    it("preserves non-line paths", function () {
        var line = iD.Way(),
            graph = iD.Graph([line]);

        surface.select('.layer-fill')
            .append('path')
            .attr('class', 'other');

        surface.call(iD.svg.Lines(projection), graph, [line], filter);

        expect(surface.selectAll('.other')[0].length).to.equal(1);
    });
});
