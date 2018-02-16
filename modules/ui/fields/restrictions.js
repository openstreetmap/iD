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

import { utilDetect } from '../../util/detect';

import {
    utilGetDimensions,
    utilSetDimensions
} from '../../util/dimensions';


export function uiFieldRestrictions(field, context) {
    var dispatch = d3_dispatch('change');
    var breathe = behaviorBreathe(context);
    var hover = behaviorHover(context);
    var storedViaWay = context.storage('turn-restriction-via-way');
    var storedDistance = context.storage('turn-restriction-distance');
    var isImperial = (utilDetect().locale.toLowerCase() === 'en-us');

    var _maxViaWay = storedViaWay !== null ? (+storedViaWay) : 1;
    var _maxDistance = storedDistance ? (+storedDistance) : 30;
    var _initialized = false;
    var _parent = d3_select(null);       // the entire field
    var _container = d3_select(null);    // just the map
    var _graph;
    var _vertexID;
    var _intersection;
    var _fromWayID;


    function restrictions(selection) {
        _parent = selection;

        // try to reuse the intersection, but always rebuild it if the graph has changed
        if (_vertexID && (context.graph() !== _graph || !_intersection)) {
            _graph = context.graph();
            _intersection = osmIntersection(_graph, _vertexID, _maxDistance);
        }

        // It's possible for there to be no actual intersection here.
        // for example, a vertex of two `highway=path`
        // In this case, hide the field.
        var isOK = (_intersection && _intersection.vertices.length && _intersection.ways.length);
        d3_select(selection.node().parentNode).classed('hide', !isOK);

        // if form field is hidden or has detached from dom, clean up.
        if (!isOK ||
            !d3_select('.inspector-wrap.inspector-hidden').empty() ||
            !selection.node().parentNode ||
            !selection.node().parentNode.parentNode) {
            selection.call(restrictions.off);
            return;
        }


        var wrap = selection.selectAll('.preset-input-wrap')
            .data([0]);

        wrap = wrap.enter()
            .append('div')
            .attr('class', 'preset-input-wrap')
            .merge(wrap);

        var isComplex = (isOK && _intersection.vertices.length > 1);

        var container = wrap.selectAll('.restriction-container')
            .data([0]);

        // enter
        var containerEnter = container.enter()
            .append('div')
            .attr('class', 'restriction-container');

        containerEnter
            .append('div')
            .attr('class', 'restriction-help');

        // update
        _container = containerEnter
            .merge(container)
            .call(renderViewer);


        var controls = wrap.selectAll('.restriction-controls')
            .data([0]);

        // enter/update
        controls.enter()
            .append('div')
            .attr('class', 'restriction-controls-container')
            .append('div')
            .attr('class', 'restriction-controls')
            .merge(controls)
            .call(renderControls);
    }


    function renderControls(selection) {
        var distControl = selection.selectAll('.restriction-distance')
            .data([0]);

        distControl.exit()
            .remove();

        var distControlEnter = distControl.enter()
            .append('div')
            .attr('class', 'restriction-control restriction-distance');

        distControlEnter
            .append('span')
            .attr('class', 'restriction-control-label restriction-distance-label')
            .text('Distance:');

        distControlEnter
            .append('input')
            .attr('class', 'restriction-distance-input')
            .attr('type', 'range')
            .attr('min', '20')
            .attr('max', '50')
            .attr('step', '5');

        distControlEnter
            .append('span')
            .attr('class', 'restriction-distance-text');

        // update
        selection.selectAll('.restriction-distance-input')
            .property('value', _maxDistance)
            .on('input', function() {
                var val = d3_select(this).property('value');
                _maxDistance = +val;
                _intersection = null;
                _container.selectAll('.layer-osm .layer-turns *').remove();
                context.storage('turn-restriction-distance', _maxDistance);
                _parent.call(restrictions);
            });

        var distDisplay;
        if (isImperial) {   // imprecise conversion for prettier display
            var distToFeet = {
                20: 70, 25: 85, 30: 100, 35: 115, 40: 130, 45: 145, 50: 160
            }[_maxDistance];
            distDisplay = 'Up to ' + distToFeet + ' feet';
        } else {
            distDisplay = 'Up to ' + _maxDistance + ' meters';
        }

        selection.selectAll('.restriction-distance-text')
            .text(distDisplay);


        var viaControl = selection.selectAll('.restriction-via-way')
            .data([0]);

        viaControl.exit()
            .remove();

        var viaControlEnter = viaControl.enter()
            .append('div')
            .attr('class', 'restriction-control restriction-via-way');

        viaControlEnter
            .append('span')
            .attr('class', 'restriction-control-label restriction-via-way-label')
            .text('Via:');

        viaControlEnter
            .append('input')
            .attr('class', 'restriction-via-way-input')
            .attr('type', 'range')
            .attr('min', '0')
            .attr('max', '2')
            .attr('step', '1');

        viaControlEnter
            .append('span')
            .attr('class', 'restriction-via-way-text');

        // update
        selection.selectAll('.restriction-via-way-input')
            .property('value', _maxViaWay)
            .on('input', function() {
                var val = d3_select(this).property('value');
                _maxViaWay = +val;
                _container.selectAll('.layer-osm .layer-turns *').remove();
                context.storage('turn-restriction-via-way', _maxViaWay);
                _parent.call(restrictions);
            });

        var t = ['Node only', 'Up to 1 way', 'Up to 2 ways'];
        selection.selectAll('.restriction-via-way-text')
            .text(t[_maxViaWay]);
    }


    function renderViewer(selection) {
        if (!_intersection) return;

        var vgraph = _intersection.graph;
        var filter = utilFunctor(true);
        var projection = geoRawMercator();

        var d = utilGetDimensions(selection);
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
            var padding = 180;   // in z22 pixels
            var tl = projection([extent[0][0], extent[1][1]]);
            var br = projection([extent[1][0], extent[0][1]]);
            var hFactor = (br[0] - tl[0]) / (d[0] - padding);
            var vFactor = (br[1] - tl[1]) / (d[1] - padding);
            var hZoomDiff = Math.log(Math.abs(hFactor)) / Math.LN2;
            var vZoomDiff = Math.log(Math.abs(vFactor)) / Math.LN2;
            z = z - Math.max(hZoomDiff, vZoomDiff);
            projection.scale(geoZoomToScale(z));
        }

        var padTop = 35;   // reserve top space for hint text
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
            .call(drawTurns, vgraph, _intersection.turns(_fromWayID, _maxViaWay));

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
                datum.restriction = osmInferRestriction(vgraph, datum, projection);

                if (datum.restrictionID && !datum.direct) {
                    return;
                } else if (datum.restrictionID && !datum.only) {    // cycle thru the `only_` state
                    var datumOnly = _cloneDeep(datum);
                    datumOnly.only = true;
                    datumOnly.restriction = datumOnly.restriction.replace(/^no/, 'only');
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
            var datum = d3_event.target.__data__;
            updateHelp(datum);
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
        }


        function redraw() {
            if (context.hasEntity(_vertexID)) {
                _container.call(renderViewer);
            }
        }


        function updateHelp(datum) {
            var help = _container.selectAll('.restriction-help').html('');
            var div, d;

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

                var fromWayID = datum.from.way;
                var viaWayIDs = datum.via.ways;
                var toWayID = datum.to.way;
                var restrictionType = osmInferRestriction(vgraph, datum, projection);

                var turnType = {
                    'no_left_turn': 'Left Turn',
                    'no_right_turn': 'Right Turn',
                    'no_u_turn': 'U-Turn',
                    'no_straight_on': 'Straight On'
                }[restrictionType.replace(/^only/, 'no')];

                var restrictType = '';
                var klass = 'allow';
                if (datum.no)   { restrictType = 'NO'; klass = 'restrict'; }
                if (datum.only) { restrictType = 'ONLY'; klass = 'only'; }

                var s = (klass === 'allow' ? turnType + ' Allowed' : restrictType + ' ' + turnType);
                if (datum.direct === false) { s += ' (indirect)'; }

                div = help.append('div');
                div.append('span')
                    .attr('class', 'qualifier ' + klass)
                    .text(s);

                div = help.append('div');
                d = display(vgraph.entity(fromWayID), vgraph);
                div.append('span').attr('class', 'qualifier').text('FROM');
                div.append('span').text(d.name || d.type);

                d = display(vgraph.entity(toWayID), vgraph);
                div.append('span').attr('class', 'qualifier').text('TO');
                div.append('span').text(d.name || d.type);

                if (viaWayIDs && viaWayIDs.length) {
                    div = help.append('div');
                    div.append('span').attr('class', 'qualifier').text('VIA');

                    var curr, prev;
                    for (var i = 0; i < viaWayIDs.length; i++) {
                        d = display(vgraph.entity(viaWayIDs[i]), vgraph);
                        curr = d.name || d.type;
                        if (curr === prev) continue;  // collapse identical names

                        if (prev) div.append('span').text(',');
                        div.append('span').text(curr);
                        prev = curr;
                    }
                }
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
        // if (!_vertexID || _vertexID !== _.id) {
            _intersection = null;
            _fromWayID = null;
            _vertexID = _.id;
        // }
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
