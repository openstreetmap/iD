describe('iD.svgLines', function () {
    var context, surface;
    var all = function() { return true; };
    var none = function() { return false; };
    var projection = d3.geoProjection(function(x, y) { return [x, -y]; })
        .translate([0, 0])
        .scale(iD.geoZoomToScale(17))
        .clipExtent([[0, 0], [Infinity, Infinity]]);


    beforeEach(function () {
        context = iD.coreContext();
        d3.select(document.createElement('div'))
            .attr('id', 'map')
            .call(context.map().centerZoom([0, 0], 17));
        surface = context.surface();
    });


    it('adds way and line classes', function () {
        var a = iD.osmNode({loc: [0, 0]});
        var b = iD.osmNode({loc: [1, 1]});
        var line = iD.osmWay({nodes: [a.id, b.id]});
        var graph = iD.coreGraph([a, b, line]);

        surface.call(iD.svgLines(projection, context), graph, [line], all);

        expect(surface.select('path.way').classed('way')).to.be.true;
        expect(surface.select('path.line').classed('line')).to.be.true;
    });

    it('adds tag classes', function () {
        var a = iD.osmNode({loc: [0, 0]});
        var b = iD.osmNode({loc: [1, 1]});
        var line = iD.osmWay({nodes: [a.id, b.id], tags: {highway: 'residential'}});
        var graph = iD.coreGraph([a, b, line]);

        surface.call(iD.svgLines(projection, context), graph, [line], all);

        expect(surface.select('.line').classed('tag-highway')).to.be.true;
        expect(surface.select('.line').classed('tag-highway-residential')).to.be.true;
    });

    it('adds stroke classes for the tags of the parent relation of multipolygon members', function() {
        var a = iD.osmNode({loc: [0, 0]});
        var b = iD.osmNode({loc: [1, 1]});
        var line = iD.osmWay({nodes: [a.id, b.id]});
        var relation = iD.osmRelation({members: [{id: line.id}], tags: {type: 'multipolygon', natural: 'wood'}});
        var graph = iD.coreGraph([a, b, line, relation]);

        surface.call(iD.svgLines(projection, context), graph, [line], all);

        expect(surface.select('.stroke').classed('tag-natural-wood')).to.be.true;
    });

    it('renders stroke for outer way of multipolygon with tags on the outer way', function() {
        var a = iD.osmNode({loc: [1, 1]});
        var b = iD.osmNode({loc: [2, 2]});
        var c = iD.osmNode({loc: [3, 3]});
        var w = iD.osmWay({id: 'w-1', tags: {natural: 'wood'}, nodes: [a.id, b.id, c.id, a.id]});
        var r = iD.osmRelation({members: [{id: w.id}], tags: {type: 'multipolygon'}});
        var graph = iD.coreGraph([a, b, c, w, r]);

        surface.call(iD.svgLines(projection, context), graph, [w], all);

        expect(surface.select('.stroke.w-1').classed('tag-natural-wood')).to.equal(true, 'outer tag-natural-wood true');
        expect(surface.select('.stroke.w-1').classed('old-multipolygon')).to.equal(true, 'outer old-multipolygon true');
    });

    it('adds stroke classes for the tags of the outer way of multipolygon with tags on the outer way', function() {
        var a = iD.osmNode({loc: [1, 1]});
        var b = iD.osmNode({loc: [2, 2]});
        var c = iD.osmNode({loc: [3, 3]});
        var o = iD.osmWay({id: 'w-1', nodes: [a.id, b.id, c.id, a.id], tags: {natural: 'wood'}});
        var i = iD.osmWay({id: 'w-2', nodes: [a.id, b.id, c.id, a.id]});
        var r = iD.osmRelation({members: [{id: o.id, role: 'outer'}, {id: i.id, role: 'inner'}], tags: {type: 'multipolygon'}});
        var graph = iD.coreGraph([a, b, c, o, i, r]);

        surface.call(iD.svgLines(projection, context), graph, [i, o], all);

        expect(surface.select('.stroke.w-1').classed('tag-natural-wood')).to.equal(true, 'outer tag-natural-wood true');
        expect(surface.select('.stroke.w-1').classed('old-multipolygon')).to.equal(true, 'outer old-multipolygon true');
        expect(surface.select('.stroke.w-2').classed('tag-natural-wood')).to.equal(true, 'inner tag-natural-wood true');
        expect(surface.select('.stroke.w-2').classed('old-multipolygon')).to.equal(false, 'inner old-multipolygon false');
    });

    describe('z-indexing', function() {
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a', loc: [0, 0]}),
            iD.osmNode({id: 'b', loc: [1, 1]}),
            iD.osmNode({id: 'c', loc: [0, 0]}),
            iD.osmNode({id: 'd', loc: [1, 1]}),
            iD.osmWay({id: 'lo', tags: {highway: 'residential', layer: '0'}, nodes: ['a', 'b']}),
            iD.osmWay({id: 'hi', tags: {highway: 'residential', layer: '1'}, nodes: ['c', 'd']})
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
