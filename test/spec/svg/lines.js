describe('iD.svgLines', function () {
    var context, surface;
    var all = function() { return true; };
    var none = function() { return false; };
    var projection = d3.geoProjection(function(x, y) { return [x, -y]; })
        .translate([0, 0])
        .scale(iD.geoZoomToScale(17))
        .clipExtent([[0, 0], [Infinity, Infinity]]);


    beforeEach(function () {
        context = iD.coreContext().init();
        d3.select(document.createElement('div'))
            .attr('class', 'main-map')
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

    it('adds relation and area classes for untagged line member of multipolygon', function () {
        var a = iD.osmNode({loc: [0, 0]});
        var b = iD.osmNode({loc: [1, 1]});
        var line = iD.osmWay({nodes: [a.id, b.id]});
        var relation = iD.osmRelation({members: [{id: line.id}], tags: {type: 'multipolygon', natural: 'wood'}});
        var graph = iD.coreGraph([a, b, line, relation]);

        surface.call(iD.svgLines(projection, context), graph, [line], all);

        expect(surface.select('.stroke').classed('relation')).to.be.true;
        expect(surface.select('.stroke').classed('area')).to.be.true;
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

    describe('oneway-markers', function() {
        it('has marker layer for oneway ways', function() {
            // use 1e-2 to make sure segments are long enough to get
            // markers, but not so long that they get split and have
            // multiple marker segments.
            var a = iD.osmNode({id: 'a', loc: [0, 0]});
            var b = iD.osmNode({id: 'b', loc: [1e-2, 0]});
            var c = iD.osmNode({id: 'c', loc: [0, 1e-2]});

            var i_o = iD.osmWay({id: 'implied-oneway', tags: {waterway: 'stream'}, nodes: [a.id, b.id]});
            var e_o = iD.osmWay({id: 'explicit-oneway', tags: {highway: 'residential', oneway: 'yes'}, nodes: [a.id, c.id]});
            var e_b = iD.osmWay({id: 'explicit-backwards', tags: {highway: 'residential', oneway: '-1'}, nodes: [b.id, c.id]});

            var graph = iD.coreGraph([a, b, c, i_o, e_o, e_b]);

            surface.call(iD.svgLines(projection, context), graph, [i_o, e_o, e_b], all);

            var selection = surface.selectAll('g.onewaygroup > path');

            expect(selection.size()).to.eql(3);
            expect(selection.nodes()[0].attributes['marker-mid'].nodeValue).to.eql('url(#ideditor-oneway-marker)');
            expect(selection.nodes()[1].attributes['marker-mid'].nodeValue).to.eql('url(#ideditor-oneway-marker)');
            expect(selection.nodes()[2].attributes['marker-mid'].nodeValue).to.eql('url(#ideditor-oneway-marker)');
        });

        it('has two marker layers for alternating oneway ways', function() {
            var a = iD.osmNode({id: 'a', loc: [0, 0]});
            var b = iD.osmNode({id: 'b', loc: [1e-2, 0]});

            var e_a = iD.osmWay({id: 'explicit-alternating', tags: {highway: 'residential', oneway: 'alternating'}, nodes: [a.id, b.id]});

            var graph = iD.coreGraph([a, b, e_a]);

            surface.call(iD.svgLines(projection, context), graph, [e_a], all);

            var selection = surface.selectAll('g.onewaygroup > path');
            expect(selection.size()).to.eql(2);
            expect(selection.nodes()[0].attributes['marker-mid'].nodeValue).to.eql('url(#ideditor-oneway-marker)');
            expect(selection.nodes()[1].attributes['marker-mid'].nodeValue).to.eql('url(#ideditor-oneway-marker)');
        });

        it('has no marker layer for oneway=no ways', function() {
            var a = iD.osmNode({id: 'a', loc: [0, 0]});
            var b = iD.osmNode({id: 'b', loc: [1e-2, 0]});
            var c = iD.osmNode({id: 'c', loc: [0, 1e-2]});

            var e_no = iD.osmWay({id: 'explicit-no-oneway', tags: {highway: 'residential', oneway: 'no'}, nodes: [a.id, b.id]});
            var i_no = iD.osmWay({id: 'implied-no-oneway', tags: {highway: 'residential' }, nodes: [a.id, c.id]});

            var graph = iD.coreGraph([a, b, c, e_no, i_no]);

            surface.call(iD.svgLines(projection, context), graph, [i_no, e_no], all);
            var selection = surface.selectAll('g.onewaygroup > path');
            expect(selection.empty()).to.be.true;
        });
    });

    describe('sided-markers', function() {
        it('has marker layer for sided way', function() {
            var a = iD.osmNode({id: 'a', loc: [0, 0]});
            var b = iD.osmNode({id: 'b', loc: [1e-2, 0]});
            var c = iD.osmNode({id: 'c', loc: [0, 1e-2]});
            var d = iD.osmNode({id: 'd', loc: [1e-2, 1e-2]});

            var i_n = iD.osmWay({id: 'implied-natural', tags: {natural: 'cliff'}, nodes: [a.id, b.id]});
            var i_nc = iD.osmWay({id: 'implied-coastline', tags: {natural: 'coastline'}, nodes: [a.id, c.id]});
            var i_b = iD.osmWay({id: 'implied-barrier', tags: {barrier: 'city_wall'}, nodes: [a.id, d.id]});
            var i_mm = iD.osmWay({id: 'implied-man_made', tags: {man_made: 'embankment'}, nodes: [b.id, c.id]});

            var graph = iD.coreGraph([a, b, c, d, i_n, i_nc, i_b, i_mm]);

            surface.call(iD.svgLines(projection, context), graph, [i_n, i_nc, i_b, i_mm], all);
            var selection = surface.selectAll('g.sidedgroup > path');
            expect(selection.size()).to.eql(4);
            expect(selection.nodes()[0].attributes['marker-mid'].nodeValue).to.eql('url(#ideditor-sided-marker-natural)');
            expect(selection.nodes()[1].attributes['marker-mid'].nodeValue).to.eql('url(#ideditor-sided-marker-coastline)');
            expect(selection.nodes()[2].attributes['marker-mid'].nodeValue).to.eql('url(#ideditor-sided-marker-barrier)');
            expect(selection.nodes()[3].attributes['marker-mid'].nodeValue).to.eql('url(#ideditor-sided-marker-man_made)');
        });

        it('has no marker layer for two_sided way', function() {
            var a = iD.osmNode({id: 'a', loc: [0, 0]});
            var b = iD.osmNode({id: 'b', loc: [1e-2, 0]});

            var e_ts = iD.osmWay({id: 'explicit-two-sided', tags: {barrier: 'city_wall', two_sided: 'yes'}, nodes: [a.id, b.id]});

            var graph = iD.coreGraph([a, b, e_ts]);

            surface.call(iD.svgLines(projection, context), graph, [e_ts], all);
            var selection = surface.selectAll('g.sidedgroup > path');
            expect(selection.empty()).to.be.true;
        });
    });
});
