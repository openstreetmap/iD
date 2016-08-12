import { rebind } from '../../util/rebind';
import { functor } from '../../util/index';
import { getDimensions, setDimensions } from '../../util/dimensions';
import * as d3 from 'd3';
import { t } from '../../util/locale';
import { Extent, Intersection, RawMercator, Turn, inferRestriction } from '../../geo/index';
import { Layers, Lines, Turns, Vertices } from '../../svg/index';
import { RestrictTurn, UnrestrictTurn,  } from '../../actions/index';
import { Entity } from '../../core/index';
import { Hover } from '../../behavior/index';

export function restrictions(field, context) {
    var dispatch = d3.dispatch('change'),
        hover = Hover(context),
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


        var intersection = Intersection(context.graph(), vertexID),
            graph = intersection.graph,
            vertex = graph.entity(vertexID),
            filter = functor(true),
            extent = Extent(),
            projection = RawMercator();

        var d = getDimensions(wrap),
            c = [d[0] / 2, d[1] / 2],
            z = 24;

        projection
            .scale(256 * Math.pow(2, z) / (2 * Math.PI));

        var s = projection(vertex.loc);

        projection
            .translate([c[0] - s[0], c[1] - s[1]])
            .clipExtent([[0, 0], d]);

        var drawLayers = setDimensions(Layers(projection, context).only('osm'), d),
            drawVertices = Vertices(projection, context),
            drawLines = Lines(projection, context),
            drawTurns = Turns(projection, context);

        enter
            .call(drawLayers)
            .selectAll('.surface')
            .call(hover);


        var surface = wrap.selectAll('.surface');

        setDimensions(surface, d)
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
                setDimensions(wrap, null);
                render();
            });

        function click() {
            var datum = d3.event.target.__data__;
            if (datum instanceof Entity) {
                fromNodeID = intersection.adjacentNodeId(datum.id);
                render();
            } else if (datum instanceof Turn) {
                if (datum.restriction) {
                    context.perform(
                        UnrestrictTurn(datum, projection),
                        t('operations.restriction.annotation.delete'));
                } else {
                    context.perform(
                        RestrictTurn(datum, projection),
                        t('operations.restriction.annotation.create'));
                }
            }
        }

        function mouseover() {
            var datum = d3.event.target.__data__;
            if (datum instanceof Turn) {
                var graph = context.graph(),
                    presets = context.presets(),
                    preset;

                if (datum.restriction) {
                    preset = presets.match(graph.entity(datum.restriction), graph);
                } else {
                    preset = presets.item('type/restriction/' +
                        inferRestriction(
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

    return rebind(restrictions, dispatch, 'on');
}
