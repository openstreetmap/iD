import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    select as d3_select,
    event as d3_event
} from 'd3-selection';

import { t } from '../../util/locale';
import { actionRestrictTurn, actionUnrestrictTurn } from '../../actions';
import { behaviorBreathe, behaviorHover } from '../../behavior';

import {
    geoExtent,
    geoRawMercator,
    geoVecScale,
    geoVecSubtract,
    geoZoomToScale
} from '../../geo';

import { osmIntersection, osmInferRestriction, osmTurn, osmWay } from '../../osm';
import { svgLabels, svgLayers, svgLines, svgTurns, svgVertices } from '../../svg';
import { utilRebind } from '../../util/rebind';
import { utilFunctor } from '../../util';
import { utilGetDimensions, utilSetDimensions } from '../../util/dimensions';


export function uiFieldRestrictions(field, context) {
    var dispatch = d3_dispatch('change');
    var breathe = behaviorBreathe(context);
    var hover = behaviorHover(context);
    var initialized = false;
    var graph;
    var vertexID;
    var fromWayID;


    function restrictions(selection, intersection) {
        // if form field is hidden or has detached from dom, clean up.
        if (!d3_select('.inspector-wrap.inspector-hidden').empty() ||
            !selection.node().parentNode || !selection.node().parentNode.parentNode) {
            selection.call(restrictions.off);
            return;
        }

        // try to reuse the intersection, but always rebuild it if the graph has changed
        if (context.graph() !== graph || !intersection) {
            graph = context.graph();
            intersection = osmIntersection(graph, vertexID);
        }
        var ok = (intersection.vertices.length && intersection.ways.length);

        var wrap = selection.selectAll('.preset-input-wrap')
            .data(ok ? [0] : []);

        wrap.exit()
            .remove();

        var enter = wrap.enter()
            .append('div')
            .attr('class', 'preset-input-wrap');

        enter
            .append('div')
            .attr('class', 'restriction-help');

        // hack: no actual intersection exists here, just dont show the field
        if (!ok) return;

        var vgraph = intersection.graph;
        var filter = utilFunctor(true);
        var extent = geoExtent();
        var projection = geoRawMercator();

        var d = utilGetDimensions(wrap.merge(enter));
        var c = geoVecScale(d, 0.5);
        var z = intersection.vertices.length === 1 ? 22 : 19.5;

        projection.scale(geoZoomToScale(z));

        // fit extent to include all key vertices
        for (var i = 0; i < intersection.vertices.length; i++) {
            extent._extend(intersection.vertices[i].extent());
        }
        var center = projection(extent.center());

        projection
            .translate(geoVecSubtract(c, center))
            .clipExtent([[0, 0], d]);

        var drawLayers = svgLayers(projection, context).only('osm').dimensions(d);
        var drawVertices = svgVertices(projection, context);
        var drawLines = svgLines(projection, context);
        // var drawLabels = svgLabels(projection, context, true);
        var drawTurns = svgTurns(projection, context);

        enter
            .call(drawLayers);

        wrap = wrap
            .merge(enter);

        var surface = wrap.selectAll('.surface');

        if (!enter.empty()) {
            initialized = true;
            surface
                .call(breathe)
                .call(hover);
        }

        surface
            .call(utilSetDimensions, d)
            .call(drawVertices, vgraph, intersection.vertices, filter, extent, z)
            .call(drawLines, vgraph, intersection.ways, filter)
            // .call(drawLabels, vgraph, intersection.ways, filter, d, true)
            .call(drawTurns, vgraph, intersection.turns(fromWayID));

        surface
            .on('click.restrictions', click)
            .on('mouseover.restrictions', mouseover)
            .on('mouseout.restrictions', mouseout);

        surface
            .selectAll('.selected')
            .classed('selected', false);

        if (fromWayID) {
            surface
                .selectAll('.' + fromWayID)
                .classed('selected', true);
        }

        mouseout();

        context.history()
            .on('change.restrictions', render);

        d3_select(window)
            .on('resize.restrictions', function() {
                utilSetDimensions(wrap, null);
                render();
            });


        function click() {
            surface
                .call(breathe.off)
                .call(breathe);

            var datum = d3_event.target.__data__;
            var entity = datum && datum.properties && datum.properties.entity;
            if (entity) {
                datum = entity;
            }

            if (datum instanceof osmWay && (datum.__from || datum.__via)) {
                fromWayID = datum.id;
                render();

            } else if (datum instanceof osmTurn) {
                var actions;
                if (datum.restriction) {
                    actions = intersection.actions.concat([
                        actionUnrestrictTurn(datum, projection),
                        t('operations.restriction.annotation.delete')
                    ]);
                } else {
                    actions = intersection.actions.concat([
                        actionRestrictTurn(datum, projection),
                        t('operations.restriction.annotation.create')
                    ]);
                }
                context.perform.apply(context, actions);

            } else {
                fromWayID = null;
                render();
            }
        }


        function mouseover() {
            var datum = d3_event.target.__data__;
            var entity = datum && datum.properties && datum.properties.entity;
            if (entity) {
                datum = entity;
            }

            if (datum instanceof osmWay) {
                wrap.selectAll('.restriction-help')
                    .text(datum.id);

            } else if (datum instanceof osmTurn) {

                //DEBUG
                var str = '';
                if (datum.restriction) {
                    if (datum.only)      { str += 'ONLY_ '; }
                    if (datum.direct)    { str += 'NO_ '; }
                    if (datum.indirect)  { str += 'indirect '; }
                    str += datum.restriction;
                }

                str += ' FROM ' + datum.from.way +
                    ' VIA ' + (datum.via.node || datum.via.ways.join(',')) +
                    ' TO ' + datum.to.way;

                wrap.selectAll('.restriction-help')
                    .text(str);

// return;
            //     var presets = context.presets(),
            //         preset;

            //     if (datum.restriction) {
            //         preset = presets.match(vgraph.entity(datum.restriction), vgraph);
            //     } else {
            //         preset = presets.item('type/restriction/' +
            //             osmInferRestriction(
            //                 vgraph,
            //                 datum.from,
            //                 datum.to,
            //                 projection
            //             )
            //         );
            //     }

            //     wrap.selectAll('.restriction-help')
            //         .text(t('operations.restriction.help.' +
            //             (datum.restriction ? 'toggle_off' : 'toggle_on'),
            //             { restriction: preset.name() })
            //         );
            }
        }


        function mouseout() {

            if (fromWayID) {
                wrap.selectAll('.restriction-help')
                    .text('FROM ' + fromWayID);
            } else {
                wrap.selectAll('.restriction-help')
                    .text('Click to select the FROM way');
            }

            // wrap.selectAll('.restriction-help')
            //     .text(t('operations.restriction.help.' +
            //         (fromWayID ? 'toggle' : 'select'))
            //     );
        }


        function render() {
            if (context.hasEntity(vertexID)) {
                restrictions(selection, intersection);
            }
        }
    }


    restrictions.entity = function(_) {
        if (!vertexID || vertexID !== _.id) {
            fromWayID = null;
            vertexID = _.id;
        }
    };


    restrictions.tags = function() {};
    restrictions.focus = function() {};


    restrictions.off = function(selection) {
        if (!initialized) return;

        selection.selectAll('.surface')
            .call(hover.off)
            .call(breathe.off)
            .on('click.restrictions', null)
            .on('mouseover.restrictions', null)
            .on('mouseout.restrictions', null);

        context.history()
            .on('change.restrictions', null);

        d3_select(window)
            .on('resize.restrictions', null);
    };


    return utilRebind(restrictions, dispatch, 'on');
}
