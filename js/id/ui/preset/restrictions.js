iD.ui.preset.restrictions = function(field, context) {
    var dispatch = d3.dispatch('change'),
        vertexID,
        fromNodeID;

    function restrictions(selection) {
        var wrap = selection.selectAll('.preset-input-wrap')
            .data([0]);

        var enter = wrap.enter().append('div')
            .attr('class', 'preset-input-wrap');

        enter.append('div')
            .attr('class', 'restriction-help');

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
            .call(lines, graph, intersection.ways, filter)
            .call(turns, graph, intersection.turns(fromNodeID));

        surface
            .on('click.restrictions', click)
            .on('mouseover.restrictions', mouseover)
            .on('mouseout.restrictions', mouseout);

        surface
            .selectAll('.selected')
            .classed('selected', false);

        if (fromNodeID) {
            surface
                .selectAll('.' + intersection.highways[fromNodeID].id)
                .classed('selected', true);
        }

        mouseout();

        context.history()
            .on('change.restrictions', render);

        d3.select(window)
            .on('resize.restrictions', render);

        function click() {
            var datum = d3.event.target.__data__;
            if (datum instanceof iD.Entity) {
                fromNodeID = intersection.adjacentNodeId(datum.id);
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
        }

        function mouseover() {
            var datum = d3.event.target.__data__;
            if (datum instanceof iD.geo.Turn) {
                var graph = context.graph(),
                    presets = context.presets(),
                    preset;

                if (datum.restriction) {
                    preset = presets.match(graph.entity(datum.restriction), graph);
                } else {
                    preset = presets.item('type/restriction/' +
                        iD.geo.inferRestriction(
                            graph,
                            datum.from,
                            datum.via,
                            datum.to,
                            projection));
                }

                wrap.selectAll('.restriction-help')
                    .text(t('operations.restriction.help.' +
                        (datum.restriction ? 'toggle_off' : 'toggle_on'),
                        {restriction: preset.name()}));
            }
        }

        function mouseout() {
            wrap.selectAll('.restriction-help')
                .text(t('operations.restriction.help.' +
                    (fromNodeID ? 'toggle' : 'select')));
        }

        function render() {
            if (context.hasEntity(vertexID)) {
                restrictions(selection);
            }
        }
    }

    restrictions.entity = function(_) {
        if (!vertexID || vertexID !== _.id) {
            fromNodeID = null;
            vertexID = _.id;
        }
    };

    restrictions.tags = function() {};
    restrictions.focus = function() {};

    return d3.rebind(restrictions, dispatch, 'on');
};
