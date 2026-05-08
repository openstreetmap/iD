describe('iD.svgAreas', function () {
    var context, _surface, _savedAreaKeys;
    var all = function() { return true; };
    var none = function() { return false; };

    var projection = d3.geoProjection(function(x, y) { return [x, -y]; })
        .translate([0, 0])
        .scale(iD.geoZoomToScale(17))
        .clipExtent([[0, 0], [Infinity, Infinity]]);


    beforeEach(function () {
        context = iD.coreContext().assetPath('../dist/').init();
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
        var graph = new iD.coreGraph([
            new iD.osmNode({id: 'a', loc: [0, 0]}),
            new iD.osmNode({id: 'b', loc: [1, 0]}),
            new iD.osmNode({id: 'c', loc: [1, 1]}),
            new iD.osmNode({id: 'd', loc: [0, 1]}),
            new iD.osmWay({id: 'w', tags: {area: 'yes', building: 'yes'}, nodes: ['a', 'b', 'c', 'a']})
        ]);

        _surface.call(iD.svgAreas(projection, context), graph, [graph.entity('w')], none);

        expect(_surface.select('path.way').classed('way')).toBe(true);
        expect(_surface.select('path.area').classed('area')).toBe(true);
    });

    it('adds tag classes', function () {
        var graph = new iD.coreGraph([
            new iD.osmNode({id: 'a', loc: [0, 0]}),
            new iD.osmNode({id: 'b', loc: [1, 0]}),
            new iD.osmNode({id: 'c', loc: [1, 1]}),
            new iD.osmNode({id: 'd', loc: [0, 1]}),
            new iD.osmWay({id: 'w', tags: {area: 'yes', building: 'yes'}, nodes: ['a', 'b', 'c', 'a']})
        ]);

        _surface.call(iD.svgAreas(projection, context), graph, [graph.entity('w')], none);

        expect(_surface.select('.area').classed('tag-building')).toBe(true);
        expect(_surface.select('.area').classed('tag-building-yes')).toBe(true);
    });

    it('handles deletion of a way and a member vertex (#1903)', function () {
        var graph = new iD.coreGraph([
            new iD.osmNode({id: 'a', loc: [0, 0]}),
            new iD.osmNode({id: 'b', loc: [1, 0]}),
            new iD.osmNode({id: 'c', loc: [1, 1]}),
            new iD.osmNode({id: 'd', loc: [1, 1]}),
            new iD.osmWay({id: 'w', tags: {area: 'yes'}, nodes: ['a', 'b', 'c', 'a']}),
            new iD.osmWay({id: 'x', tags: {area: 'yes'}, nodes: ['a', 'b', 'd', 'a']})
        ]);

        _surface.call(iD.svgAreas(projection, context), graph, [graph.entity('x')], all);
        graph = graph.remove(graph.entity('x')).remove(graph.entity('d'));

        _surface.call(iD.svgAreas(projection, context), graph, [graph.entity('w')], all);
        expect(_surface.select('.area').size()).toEqual(1);
    });

    describe('z-indexing', function() {
        var graph = new iD.coreGraph([
            new iD.osmNode({id: 'a', loc: [-0.0002,  0.0001]}),
            new iD.osmNode({id: 'b', loc: [ 0.0002,  0.0001]}),
            new iD.osmNode({id: 'c', loc: [ 0.0002, -0.0001]}),
            new iD.osmNode({id: 'd', loc: [-0.0002, -0.0001]}),
            new iD.osmNode({id: 'e', loc: [-0.0004,  0.0002]}),
            new iD.osmNode({id: 'f', loc: [ 0.0004,  0.0002]}),
            new iD.osmNode({id: 'g', loc: [ 0.0004, -0.0002]}),
            new iD.osmNode({id: 'h', loc: [-0.0004, -0.0002]}),
            new iD.osmWay({id: 's', tags: {area: 'yes', building: 'yes'}, nodes: ['a', 'b', 'c', 'd', 'a']}),
            new iD.osmWay({id: 'l', tags: {area: 'yes', landuse: 'park'}, nodes: ['e', 'f', 'g', 'h', 'e']})
        ]);

        it('stacks smaller areas above larger ones in a single render', function () {
            _surface.call(iD.svgAreas(projection, context), graph, [graph.entity('s'), graph.entity('l')], none);

            expect(_surface.select('.area:nth-child(1)').classed('tag-landuse-park')).toBe(true);
            expect(_surface.select('.area:nth-child(2)').classed('tag-building-yes')).toBe(true);
        });

        it('stacks smaller areas above larger ones in a single render (reverse)', function () {
            _surface.call(iD.svgAreas(projection, context), graph, [graph.entity('l'), graph.entity('s')], none);

            expect(_surface.select('.area:nth-child(1)').classed('tag-landuse-park')).toBe(true);
            expect(_surface.select('.area:nth-child(2)').classed('tag-building-yes')).toBe(true);
        });

        it('stacks smaller areas above larger ones in separate renders', function () {
            _surface.call(iD.svgAreas(projection, context), graph, [graph.entity('s')], none);
            _surface.call(iD.svgAreas(projection, context), graph, [graph.entity('l')], none);

            expect(_surface.select('.area:nth-child(1)').classed('tag-landuse-park')).toBe(true);
            expect(_surface.select('.area:nth-child(2)').classed('tag-building-yes')).toBe(true);
        });

        it('stacks smaller areas above larger ones in separate renders (reverse)', function () {
            _surface.call(iD.svgAreas(projection, context), graph, [graph.entity('l')], none);
            _surface.call(iD.svgAreas(projection, context), graph, [graph.entity('s')], none);

            expect(_surface.select('.area:nth-child(1)').classed('tag-landuse-park')).toBe(true);
            expect(_surface.select('.area:nth-child(2)').classed('tag-building-yes')).toBe(true);
        });
    });

    it('renders fills for multipolygon areas', function () {
        var a = new iD.osmNode({loc: [1, 1]});
        var b = new iD.osmNode({loc: [2, 2]});
        var c = new iD.osmNode({loc: [3, 3]});
        var w = new iD.osmWay({nodes: [a.id, b.id, c.id, a.id]});
        var r = new iD.osmRelation({tags: {type: 'multipolygon'}, members: [{id: w.id, type: 'way'}]});
        var graph = new iD.coreGraph([a, b, c, w, r]);
        var areas = [w, r];

        _surface.call(iD.svgAreas(projection, context), graph, areas, none);

        expect(_surface.select('.fill').classed('relation')).toBe(true);
    });

    it('renders no strokes for multipolygon areas', function () {
        var a = new iD.osmNode({loc: [1, 1]});
        var b = new iD.osmNode({loc: [2, 2]});
        var c = new iD.osmNode({loc: [3, 3]});
        var w = new iD.osmWay({nodes: [a.id, b.id, c.id, a.id]});
        var r = new iD.osmRelation({tags: {type: 'multipolygon'}, members: [{id: w.id, type: 'way'}]});
        var graph = new iD.coreGraph([a, b, c, w, r]);
        var areas = [w, r];

        _surface.call(iD.svgAreas(projection, context), graph, areas, none);

        expect(_surface.selectAll('.stroke').size()).toEqual(0);
    });
});
