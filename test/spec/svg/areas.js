describe("iD.svg.Areas", function () {
    var surface,
        projection = Object,
        filter = d3.functor(true);

    beforeEach(function () {
        surface = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'svg'))
            .call(iD.svg.Surface(iD()));
    });

    it("adds way and area classes", function () {
        var area = iD.Way({tags: {area: 'yes'}}),
            graph = iD.Graph([area]);

        surface.call(iD.svg.Areas(projection), graph, [area], filter);

        expect(surface.select('path.way')).to.be.classed('way');
        expect(surface.select('path.area')).to.be.classed('area');
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

    it("stacks smaller areas above larger ones", function () {
        var graph = iD.Graph({
                'a': iD.Node({id: 'a', loc: [0, 0]}),
                'b': iD.Node({id: 'b', loc: [1, 0]}),
                'c': iD.Node({id: 'c', loc: [1, 1]}),
                'd': iD.Node({id: 'd', loc: [0, 1]}),
                's': iD.Way({area: true, tags: {building: 'yes'}, nodes: ['a', 'b', 'c', 'a']}),
                'l': iD.Way({area: true, tags: {landuse: 'park'}, nodes: ['a', 'b', 'c', 'd', 'a']})
            }),
            areas = [graph.entity('s'), graph.entity('l')];

        surface.call(iD.svg.Areas(projection), graph, areas, filter);

        expect(surface.select('.area:nth-child(1)')).to.be.classed('tag-landuse-park');
        expect(surface.select('.area:nth-child(2)')).to.be.classed('tag-building-yes');
    });

    it("renders fills for multipolygon areas", function () {
        var a = iD.Node({loc: [1, 1]}),
            b = iD.Node({loc: [2, 2]}),
            c = iD.Node({loc: [3, 3]}),
            w = iD.Way({nodes: [a.id, b.id, c.id, a.id]}),
            r = iD.Relation({tags: {type: 'multipolygon'}, members: [{id: w.id, type: 'way'}]}),
            graph = iD.Graph([a, b, c, w, r]),
            areas = [w, r];

        surface.call(iD.svg.Areas(projection), graph, areas, filter);

        expect(surface.select('.fill')).to.be.classed('relation');
    });

    it("renders no strokes for multipolygon areas", function () {
        var a = iD.Node({loc: [1, 1]}),
            b = iD.Node({loc: [2, 2]}),
            c = iD.Node({loc: [3, 3]}),
            w = iD.Way({nodes: [a.id, b.id, c.id, a.id]}),
            r = iD.Relation({tags: {type: 'multipolygon'}, members: [{id: w.id, type: 'way'}]}),
            graph = iD.Graph([a, b, c, w, r]),
            areas = [w, r];

        surface.call(iD.svg.Areas(projection), graph, areas, filter);

        expect(surface.selectAll('.stroke')[0].length).to.equal(0);
    });

    it("adds stroke classes for the tags of the parent relation of multipolygon members", function() {
        var a = iD.Node({loc: [1, 1]}),
            b = iD.Node({loc: [2, 2]}),
            c = iD.Node({loc: [3, 3]}),
            w = iD.Way({tags: {area: 'yes'}, nodes: [a.id, b.id, c.id, a.id]}),
            r = iD.Relation({members: [{id: w.id}], tags: {type: 'multipolygon', natural: 'wood'}}),
            graph = iD.Graph([a, b, c, w, r]);

        surface.call(iD.svg.Areas(projection), graph, [w], filter);

        expect(surface.select('.stroke')).to.be.classed('tag-natural-wood');
        expect(surface.select('.fill')).not.to.be.classed('tag-natural-wood');
    });

    it("renders fill for a multipolygon with tags on the outer way", function() {
        var a = iD.Node({loc: [1, 1]}),
            b = iD.Node({loc: [2, 2]}),
            c = iD.Node({loc: [3, 3]}),
            w = iD.Way({tags: {natural: 'wood'}, nodes: [a.id, b.id, c.id, a.id]}),
            r = iD.Relation({members: [{id: w.id}], tags: {type: 'multipolygon'}}),
            graph = iD.Graph([a, b, c, w, r]);

        surface.call(iD.svg.Areas(projection), graph, [w, r], filter);

        expect(surface.selectAll('.way.fill')[0].length).to.equal(0);
        expect(surface.selectAll('.relation.fill')[0].length).to.equal(1);
        expect(surface.select('.relation.fill')).to.be.classed('tag-natural-wood');
    });

    it("renders no strokes for a multipolygon with tags on the outer way", function() {
        var a = iD.Node({loc: [1, 1]}),
            b = iD.Node({loc: [2, 2]}),
            c = iD.Node({loc: [3, 3]}),
            w = iD.Way({tags: {natural: 'wood'}, nodes: [a.id, b.id, c.id, a.id]}),
            r = iD.Relation({members: [{id: w.id}], tags: {type: 'multipolygon'}}),
            graph = iD.Graph([a, b, c, w, r]);

        surface.call(iD.svg.Areas(projection), graph, [w, r], filter);

        expect(surface.selectAll('.stroke')[0].length).to.equal(0);
    });
});
