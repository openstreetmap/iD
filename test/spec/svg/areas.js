describe('iD.svg.Areas', function () {
    var surface,
        projection = d3.geoProjection(function(x, y) { return [x, y]; })
            .clipExtent([[0, 0], [Infinity, Infinity]]),
        all = d3.functor(true),
        none = d3.functor(false);

    beforeEach(function () {
        surface = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'svg'))
            .call(iD.svg.Layers(projection, iD.Context(window)));
    });

    it('adds way and area classes', function () {
        var graph = iD.Graph([
                iD.Node({id: 'a', loc: [0, 0]}),
                iD.Node({id: 'b', loc: [1, 0]}),
                iD.Node({id: 'c', loc: [1, 1]}),
                iD.Node({id: 'd', loc: [0, 1]}),
                iD.Way({id: 'w', tags: {building: 'yes'}, nodes: ['a', 'b', 'c', 'a']})
            ]);

        surface.call(iD.svg.Areas(projection), graph, [graph.entity('w')], none);

        expect(surface.select('path.way')).to.be.classed('way');
        expect(surface.select('path.area')).to.be.classed('area');
    });

    it('adds tag classes', function () {
        var graph = iD.Graph([
                iD.Node({id: 'a', loc: [0, 0]}),
                iD.Node({id: 'b', loc: [1, 0]}),
                iD.Node({id: 'c', loc: [1, 1]}),
                iD.Node({id: 'd', loc: [0, 1]}),
                iD.Way({id: 'w', tags: {building: 'yes'}, nodes: ['a', 'b', 'c', 'a']})
            ]);

        surface.call(iD.svg.Areas(projection), graph, [graph.entity('w')], none);

        expect(surface.select('.area')).to.be.classed('tag-building');
        expect(surface.select('.area')).to.be.classed('tag-building-yes');
    });

    it('handles deletion of a way and a member vertex (#1903)', function () {
        var graph = iD.Graph([
                iD.Node({id: 'a', loc: [0, 0]}),
                iD.Node({id: 'b', loc: [1, 0]}),
                iD.Node({id: 'c', loc: [1, 1]}),
                iD.Node({id: 'd', loc: [1, 1]}),
                iD.Way({id: 'w', tags: {area: 'yes'}, nodes: ['a', 'b', 'c', 'a']}),
                iD.Way({id: 'x', tags: {area: 'yes'}, nodes: ['a', 'b', 'd', 'a']})
            ]);

        surface.call(iD.svg.Areas(projection), graph, [graph.entity('x')], all);
        graph = graph.remove(graph.entity('x')).remove(graph.entity('d'));

        surface.call(iD.svg.Areas(projection), graph, [graph.entity('w')], all);
        expect(surface.select('.area').size()).to.equal(1);
    });

    describe('z-indexing', function() {
        var graph = iD.Graph([
                iD.Node({id: 'a', loc: [-0.0002,  0.0001]}),
                iD.Node({id: 'b', loc: [ 0.0002,  0.0001]}),
                iD.Node({id: 'c', loc: [ 0.0002, -0.0001]}),
                iD.Node({id: 'd', loc: [-0.0002, -0.0001]}),
                iD.Node({id: 'e', loc: [-0.0004,  0.0002]}),
                iD.Node({id: 'f', loc: [ 0.0004,  0.0002]}),
                iD.Node({id: 'g', loc: [ 0.0004, -0.0002]}),
                iD.Node({id: 'h', loc: [-0.0004, -0.0002]}),
                iD.Way({id: 's', tags: {building: 'yes'}, nodes: ['a', 'b', 'c', 'd', 'a']}),
                iD.Way({id: 'l', tags: {landuse: 'park'}, nodes: ['e', 'f', 'g', 'h', 'e']})
            ]);

        it('stacks smaller areas above larger ones in a single render', function () {
            surface.call(iD.svg.Areas(projection), graph, [graph.entity('s'), graph.entity('l')], none);

            expect(surface.select('.area:nth-child(1)')).to.be.classed('tag-landuse-park');
            expect(surface.select('.area:nth-child(2)')).to.be.classed('tag-building-yes');
        });

        it('stacks smaller areas above larger ones in a single render (reverse)', function () {
            surface.call(iD.svg.Areas(projection), graph, [graph.entity('l'), graph.entity('s')], none);

            expect(surface.select('.area:nth-child(1)')).to.be.classed('tag-landuse-park');
            expect(surface.select('.area:nth-child(2)')).to.be.classed('tag-building-yes');
        });

        it('stacks smaller areas above larger ones in separate renders', function () {
            surface.call(iD.svg.Areas(projection), graph, [graph.entity('s')], none);
            surface.call(iD.svg.Areas(projection), graph, [graph.entity('l')], none);

            expect(surface.select('.area:nth-child(1)')).to.be.classed('tag-landuse-park');
            expect(surface.select('.area:nth-child(2)')).to.be.classed('tag-building-yes');
        });

        it('stacks smaller areas above larger ones in separate renders (reverse)', function () {
            surface.call(iD.svg.Areas(projection), graph, [graph.entity('l')], none);
            surface.call(iD.svg.Areas(projection), graph, [graph.entity('s')], none);

            expect(surface.select('.area:nth-child(1)')).to.be.classed('tag-landuse-park');
            expect(surface.select('.area:nth-child(2)')).to.be.classed('tag-building-yes');
        });
    });

    it('renders fills for multipolygon areas', function () {
        var a = iD.Node({loc: [1, 1]}),
            b = iD.Node({loc: [2, 2]}),
            c = iD.Node({loc: [3, 3]}),
            w = iD.Way({nodes: [a.id, b.id, c.id, a.id]}),
            r = iD.Relation({tags: {type: 'multipolygon'}, members: [{id: w.id, type: 'way'}]}),
            graph = iD.Graph([a, b, c, w, r]),
            areas = [w, r];

        surface.call(iD.svg.Areas(projection), graph, areas, none);

        expect(surface.select('.fill')).to.be.classed('relation');
    });

    it('renders no strokes for multipolygon areas', function () {
        var a = iD.Node({loc: [1, 1]}),
            b = iD.Node({loc: [2, 2]}),
            c = iD.Node({loc: [3, 3]}),
            w = iD.Way({nodes: [a.id, b.id, c.id, a.id]}),
            r = iD.Relation({tags: {type: 'multipolygon'}, members: [{id: w.id, type: 'way'}]}),
            graph = iD.Graph([a, b, c, w, r]),
            areas = [w, r];

        surface.call(iD.svg.Areas(projection), graph, areas, none);

        expect(surface.selectAll('.stroke')[0].length).to.equal(0);
    });

    it('renders fill for a multipolygon with tags on the outer way', function() {
        var a = iD.Node({loc: [1, 1]}),
            b = iD.Node({loc: [2, 2]}),
            c = iD.Node({loc: [3, 3]}),
            w = iD.Way({tags: {natural: 'wood'}, nodes: [a.id, b.id, c.id, a.id]}),
            r = iD.Relation({members: [{id: w.id, type: 'way'}], tags: {type: 'multipolygon'}}),
            graph = iD.Graph([a, b, c, w, r]);

        surface.call(iD.svg.Areas(projection), graph, [w, r], none);

        expect(surface.selectAll('.way.fill')[0].length).to.equal(0);
        expect(surface.selectAll('.relation.fill')[0].length).to.equal(1);
        expect(surface.select('.relation.fill')).to.be.classed('tag-natural-wood');
    });

    it('renders no strokes for a multipolygon with tags on the outer way', function() {
        var a = iD.Node({loc: [1, 1]}),
            b = iD.Node({loc: [2, 2]}),
            c = iD.Node({loc: [3, 3]}),
            w = iD.Way({tags: {natural: 'wood'}, nodes: [a.id, b.id, c.id, a.id]}),
            r = iD.Relation({members: [{id: w.id, type: 'way'}], tags: {type: 'multipolygon'}}),
            graph = iD.Graph([a, b, c, w, r]);

        surface.call(iD.svg.Areas(projection), graph, [w, r], none);

        expect(surface.selectAll('.stroke')[0].length).to.equal(0);
    });
});
