iD.ui.preset.restrictions = function(field, context) {
    var event = d3.dispatch('change'),
        vertexID,
        selectedID;

    function restrictions(selection) {
        var wrap = selection.selectAll('.preset-input-wrap')
            .data([0]);

        var enter = wrap.enter().append('div')
            .attr('class', 'preset-input-wrap');

        enter.append('svg')
            .call(iD.svg.Surface(context))
            .call(iD.behavior.Hover(context));

        var intersection = iD.geo.Intersection(context.graph(), vertexID),
            graph = intersection.graph,
            vertex = graph.entity(vertexID),
            surface = wrap.selectAll('svg'),
            filter = function () { return true; },
            extent = iD.geo.Extent(),
            projection = iD.geo.RawMercator(),
            lines = iD.svg.Lines(projection, context),
            vertices = iD.svg.Vertices(projection, context),
            turns = iD.svg.Turns(projection, context);

        var d = wrap.dimensions(),
            c = [d[0] / 2, d[1] / 2],
            z = 21;

        projection
            .scale(256 * Math.pow(2, z) / (2 * Math.PI));

        var s = projection(vertex.loc);

        projection
            .translate([c[0] - s[0], c[1] - s[1]])
            .clipExtent([[0, 0], d]);

        surface
            .call(vertices, graph, [vertex], filter, extent, z)
            .call(lines, graph, intersection.highways, filter)
            .call(turns, graph, intersection.turns(selectedID));

        surface.on('click.select', function() {
            var datum = d3.event.target.__data__;
            if (datum instanceof iD.Entity) {
                selectedID = datum.id;
                render();
            } else if (datum instanceof iD.geo.Turn) {
                if (datum.restriction) {
                    context.perform(
                        iD.actions.UnrestrictTurn(datum, projection),
                        t('operations.restriction.annotation.delete'));
                } else {
                    context.perform(
                        iD.actions.RestrictTurn(datum, projection),
                        t('operations.restriction.annotation.create'));
                }
            }
        });

        surface
            .selectAll('.selected')
            .classed('selected', false);

        if (selectedID) {
            surface
                .selectAll('.' + selectedID)
                .classed('selected', true);
        }

        context.history()
            .on('change.restrictions', render);

        d3.select(window)
            .on('resize.restrictions', render);

        function render() {
            restrictions(selection);
        }
    }

    restrictions.entity = function(_) {
        if (!vertexID || vertexID !== _.id) {
            selectedID = null;
            vertexID = _.id;
        }
    };

    restrictions.tags = function() {};
    restrictions.focus = function() {};

    return d3.rebind(restrictions, event, 'on');
};
