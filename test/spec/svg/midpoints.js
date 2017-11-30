describe('iD.svgMidpoints', function () {
    var context, surface,
        selectedIDs = [],
        projection = d3.geoProjection(function(x, y) { return [x, -y]; })
            .translate([0, 0])
            .scale(180 / Math.PI)
            .clipExtent([[0, 0], [Infinity, Infinity]]),
        filter = function() { return true; };


    beforeEach(function () {
        context = iD.Context();
        context.mode = function() {
            return {
                id: 'select',
                selectedIDs: function() { return selectedIDs; }
            };
        };
        d3.select(document.createElement('div'))
            .attr('id', 'map')
            .call(context.map());
        surface = context.surface();
    });


    it('creates midpoint on segment completely within the extent', function () {
        var a = iD.Node({loc: [0, 0]}),
            b = iD.Node({loc: [50, 0]}),
            line = iD.Way({nodes: [a.id, b.id]}),
            graph = iD.Graph([a, b, line]),
            extent = iD.geoExtent([0, 0], [100, 100]);

        selectedIDs = [line.id];
        context.selectedIDs = function() { return selectedIDs; };
        context.entity = function(id) { return graph.entity(id); };
        context.hasEntity = context.entity;

        surface.call(iD.svgMidpoints(projection, context), graph, [line], filter, extent);
        expect(surface.selectAll('.midpoint').datum().loc).to.eql([25, 0]);
    });

    it('doesn\'t create midpoint on segment with pixel length less than 40', function () {
        var a = iD.Node({loc: [0, 0]}),
            b = iD.Node({loc: [39, 0]}),
            line = iD.Way({nodes: [a.id, b.id]}),
            graph = iD.Graph([a, b, line]),
            extent = iD.geoExtent([0, 0], [100, 100]);

        selectedIDs = [line.id];
        context.selectedIDs = function() { return selectedIDs; };
        context.entity = function(id) { return graph.entity(id); };
        context.hasEntity = context.entity;

        surface.call(iD.svgMidpoints(projection, context), graph, [line], filter, extent);
        expect(surface.selectAll('.midpoint').nodes()).to.have.length(0);
    });

    it('doesn\'t create midpoint on segment completely outside of the extent', function () {
        var a = iD.Node({loc: [-100, 0]}),
            b = iD.Node({loc: [-50, 0]}),
            line = iD.Way({nodes: [a.id, b.id]}),
            graph = iD.Graph([a, b, line]),
            extent = iD.geoExtent([0, 0], [100, 100]);

        selectedIDs = [line.id];
        context.selectedIDs = function() { return selectedIDs; };
        context.entity = function(id) { return graph.entity(id); };
        context.hasEntity = context.entity;

        surface.call(iD.svgMidpoints(projection, context), graph, [line], filter, extent);
        expect(surface.selectAll('.midpoint').nodes()).to.have.length(0);
    });

    it('creates midpoint on extent edge for segment partially outside of the extent', function () {
        var a = iD.Node({loc: [50, 0]}),
            b = iD.Node({loc: [500, 0]}),
            line = iD.Way({nodes: [a.id, b.id]}),
            graph = iD.Graph([a, b, line]),
            extent = iD.geoExtent([0, 0], [100, 100]);

        selectedIDs = [line.id];
        context.selectedIDs = function() { return selectedIDs; };
        context.entity = function(id) { return graph.entity(id); };
        context.hasEntity = context.entity;

        surface.call(iD.svgMidpoints(projection, context), graph, [line], filter, extent);
        expect(surface.selectAll('.midpoint').datum().loc).to.eql([100, 0]);
    });

    it('doesn\'t create midpoint on extent edge for segment with pixel length less than 20', function () {
        var a = iD.Node({loc: [81, 0]}),
            b = iD.Node({loc: [500, 0]}),
            line = iD.Way({nodes: [a.id, b.id]}),
            graph = iD.Graph([a, b, line]),
            extent = iD.geoExtent([0, 0], [100, 100]);

        selectedIDs = [line.id];
        context.selectedIDs = function() { return selectedIDs; };
        context.entity = function(id) { return graph.entity(id); };
        context.hasEntity = context.entity;

        surface.call(iD.svgMidpoints(projection, context), graph, [line], filter, extent);
        expect(surface.selectAll('.midpoint').nodes()).to.have.length(0);
    });

});
