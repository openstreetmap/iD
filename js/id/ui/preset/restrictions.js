iD.ui.preset.restrictions = function(field, context) {
    var dispatch = d3.dispatch('change'),
        hover = iD.behavior.Hover(context),
        vertexID,
        fromNodeID;


    function restrictions(selection) {
        // if form field is hidden or has detached from dom, clean up.
        if (!d3.select('.inspector-wrap.inspector-hidden').empty() || !selection.node().parentNode) {
            selection.call(restrictions.off);
            return;
        }

        var wrap = selection.selectAll('.preset-input-wrap')
            .data([0]);

        var enter = wrap.enter()
            .append('div')
            .attr('class', 'preset-input-wrap');

        enter
            .append('div')
            .attr('class', 'restriction-help');


        var intersection = iD.geo.Intersection(context.graph(), vertexID),
            graph = intersection.graph,
            vertex = graph.entity(vertexID),
            filter = d3.functor(true),
            extent = iD.geo.Extent(),
            projection = iD.geo.RawMercator();

        var d = wrap.dimensions(),
            c = [d[0] / 2, d[1] / 2],
            z = 24;

        projection
            .scale(256 * Math.pow(2, z) / (2 * Math.PI));

        var s = projection(vertex.loc);

        projection
            .translate([c[0] - s[0], c[1] - s[1]])
            .clipExtent([[0, 0], d]);

        var drawLayers = iD.svg.Layers(projection, context).only('osm').dimensions(d),
            drawVertices = iD.svg.Vertices(projection, context),
            drawLines = iD.svg.Lines(projection, context),
            drawTurns = iD.svg.Turns(projection, context);

        enter
            .call(drawLayers)
            .selectAll('.surface')
            .call(hover);


        var surface = wrap.selectAll('.surface');

        surface
            .dimensions(d)
            .call(drawVertices, graph, [vertex], filter, extent, z)
            .call(drawLines, graph, intersection.ways, filter)
            .call(drawTurns, graph, intersection.turns(fromNodeID));

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
            .on('resize.restrictions', function() {
                wrap.dimensions(null);
                render();
            });

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

    restrictions.off = function(selection) {
        selection.selectAll('.surface')
            .call(hover.off)
            .on('click.restrictions', null)
            .on('mouseover.restrictions', null)
            .on('mouseout.restrictions', null);

        context.history()
            .on('change.restrictions', null);

        d3.select(window)
            .on('resize.restrictions', null);
    };

    return d3.rebind(restrictions, dispatch, 'on');
};
