describe("iD.svg.Lines", function () {
    var surface,
        projection = Object,
        filter = d3.functor(true),
        dimensions = [10, 10];

    beforeEach(function () {
        surface = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'svg'))
            .call(iD.svg.Surface());
    });

    it("adds way and area classes", function () {
        var a = iD.Node({loc: [0, 0]}),
            b = iD.Node({loc: [1, 1]}),
            line = iD.Way({nodes: [a.id, b.id]}),
            graph = iD.Graph([a, b, line]);

        surface.call(iD.svg.Lines(projection), graph, [line], filter, dimensions);

        expect(surface.select('path')).to.be.classed('way');
        expect(surface.select('path')).to.be.classed('line');
    });

    it("adds tag classes", function () {
        var a = iD.Node({loc: [0, 0]}),
            b = iD.Node({loc: [1, 1]}),
            line = iD.Way({nodes: [a.id, b.id], tags: {highway: 'residential'}}),
            graph = iD.Graph([a, b, line]);

        surface.call(iD.svg.Lines(projection), graph, [line], filter, dimensions);

        expect(surface.select('.line')).to.be.classed('tag-highway');
        expect(surface.select('.line')).to.be.classed('tag-highway-residential');
    });

    it("adds member classes", function () {
        var a = iD.Node({loc: [0, 0]}),
            b = iD.Node({loc: [1, 1]}),
            line = iD.Way({nodes: [a.id, b.id]}),
            relation = iD.Relation({members: [{id: line.id}], tags: {type: 'route'}}),
            graph = iD.Graph([a, b, line, relation]);

        surface.call(iD.svg.Lines(projection), graph, [line], filter, dimensions);

        expect(surface.select('.line')).to.be.classed('member');
        expect(surface.select('.line')).to.be.classed('member-type-route');
    });

    it("adds stroke classes for the tags of the parent relation of multipolygon members", function() {
        var a = iD.Node({loc: [0, 0]}),
            b = iD.Node({loc: [1, 1]}),
            line = iD.Way({nodes: [a.id, b.id]}),
            relation = iD.Relation({members: [{id: line.id}], tags: {type: 'multipolygon', natural: 'wood'}}),
            graph = iD.Graph([a, b, line, relation]);

        surface.call(iD.svg.Lines(projection), graph, [line], filter, dimensions);

        expect(surface.select('.stroke')).to.be.classed('tag-natural-wood');
    });

    it("preserves non-line paths", function () {
        var line = iD.Way(),
            graph = iD.Graph([line]);

        surface.select('.layer-fill')
            .append('path')
            .attr('class', 'other');

        surface.call(iD.svg.Lines(projection), graph, [line], filter, dimensions);

        expect(surface.selectAll('.other')[0].length).to.equal(1);
    });
});
