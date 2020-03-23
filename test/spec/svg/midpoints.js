describe('iD.svgMidpoints', function () {
    var context, surface;
    var _selectedIDs = [];
    var filter = function() { return true; };
    var projection = d3.geoProjection(function(x, y) { return [x, -y]; })
        .translate([0, 0])
        .scale(iD.geoZoomToScale(17))
        .clipExtent([[0, 0], [Infinity, Infinity]]);


    beforeEach(function () {
        context = iD.coreContext().init();
        context.enter({
            id: 'select',
            enter: function() { },
            exit: function() { },
            selectedIDs: function() { return _selectedIDs; }
        });

        d3.select(document.createElement('div'))
            .attr('class', 'main-map')
            .call(context.map().centerZoom([0, 0], 17));

        surface = context.surface();
    });


    it('creates midpoint on segment completely within the extent', function () {
        var a = iD.osmNode({loc: [0, 0]});
        var b = iD.osmNode({loc: [1, 0]});
        var line = iD.osmWay({nodes: [a.id, b.id]});
        var graph = iD.coreGraph([a, b, line]);
        var extent = iD.geoExtent([0, 0], [1, 1]);

        _selectedIDs = [line.id];
        context.entity = function(id) { return graph.entity(id); };
        context.hasEntity = function(id) { return graph.entities[id]; };

        surface.call(iD.svgMidpoints(projection, context), graph, [line], filter, extent);
        expect(surface.selectAll('.midpoint').datum().loc).to.eql([0.5, 0]);
    });

    it('doesn\'t create midpoint on segment with pixel length less than 40', function () {
        var a = iD.osmNode({loc: [0, 0]});
        var b = iD.osmNode({loc: [0.0001, 0]});
        var line = iD.osmWay({nodes: [a.id, b.id]});
        var graph = iD.coreGraph([a, b, line]);
        var extent = iD.geoExtent([0, 0], [1, 1]);

        _selectedIDs = [line.id];
        context.entity = function(id) { return graph.entity(id); };
        context.hasEntity = function(id) { return graph.entities[id]; };

        surface.call(iD.svgMidpoints(projection, context), graph, [line], filter, extent);
        expect(surface.selectAll('.midpoint').nodes()).to.have.length(0);
    });

    it('doesn\'t create midpoint on segment completely outside of the extent', function () {
        var a = iD.osmNode({loc: [-1, 0]});
        var b = iD.osmNode({loc: [-0.5, 0]});
        var line = iD.osmWay({nodes: [a.id, b.id]});
        var graph = iD.coreGraph([a, b, line]);
        var extent = iD.geoExtent([0, 0], [1, 1]);

        _selectedIDs = [line.id];
        context.entity = function(id) { return graph.entity(id); };
        context.hasEntity = function(id) { return graph.entities[id]; };

        surface.call(iD.svgMidpoints(projection, context), graph, [line], filter, extent);
        expect(surface.selectAll('.midpoint').nodes()).to.have.length(0);
    });

    it('creates midpoint on extent edge for segment partially outside of the extent', function () {
        var a = iD.osmNode({loc: [0.5, 0]});
        var b = iD.osmNode({loc: [2, 0]});
        var line = iD.osmWay({nodes: [a.id, b.id]});
        var graph = iD.coreGraph([a, b, line]);
        var extent = iD.geoExtent([0, 0], [1, 1]);

        _selectedIDs = [line.id];
        context.entity = function(id) { return graph.entity(id); };
        context.hasEntity = function(id) { return graph.entities[id]; };

        surface.call(iD.svgMidpoints(projection, context), graph, [line], filter, extent);
        expect(surface.selectAll('.midpoint').datum().loc).to.eql([1, 0]);
    });

    it('doesn\'t create midpoint on extent edge for segment with pixel length less than 20', function () {
        var a = iD.osmNode({loc: [0.9999, 0]});
        var b = iD.osmNode({loc: [2, 0]});
        var line = iD.osmWay({nodes: [a.id, b.id]});
        var graph = iD.coreGraph([a, b, line]);
        var extent = iD.geoExtent([0, 0], [1, 1]);

        _selectedIDs = [line.id];
        context.entity = function(id) { return graph.entity(id); };
        context.hasEntity = function(id) { return graph.entities[id]; };

        surface.call(iD.svgMidpoints(projection, context), graph, [line], filter, extent);
        expect(surface.selectAll('.midpoint').nodes()).to.have.length(0);
    });

});
