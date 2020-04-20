describe('iD.svgAreas', function () {
    var context, _surface, _savedAreaKeys;
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
        _surface = context.surface();

        _savedAreaKeys = iD.osmAreaKeys;
        iD.osmSetAreaKeys({ building: {}, landuse: {}, natural: {} });
    });

    afterEach(function () {
        iD.osmSetAreaKeys(_savedAreaKeys);
    });


    it('adds way and area classes', function () {
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a', loc: [0, 0]}),
            iD.osmNode({id: 'b', loc: [1, 0]}),
            iD.osmNode({id: 'c', loc: [1, 1]}),
            iD.osmNode({id: 'd', loc: [0, 1]}),
            iD.osmWay({id: 'w', tags: {area: 'yes', building: 'yes'}, nodes: ['a', 'b', 'c', 'a']})
        ]);

        _surface.call(iD.svgAreas(projection, context), graph, [graph.entity('w')], none);

        expect(_surface.select('path.way').classed('way')).to.be.true;
        expect(_surface.select('path.area').classed('area')).to.be.true;
    });

    it('adds tag classes', function () {
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a', loc: [0, 0]}),
            iD.osmNode({id: 'b', loc: [1, 0]}),
            iD.osmNode({id: 'c', loc: [1, 1]}),
            iD.osmNode({id: 'd', loc: [0, 1]}),
            iD.osmWay({id: 'w', tags: {area: 'yes', building: 'yes'}, nodes: ['a', 'b', 'c', 'a']})
        ]);

        _surface.call(iD.svgAreas(projection, context), graph, [graph.entity('w')], none);

        expect(_surface.select('.area').classed('tag-building')).to.be.true;
        expect(_surface.select('.area').classed('tag-building-yes')).to.be.true;
    });

    it('handles deletion of a way and a member vertex (#1903)', function () {
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a', loc: [0, 0]}),
            iD.osmNode({id: 'b', loc: [1, 0]}),
            iD.osmNode({id: 'c', loc: [1, 1]}),
            iD.osmNode({id: 'd', loc: [1, 1]}),
            iD.osmWay({id: 'w', tags: {area: 'yes'}, nodes: ['a', 'b', 'c', 'a']}),
            iD.osmWay({id: 'x', tags: {area: 'yes'}, nodes: ['a', 'b', 'd', 'a']})
        ]);

        _surface.call(iD.svgAreas(projection, context), graph, [graph.entity('x')], all);
        graph = graph.remove(graph.entity('x')).remove(graph.entity('d'));

        _surface.call(iD.svgAreas(projection, context), graph, [graph.entity('w')], all);
        expect(_surface.select('.area').size()).to.equal(1);
    });

    describe('z-indexing', function() {
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a', loc: [-0.0002,  0.0001]}),
            iD.osmNode({id: 'b', loc: [ 0.0002,  0.0001]}),
            iD.osmNode({id: 'c', loc: [ 0.0002, -0.0001]}),
            iD.osmNode({id: 'd', loc: [-0.0002, -0.0001]}),
            iD.osmNode({id: 'e', loc: [-0.0004,  0.0002]}),
            iD.osmNode({id: 'f', loc: [ 0.0004,  0.0002]}),
            iD.osmNode({id: 'g', loc: [ 0.0004, -0.0002]}),
            iD.osmNode({id: 'h', loc: [-0.0004, -0.0002]}),
            iD.osmWay({id: 's', tags: {area: 'yes', building: 'yes'}, nodes: ['a', 'b', 'c', 'd', 'a']}),
            iD.osmWay({id: 'l', tags: {area: 'yes', landuse: 'park'}, nodes: ['e', 'f', 'g', 'h', 'e']})
        ]);

        it('stacks smaller areas above larger ones in a single render', function () {
            _surface.call(iD.svgAreas(projection, context), graph, [graph.entity('s'), graph.entity('l')], none);

            expect(_surface.select('.area:nth-child(1)').classed('tag-landuse-park')).to.be.true;
            expect(_surface.select('.area:nth-child(2)').classed('tag-building-yes')).to.be.true;
        });

        it('stacks smaller areas above larger ones in a single render (reverse)', function () {
            _surface.call(iD.svgAreas(projection, context), graph, [graph.entity('l'), graph.entity('s')], none);

            expect(_surface.select('.area:nth-child(1)').classed('tag-landuse-park')).to.be.true;
            expect(_surface.select('.area:nth-child(2)').classed('tag-building-yes')).to.be.true;
        });

        it('stacks smaller areas above larger ones in separate renders', function () {
            _surface.call(iD.svgAreas(projection, context), graph, [graph.entity('s')], none);
            _surface.call(iD.svgAreas(projection, context), graph, [graph.entity('l')], none);

            expect(_surface.select('.area:nth-child(1)').classed('tag-landuse-park')).to.be.true;
            expect(_surface.select('.area:nth-child(2)').classed('tag-building-yes')).to.be.true;
        });

        it('stacks smaller areas above larger ones in separate renders (reverse)', function () {
            _surface.call(iD.svgAreas(projection, context), graph, [graph.entity('l')], none);
            _surface.call(iD.svgAreas(projection, context), graph, [graph.entity('s')], none);

            expect(_surface.select('.area:nth-child(1)').classed('tag-landuse-park')).to.be.true;
            expect(_surface.select('.area:nth-child(2)').classed('tag-building-yes')).to.be.true;
        });
    });

    it('renders fills for multipolygon areas', function () {
        var a = iD.osmNode({loc: [1, 1]});
        var b = iD.osmNode({loc: [2, 2]});
        var c = iD.osmNode({loc: [3, 3]});
        var w = iD.osmWay({nodes: [a.id, b.id, c.id, a.id]});
        var r = iD.osmRelation({tags: {type: 'multipolygon'}, members: [{id: w.id, type: 'way'}]});
        var graph = iD.coreGraph([a, b, c, w, r]);
        var areas = [w, r];

        _surface.call(iD.svgAreas(projection, context), graph, areas, none);

        expect(_surface.select('.fill').classed('relation')).to.be.true;
    });

    it('renders no strokes for multipolygon areas', function () {
        var a = iD.osmNode({loc: [1, 1]});
        var b = iD.osmNode({loc: [2, 2]});
        var c = iD.osmNode({loc: [3, 3]});
        var w = iD.osmWay({nodes: [a.id, b.id, c.id, a.id]});
        var r = iD.osmRelation({tags: {type: 'multipolygon'}, members: [{id: w.id, type: 'way'}]});
        var graph = iD.coreGraph([a, b, c, w, r]);
        var areas = [w, r];

        _surface.call(iD.svgAreas(projection, context), graph, areas, none);

        expect(_surface.selectAll('.stroke').size()).to.equal(0);
    });

    it('renders fill for a multipolygon with tags on the outer way', function() {
        var a = iD.osmNode({loc: [1, 1]});
        var b = iD.osmNode({loc: [2, 2]});
        var c = iD.osmNode({loc: [3, 3]});
        var w = iD.osmWay({tags: {natural: 'wood'}, nodes: [a.id, b.id, c.id, a.id]});
        var r = iD.osmRelation({members: [{id: w.id, type: 'way'}], tags: {type: 'multipolygon'}});
        var graph = iD.coreGraph([a, b, c, w, r]);

        _surface.call(iD.svgAreas(projection, context), graph, [w, r], none);

        expect(_surface.selectAll('.way.fill').size()).to.equal(0);
        expect(_surface.selectAll('.relation.fill').size()).to.equal(1);
        expect(_surface.select('.relation.fill').classed('tag-natural-wood')).to.be.true;
    });

    it('renders no strokes for a multipolygon with tags on the outer way', function() {
        var a = iD.osmNode({loc: [1, 1]});
        var b = iD.osmNode({loc: [2, 2]});
        var c = iD.osmNode({loc: [3, 3]});
        var w = iD.osmWay({tags: {natural: 'wood'}, nodes: [a.id, b.id, c.id, a.id]});
        var r = iD.osmRelation({members: [{id: w.id, type: 'way'}], tags: {type: 'multipolygon'}});
        var graph = iD.coreGraph([a, b, c, w, r]);

        _surface.call(iD.svgAreas(projection, context), graph, [w, r], none);

        expect(_surface.selectAll('.stroke').size()).to.equal(0);
    });
});
