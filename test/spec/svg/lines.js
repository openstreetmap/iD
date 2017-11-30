describe('iD.svgLines', function () {
    var context, surface,
        projection = d3.geoProjection(function(x, y) { return [x, -y]; })
            .translate([0, 0])
            .scale(180 / Math.PI)
            .clipExtent([[0, 0], [Infinity, Infinity]]),
        all = function() { return true; },
        none = function() { return false; };

    beforeEach(function () {
        context = iD.Context();
        d3.select(document.createElement('div'))
            .attr('id', 'map')
            .call(context.map());
        surface = context.surface();
    });


    it('adds way and line classes', function () {
        var a = iD.Node({loc: [0, 0]}),
            b = iD.Node({loc: [1, 1]}),
            line = iD.Way({nodes: [a.id, b.id]}),
            graph = iD.Graph([a, b, line]);

        surface.call(iD.svgLines(projection, context), graph, [line], all);

        expect(surface.select('path.way').classed('way')).to.be.true;
        expect(surface.select('path.line').classed('line')).to.be.true;
    });

    it('adds tag classes', function () {
        var a = iD.Node({loc: [0, 0]}),
            b = iD.Node({loc: [1, 1]}),
            line = iD.Way({nodes: [a.id, b.id], tags: {highway: 'residential'}}),
            graph = iD.Graph([a, b, line]);

        surface.call(iD.svgLines(projection, context), graph, [line], all);

        expect(surface.select('.line').classed('tag-highway')).to.be.true;
        expect(surface.select('.line').classed('tag-highway-residential')).to.be.true;
    });

    it('adds stroke classes for the tags of the parent relation of multipolygon members', function() {
        var a = iD.Node({loc: [0, 0]}),
            b = iD.Node({loc: [1, 1]}),
            line = iD.Way({nodes: [a.id, b.id]}),
            relation = iD.Relation({members: [{id: line.id}], tags: {type: 'multipolygon', natural: 'wood'}}),
            graph = iD.Graph([a, b, line, relation]);

        surface.call(iD.svgLines(projection, context), graph, [line], all);

        expect(surface.select('.stroke').classed('tag-natural-wood')).to.be.true;
    });

    it('renders stroke for outer way of multipolygon with tags on the outer way', function() {
        var a = iD.Node({loc: [1, 1]}),
            b = iD.Node({loc: [2, 2]}),
            c = iD.Node({loc: [3, 3]}),
            w = iD.Way({id: 'w-1', tags: {natural: 'wood'}, nodes: [a.id, b.id, c.id, a.id]}),
            r = iD.Relation({members: [{id: w.id}], tags: {type: 'multipolygon'}}),
            graph = iD.Graph([a, b, c, w, r]);

        surface.call(iD.svgLines(projection, context), graph, [w], all);

        expect(surface.select('.stroke.w-1').classed('tag-natural-wood')).to.equal(true, 'outer tag-natural-wood true');
        expect(surface.select('.stroke.w-1').classed('old-multipolygon')).to.equal(true, 'outer old-multipolygon true');
    });

    it('adds stroke classes for the tags of the outer way of multipolygon with tags on the outer way', function() {
        var a = iD.Node({loc: [1, 1]}),
            b = iD.Node({loc: [2, 2]}),
            c = iD.Node({loc: [3, 3]}),
            o = iD.Way({id: 'w-1', nodes: [a.id, b.id, c.id, a.id], tags: {natural: 'wood'}}),
            i = iD.Way({id: 'w-2', nodes: [a.id, b.id, c.id, a.id]}),
            r = iD.Relation({members: [{id: o.id, role: 'outer'}, {id: i.id, role: 'inner'}], tags: {type: 'multipolygon'}}),
            graph = iD.Graph([a, b, c, o, i, r]);

        surface.call(iD.svgLines(projection, context), graph, [i, o], all);

        expect(surface.select('.stroke.w-1').classed('tag-natural-wood')).to.equal(true, 'outer tag-natural-wood true');
        expect(surface.select('.stroke.w-1').classed('old-multipolygon')).to.equal(true, 'outer old-multipolygon true');
        expect(surface.select('.stroke.w-2').classed('tag-natural-wood')).to.equal(true, 'inner tag-natural-wood true');
        expect(surface.select('.stroke.w-2').classed('old-multipolygon')).to.equal(false, 'inner old-multipolygon false');
    });

    describe('z-indexing', function() {
        var graph = iD.Graph([
                iD.Node({id: 'a', loc: [0, 0]}),
                iD.Node({id: 'b', loc: [1, 1]}),
                iD.Node({id: 'c', loc: [0, 0]}),
                iD.Node({id: 'd', loc: [1, 1]}),
                iD.Way({id: 'lo', tags: {highway: 'residential', tunnel: 'yes'}, nodes: ['a', 'b']}),
                iD.Way({id: 'hi', tags: {highway: 'residential', bridge: 'yes'}, nodes: ['c', 'd']})
            ]);

        it('stacks higher lines above lower ones in a single render', function () {
            surface.call(iD.svgLines(projection, context), graph, [graph.entity('lo'), graph.entity('hi')], none);

            var selection = surface.selectAll('g.line-stroke > path.line');
            expect(selection.nodes()[0].__data__.id).to.eql('lo');
            expect(selection.nodes()[1].__data__.id).to.eql('hi');
        });

        it('stacks higher lines above lower ones in a single render (reverse)', function () {
            surface.call(iD.svgLines(projection, context), graph, [graph.entity('hi'), graph.entity('lo')], none);

            var selection = surface.selectAll('g.line-stroke > path.line');
            expect(selection.nodes()[0].__data__.id).to.eql('lo');
            expect(selection.nodes()[1].__data__.id).to.eql('hi');
        });

        it('stacks higher lines above lower ones in separate renders', function () {
            surface.call(iD.svgLines(projection, context), graph, [graph.entity('lo')], none);
            surface.call(iD.svgLines(projection, context), graph, [graph.entity('hi')], none);

            var selection = surface.selectAll('g.line-stroke > path.line');
            expect(selection.nodes()[0].__data__.id).to.eql('lo');
            expect(selection.nodes()[1].__data__.id).to.eql('hi');
        });

        it('stacks higher lines above lower in separate renders (reverse)', function () {
            surface.call(iD.svgLines(projection, context), graph, [graph.entity('hi')], none);
            surface.call(iD.svgLines(projection, context), graph, [graph.entity('lo')], none);

            var selection = surface.selectAll('g.line-stroke > path.line');
            expect(selection.nodes()[0].__data__.id).to.eql('lo');
            expect(selection.nodes()[1].__data__.id).to.eql('hi');
        });
    });

});
