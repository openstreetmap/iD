import _cloneDeep from 'lodash-es/cloneDeep';

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

import {
    osmIntersection,
    osmInferRestriction,
    osmTurn,
    osmWay
} from '../../osm';

import {
    svgLayers,
    svgLines,
    svgTurns,
    svgVertices
} from '../../svg';

import {
    utilDisplayName,
    utilDisplayType,
    utilEntitySelector,
    utilFunctor,
    utilRebind
} from '../../util';

import {
    utilGetDimensions,
    utilSetDimensions
} from '../../util/dimensions';


export function uiFieldRestrictions(field, context) {
    var dispatch = d3_dispatch('change');
    var breathe = behaviorBreathe(context);
    var hover = behaviorHover(context);
    var storedDetail = context.storage('turn-restriction-detail');

    var _detail = storedDetail !== null ? (+storedDetail) : 0;
    var _initialized = false;
    var _container = d3_select(null);
    var _graph;
    var _vertexID;
    var _intersection;
    var _fromWayID;


    function restrictions(selection) {
        // if form field is hidden or has detached from dom, clean up.
        if (!d3_select('.inspector-wrap.inspector-hidden').empty() ||
            !selection.node().parentNode || !selection.node().parentNode.parentNode) {
            selection.call(restrictions.off);
            return;
        }

        var wrap = selection.selectAll('.preset-input-wrap')
            .data([0]);

        wrap = wrap.enter()
            .append('div')
            .attr('class', 'preset-input-wrap')
            .merge(wrap);

        var detailEnter = wrap.selectAll('.restriction-detail')
            .data([0])
            .enter()
            .append('div')
            .attr('class', 'restriction-detail');

        detailEnter
            .append('span')
            .attr('class', 'restriction-detail-label')
            .text('Max Detail: ');

        detailEnter
            .append('input')
            .attr('class', 'restriction-detail-input')
            .attr('type', 'range')
            .attr('min', '0')
            .attr('max', '2')
            .attr('step', '1')
            .on('input', function() {
                var val = d3_select(this).property('value');
                _detail = +val;
                _intersection = null;
                _container.selectAll('.layer-osm *').remove();
                context.storage('turn-restriction-detail', _detail);
                selection.call(restrictions);
            });

        detailEnter
            .append('span')
            .attr('class', 'restriction-detail-text');

        // update
        wrap.selectAll('.restriction-detail-input')
            .property('value', _detail);

        var t = ['via node only', 'via 1 way', 'via 2 ways'];
        wrap.selectAll('.restriction-detail-text')
            .text(t[_detail]);


        var container = wrap.selectAll('.restriction-container')
            .data([0]);

        var containerEnter = container.enter()
            .append('div')
            .attr('class', 'restriction-container');

        containerEnter
            .append('div')
            .attr('class', 'restriction-help');

        _container = containerEnter
            .merge(container);

        // try to reuse the intersection, but always rebuild it if the graph has changed
        if (context.graph() !== _graph || !_intersection) {
            _graph = context.graph();
            _intersection = osmIntersection(_graph, _vertexID, _detail);
        }

        var ok = (_intersection.vertices.length && _intersection.ways.length);

        _container
            .call(renderViewer);
    }


    function renderViewer(selection) {
        if (!_intersection) return;

        var vgraph = _intersection.graph;
        var filter = utilFunctor(true);
        var projection = geoRawMercator();

        var d = utilGetDimensions(_container);
        var c = geoVecScale(d, 0.5);
        var z = 22;

        projection.scale(geoZoomToScale(z));

        // Calculate extent of all key vertices
        var extent = geoExtent();
        for (var i = 0; i < _intersection.vertices.length; i++) {
            extent._extend(_intersection.vertices[i].extent());
        }

        // If this is a large intersection, adjust zoom to fit extent
        if (_intersection.vertices.length > 1) {
            var padding = 220;
            var tl = projection([extent[0][0], extent[1][1]]);
            var br = projection([extent[1][0], extent[0][1]]);
            var hFactor = (br[0] - tl[0]) / (d[0] - padding);
            var vFactor = (br[1] - tl[1]) / (d[1] - padding);
            var hZoomDiff = Math.log(Math.abs(hFactor)) / Math.LN2;
            var vZoomDiff = Math.log(Math.abs(vFactor)) / Math.LN2;
            z = z - Math.max(hZoomDiff, vZoomDiff);
            projection.scale(geoZoomToScale(z));
        }

        var padTop = 30;   // reserve top space for hints
        var extentCenter = projection(extent.center());
        extentCenter[1] = extentCenter[1] - padTop;

        projection
            .translate(geoVecSubtract(c, extentCenter))
            .clipExtent([[0, 0], d]);

        var drawLayers = svgLayers(projection, context).only('osm').dimensions(d);
        var drawVertices = svgVertices(projection, context);
        var drawLines = svgLines(projection, context);
        var drawTurns = svgTurns(projection, context);

        var firstTime = selection.selectAll('.surface').empty();

        selection
            .call(drawLayers);

        var surface = selection.selectAll('.surface');

        if (firstTime) {
            _initialized = true;

            surface
                .call(breathe)
                .call(hover);

            d3_select(window)
                .on('resize.restrictions', function() {
                    utilSetDimensions(_container, null);
                    redraw();
                });
        }


        // This can happen if we've lowered the detail while a FROM way
        // is selected, and that way is no longer part of the intersection.
        if (_fromWayID && !vgraph.hasEntity(_fromWayID)) {
            _fromWayID = null;
        }

        surface
            .call(utilSetDimensions, d)
            .call(drawVertices, vgraph, _intersection.vertices, filter, extent, z)
            .call(drawLines, vgraph, _intersection.ways, filter)
            .call(drawTurns, vgraph, _intersection.turns(_fromWayID));

        surface
            .on('click.restrictions', click)
            .on('mouseover.restrictions', mouseover)
            .on('mouseout.restrictions', mouseout);

        surface
            .selectAll('.selected')
            .classed('selected', false);

        if (_fromWayID) {
            surface
                .selectAll('.' + _fromWayID)
                .classed('selected', true);
        }

        mouseout();


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
                _fromWayID = datum.id;
                redraw();

            } else if (datum instanceof osmTurn) {
                var actions;
                datum.restriction = osmInferRestriction(vgraph, datum.from, datum.to, projection);

                if (datum.restrictionID && !datum.only) {      // cycle thru the `only_` state
                    var datumOnly = _cloneDeep(datum);
                    datumOnly.only = true;
                    datumOnly.restriction = datumOnly.restriction.replace(/^no\_/, 'only_');
                    actions = _intersection.actions.concat([
                        actionUnrestrictTurn(datum, projection),
                        actionRestrictTurn(datumOnly, projection),
                        t('operations.restriction.annotation.create')
                    ]);
                } else if (datum.restrictionID) {
                    actions = _intersection.actions.concat([
                        actionUnrestrictTurn(datum, projection),
                        t('operations.restriction.annotation.delete')
                    ]);
                } else {
                    actions = _intersection.actions.concat([
                        actionRestrictTurn(datum, projection),
                        t('operations.restriction.annotation.create')
                    ]);
                }
                context.perform.apply(context, actions);

            } else {
                _fromWayID = null;
                redraw();
            }
        }


        function mouseover() {
            var help = _container.selectAll('.restriction-help').html('');
            var div, d;

            var datum = d3_event.target.__data__;
            var entity = datum && datum.properties && datum.properties.entity;
            if (entity) {
                datum = entity;
            }

            surface.selectAll('.related')
                .classed('related', false);

            if (datum instanceof osmWay) {
                d = display(vgraph.entity(datum.id), vgraph);
                div = help.append('div');
                div.append('span').attr('class', 'qualifier').text('FROM');
                div.append('span').text(d.name || d.type);

            } else if (datum instanceof osmTurn) {
                surface.selectAll(utilEntitySelector(datum.key.split(',')))
                    .classed('related', true);

                var turnType = {
                    'no_left_turn': 'Left Turn',
                    'no_right_turn': 'Right Turn',
                    'no_u_turn': 'U-Turn',
                    'no_straight_on': 'Continuing'
                }[osmInferRestriction(vgraph, datum.from, datum.to, projection)];

                var restrictType = 'IS';
                if (datum.restrictionID) {
                    if (datum.only)      { restrictType = 'IS ONLY'; }
                    if (datum.direct)    { restrictType = 'IS NOT'; }
                    if (datum.indirect)  { restrictType = 'IS NOT '; }
                }


                d = display(vgraph.entity(datum.from.way), vgraph);
                div = help.append('div');
                div.append('span').text(turnType);
                // div.append('span').text('Travel');
                div.append('span').attr('class', 'qualifier').text('FROM');
                div.append('span').text(d.name || d.type);
                div.append('span').attr('class', 'qualifier').text(restrictType);
                div.append('span').text('allowed...');

                div = help.append('div');

                if (datum.via.ways) {
                    div = help.append('div');
                    div.append('span').attr('class', 'qualifier').text('VIA');

                    var curr, prev;
                    for (var i = 0; i < datum.via.ways.length; i++) {
                        d = display(vgraph.entity(datum.via.ways[i]), vgraph);
                        curr = d.name || d.type;
                        if (curr === prev) continue;  // collapse identical names

                        if (prev) div.append('span').text(',');
                        div.append('span').text(curr);
                        prev = curr;
                    }
                }
                d = display(vgraph.entity(datum.to.way), vgraph);
                div.append('span').attr('class', 'qualifier').text('TO');
                div.append('span').text(d.name || d.type);


                //DEBUG
                // var str = '';
                // if (datum.restriction) {
                //     if (datum.only)      { str += 'ONLY_ '; }
                //     if (datum.direct)    { str += 'NO_ '; }
                //     if (datum.indirect)  { str += 'indirect '; }
                //     str += datum.restriction;
                // }

                // str += ' FROM ' + datum.from.way +
                //     ' VIA ' + (datum.via.node || datum.via.ways.join(',')) +
                //     ' TO ' + datum.to.way;

                // _container.selectAll('.restriction-help')
                //     .text(str);

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

            //     _container.selectAll('.restriction-help')
            //         .text(t('operations.restriction.help.' +
            //             (datum.restriction ? 'toggle_off' : 'toggle_on'),
            //             { restriction: preset.name() })
            //         );
            }
        }


        function mouseout() {
            var help = _container.selectAll('.restriction-help').html('');
            var div = help.append('div');
            var d;

            if (_fromWayID) {
                d = display(vgraph.entity(_fromWayID), vgraph);
                div.append('span').attr('class', 'qualifier').text('FROM');
                div.append('span').text(d.name || d.type);

            } else {
                div.append('span').text('Click to select the');
                div.append('span').attr('class', 'qualifier').text('FROM');
                div.append('span').text('way');
            }

            // _container.selectAll('.restriction-help')
            //     .text(t('operations.restriction.help.' +
            //         (_fromWayID ? 'toggle' : 'select'))
            //     );
        }


        function redraw() {
            if (context.hasEntity(_vertexID)) {
                _container.call(renderViewer);
            }
        }
    }


    function display(entity, graph) {
        var name = utilDisplayName(entity) || '';
        var matched = context.presets().match(entity, graph);
        var type = (matched && matched.name()) || utilDisplayType(entity.id);
        return { name: name, type: type };
    }


    restrictions.entity = function(_) {
        if (!_vertexID || _vertexID !== _.id) {
            _intersection = null;
            _fromWayID = null;
            _vertexID = _.id;
        }
    };


    restrictions.tags = function() {};
    restrictions.focus = function() {};


    restrictions.off = function(selection) {
        if (!_initialized) return;

        selection.selectAll('.surface')
            .call(hover.off)
            .call(breathe.off)
            .on('click.restrictions', null)
            .on('mouseover.restrictions', null)
            .on('mouseout.restrictions', null);

        d3_select(window)
            .on('resize.restrictions', null);
    };


    return utilRebind(restrictions, dispatch, 'on');
}
