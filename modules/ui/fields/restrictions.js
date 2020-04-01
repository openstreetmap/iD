import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select, event as d3_event } from 'd3-selection';

import { presetManager } from '../../presets';
import { prefs } from '../../core/preferences';
import { t, localizer } from '../../core/localizer';
import { actionRestrictTurn } from '../../actions/restrict_turn';
import { actionUnrestrictTurn } from '../../actions/unrestrict_turn';
import { behaviorBreathe } from '../../behavior/breathe';
import { geoExtent, geoRawMercator, geoVecScale, geoVecSubtract, geoZoomToScale } from '../../geo';
import { osmIntersection, osmInferRestriction, osmTurn, osmWay } from '../../osm';
import { svgLayers, svgLines, svgTurns, svgVertices } from '../../svg';
import { utilDisplayName, utilDisplayType, utilEntitySelector, utilFunctor, utilRebind } from '../../util';
import { utilGetDimensions, utilSetDimensions } from '../../util/dimensions';


export function uiFieldRestrictions(field, context) {
    var dispatch = d3_dispatch('change');
    var breathe = behaviorBreathe(context);

    prefs('turn-restriction-via-way', null);                 // remove old key
    var storedViaWay = prefs('turn-restriction-via-way0');   // use new key #6922
    var storedDistance = prefs('turn-restriction-distance');

    var _maxViaWay = storedViaWay !== null ? (+storedViaWay) : 0;
    var _maxDistance = storedDistance ? (+storedDistance) : 30;
    var _initialized = false;
    var _parent = d3_select(null);       // the entire field
    var _container = d3_select(null);    // just the map
    var _oldTurns;
    var _graph;
    var _vertexID;
    var _intersection;
    var _fromWayID;

    var _lastXPos;


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
        var isOK = (
            _intersection &&
            _intersection.vertices.length &&           // has vertices
            _intersection.vertices                     // has the vertex that the user selected
                .filter(function(vertex) { return vertex.id === _vertexID; }).length &&
            _intersection.ways.length > 2 &&           // has more than 2 ways
            _intersection.ways                         // has more than 1 TO way
                .filter(function(way) { return way.__to; }).length > 1
        );

        // Also hide in the case where
        d3_select(selection.node().parentNode).classed('hide', !isOK);

        // if form field is hidden or has detached from dom, clean up.
        if (!isOK ||
            !context.container().select('.inspector-wrap.inspector-hidden').empty() ||
            !selection.node().parentNode ||
            !selection.node().parentNode.parentNode) {
            selection.call(restrictions.off);
            return;
        }


        var wrap = selection.selectAll('.form-field-input-wrap')
            .data([0]);

        wrap = wrap.enter()
            .append('div')
            .attr('class', 'form-field-input-wrap form-field-input-' + field.type)
            .merge(wrap);

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
            .text(t('restriction.controls.distance') + ':');

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
                prefs('turn-restriction-distance', _maxDistance);
                _parent.call(restrictions);
            });

        selection.selectAll('.restriction-distance-text')
            .text(displayMaxDistance(_maxDistance));


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
            .text(t('restriction.controls.via') + ':');

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
                prefs('turn-restriction-via-way0', _maxViaWay);
                _parent.call(restrictions);
            });

        selection.selectAll('.restriction-via-way-text')
            .text(displayMaxVia(_maxViaWay));
    }


    function renderViewer(selection) {
        if (!_intersection) return;

        var vgraph = _intersection.graph;
        var filter = utilFunctor(true);
        var projection = geoRawMercator();

        // Reflow warning: `utilGetDimensions` calls `getBoundingClientRect`
        // Instead of asking the restriction-container for its dimensions,
        //  we can ask the .sidebar, which can have its dimensions cached.
        // width: calc as sidebar - padding
        // height: hardcoded (from `80_app.css`)
        // var d = utilGetDimensions(selection);
        var sdims = utilGetDimensions(context.container().select('.sidebar'));
        var d = [ sdims[0] - 50, 370 ];
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

        var drawLayers = svgLayers(projection, context).only(['osm','touch']).dimensions(d);
        var drawVertices = svgVertices(projection, context);
        var drawLines = svgLines(projection, context);
        var drawTurns = svgTurns(projection, context);

        var firstTime = selection.selectAll('.surface').empty();

        selection
            .call(drawLayers);

        var surface = selection.selectAll('.surface')
            .classed('tr', true);

        if (firstTime) {
            _initialized = true;

            surface
                .call(breathe);
        }

        // This can happen if we've lowered the detail while a FROM way
        // is selected, and that way is no longer part of the intersection.
        if (_fromWayID && !vgraph.hasEntity(_fromWayID)) {
            _fromWayID = null;
            _oldTurns = null;
        }

        surface
            .call(utilSetDimensions, d)
            .call(drawVertices, vgraph, _intersection.vertices, filter, extent, z)
            .call(drawLines, vgraph, _intersection.ways, filter)
            .call(drawTurns, vgraph, _intersection.turns(_fromWayID, _maxViaWay));

        surface
            .on('click.restrictions', click)
            .on('mouseover.restrictions', mouseover);

        surface
            .selectAll('.selected')
            .classed('selected', false);

        surface
            .selectAll('.related')
            .classed('related', false);

        if (_fromWayID) {
            var way = vgraph.entity(_fromWayID);
            surface
                .selectAll('.' + _fromWayID)
                .classed('selected', true)
                .classed('related', true);
        }

        document.addEventListener('resizeWindow', function () {
            utilSetDimensions(_container, null);
            redraw(1);
        }, false);

        updateHints(null);


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
                _oldTurns = null;
                redraw();

            } else if (datum instanceof osmTurn) {
                var actions, extraActions, turns, i;
                var restrictionType = osmInferRestriction(vgraph, datum, projection);

                if (datum.restrictionID && !datum.direct) {
                    return;

                } else if (datum.restrictionID && !datum.only) {    // NO -> ONLY
                    var seen = {};
                    var datumOnly = JSON.parse(JSON.stringify(datum));   // deep clone the datum
                    datumOnly.only = true;                               // but change this property
                    restrictionType = restrictionType.replace(/^no/, 'only');

                    // Adding an ONLY restriction should destroy all other direct restrictions from the FROM towards the VIA.
                    // We will remember them in _oldTurns, and restore them if the user clicks again.
                    turns = _intersection.turns(_fromWayID, 2);
                    extraActions = [];
                    _oldTurns = [];
                    for (i = 0; i < turns.length; i++) {
                        var turn = turns[i];
                        if (seen[turn.restrictionID]) continue;  // avoid deleting the turn twice (#4968, #4928)

                        if (turn.direct && turn.path[1] === datum.path[1]) {
                            seen[turns[i].restrictionID] = true;
                            turn.restrictionType = osmInferRestriction(vgraph, turn, projection);
                            _oldTurns.push(turn);
                            extraActions.push(actionUnrestrictTurn(turn));
                        }
                    }

                    actions = _intersection.actions.concat(extraActions, [
                        actionRestrictTurn(datumOnly, restrictionType),
                        t('operations.restriction.annotation.create')
                    ]);

                } else if (datum.restrictionID) {   // ONLY -> Allowed
                    // Restore whatever restrictions we might have destroyed by cycling thru the ONLY state.
                    // This relies on the assumption that the intersection was already split up when we
                    // performed the previous action (NO -> ONLY), so the IDs in _oldTurns shouldn't have changed.
                    turns = _oldTurns || [];
                    extraActions = [];
                    for (i = 0; i < turns.length; i++) {
                        if (turns[i].key !== datum.key) {
                            extraActions.push(actionRestrictTurn(turns[i], turns[i].restrictionType));
                        }
                    }
                    _oldTurns = null;

                    actions = _intersection.actions.concat(extraActions, [
                        actionUnrestrictTurn(datum),
                        t('operations.restriction.annotation.delete')
                    ]);

                } else {    // Allowed -> NO
                    actions = _intersection.actions.concat([
                        actionRestrictTurn(datum, restrictionType),
                        t('operations.restriction.annotation.create')
                    ]);
                }

                context.perform.apply(context, actions);

                // At this point the datum will be changed, but will have same key..
                // Refresh it and update the help..
                var s = surface.selectAll('.' + datum.key);
                datum = s.empty() ? null : s.datum();
                updateHints(datum);

            } else {
                _fromWayID = null;
                _oldTurns = null;
                redraw();
            }
        }


        function mouseover() {
            var datum = d3_event.target.__data__;
            updateHints(datum);
        }

        _lastXPos = _lastXPos || sdims[0];

        function redraw(minChange) {
            var xPos = -1;

            if (minChange) {
                xPos = utilGetDimensions(context.container().select('.sidebar'))[0];
            }

            if (!minChange || (minChange && Math.abs(xPos - _lastXPos) >= minChange)) {
                if (context.hasEntity(_vertexID)) {
                    _lastXPos = xPos;
                    _container.call(renderViewer);
                }
            }
        }


        function highlightPathsFrom(wayID) {
            surface.selectAll('.related')
                .classed('related', false)
                .classed('allow', false)
                .classed('restrict', false)
                .classed('only', false);

            surface.selectAll('.' + wayID)
                .classed('related', true);

            if (wayID) {
                var turns = _intersection.turns(wayID, _maxViaWay);
                for (var i = 0; i < turns.length; i++) {
                    var turn = turns[i];
                    var ids = [turn.to.way];
                    var klass = (turn.no ? 'restrict' : (turn.only ? 'only' : 'allow'));

                    if (turn.only || turns.length === 1) {
                        if (turn.via.ways) {
                            ids = ids.concat(turn.via.ways);
                        }
                    } else if (turn.to.way === wayID) {
                        continue;
                    }

                    surface.selectAll(utilEntitySelector(ids))
                        .classed('related', true)
                        .classed('allow', (klass === 'allow'))
                        .classed('restrict', (klass === 'restrict'))
                        .classed('only', (klass === 'only'));
                }
            }
        }


        function updateHints(datum) {
            var help = _container.selectAll('.restriction-help').html('');

            var placeholders = {};
            ['from', 'via', 'to'].forEach(function(k) {
                placeholders[k] = '<span class="qualifier">' + t('restriction.help.' + k) + '</span>';
            });

            var entity = datum && datum.properties && datum.properties.entity;
            if (entity) {
                datum = entity;
            }

            if (_fromWayID) {
                way = vgraph.entity(_fromWayID);
                surface
                    .selectAll('.' + _fromWayID)
                    .classed('selected', true)
                    .classed('related', true);
            }

            // Hovering a way
            if (datum instanceof osmWay && datum.__from) {
                way = datum;

                highlightPathsFrom(_fromWayID ? null : way.id);
                surface.selectAll('.' + way.id)
                    .classed('related', true);

                var clickSelect = (!_fromWayID || _fromWayID !== way.id);
                help
                    .append('div')      // "Click to select FROM {fromName}." / "FROM {fromName}"
                    .html(t('restriction.help.' + (clickSelect ? 'select_from_name' : 'from_name'), {
                        from: placeholders.from,
                        fromName: displayName(way.id, vgraph)
                    }));


            // Hovering a turn arrow
            } else if (datum instanceof osmTurn) {
                var restrictionType = osmInferRestriction(vgraph, datum, projection);
                var turnType = restrictionType.replace(/^(only|no)\_/, '');
                var indirect = (datum.direct === false ? t('restriction.help.indirect') : '');
                var klass, turnText, nextText;

                if (datum.no) {
                    klass = 'restrict';
                    turnText = t('restriction.help.turn.no_' + turnType, { indirect: indirect });
                    nextText = t('restriction.help.turn.only_' + turnType, { indirect: '' });
                } else if (datum.only) {
                    klass = 'only';
                    turnText = t('restriction.help.turn.only_' + turnType, { indirect: indirect });
                    nextText = t('restriction.help.turn.allowed_' + turnType, { indirect: '' });
                } else {
                    klass = 'allow';
                    turnText = t('restriction.help.turn.allowed_' + turnType, { indirect: indirect });
                    nextText = t('restriction.help.turn.no_' + turnType, { indirect: '' });
                }

                help
                    .append('div')      // "NO Right Turn (indirect)"
                    .attr('class', 'qualifier ' + klass)
                    .text(turnText);

                help
                    .append('div')      // "FROM {fromName} TO {toName}"
                    .html(t('restriction.help.from_name_to_name', {
                        from: placeholders.from,
                        fromName: displayName(datum.from.way, vgraph),
                        to: placeholders.to,
                        toName: displayName(datum.to.way, vgraph)
                    }));

                if (datum.via.ways && datum.via.ways.length) {
                    var names = [];
                    for (var i = 0; i < datum.via.ways.length; i++) {
                        var prev = names[names.length - 1];
                        var curr = displayName(datum.via.ways[i], vgraph);
                        if (!prev || curr !== prev)   // collapse identical names
                            names.push(curr);
                    }

                    help
                        .append('div')      // "VIA {viaNames}"
                        .html(t('restriction.help.via_names', {
                            via: placeholders.via,
                            viaNames: names.join(', ')
                        }));
                }

                if (!indirect) {
                    help
                        .append('div')      // Click for "No Right Turn"
                        .text(t('restriction.help.toggle', { turn: nextText.trim() }));
                }

                highlightPathsFrom(null);
                var alongIDs = datum.path.slice();
                surface.selectAll(utilEntitySelector(alongIDs))
                    .classed('related', true)
                    .classed('allow', (klass === 'allow'))
                    .classed('restrict', (klass === 'restrict'))
                    .classed('only', (klass === 'only'));


            // Hovering empty surface
            } else {
                highlightPathsFrom(null);
                if (_fromWayID) {
                    help
                        .append('div')      // "FROM {fromName}"
                        .html(t('restriction.help.from_name', {
                            from: placeholders.from,
                            fromName: displayName(_fromWayID, vgraph)
                        }));

                } else {
                    help
                        .append('div')      // "Click to select a FROM segment."
                        .html(t('restriction.help.select_from', {
                            from: placeholders.from
                        }));
                }
            }
        }
    }


    function displayMaxDistance(maxDist) {
        var isImperial = !localizer.usesMetric();
        var opts;

        if (isImperial) {
            var distToFeet = {   // imprecise conversion for prettier display
                20: 70, 25: 85, 30: 100, 35: 115, 40: 130, 45: 145, 50: 160
            }[maxDist];
            opts = { distance: t('units.feet', { quantity: distToFeet }) };
        } else {
            opts = { distance: t('units.meters', { quantity: maxDist }) };
        }

        return t('restriction.controls.distance_up_to', opts);
    }


    function displayMaxVia(maxVia) {
        return maxVia === 0 ? t('restriction.controls.via_node_only')
            : maxVia === 1 ? t('restriction.controls.via_up_to_one')
            : t('restriction.controls.via_up_to_two');
    }


    function displayName(entityID, graph) {
        var entity = graph.entity(entityID);
        var name = utilDisplayName(entity) || '';
        var matched = presetManager.match(entity, graph);
        var type = (matched && matched.name()) || utilDisplayType(entity.id);
        return name || type;
    }


    restrictions.entityIDs = function(val) {
        _intersection = null;
        _fromWayID = null;
        _oldTurns = null;
        _vertexID = val[0];
    };


    restrictions.tags = function() {};
    restrictions.focus = function() {};


    restrictions.off = function(selection) {
        if (!_initialized) return;

        selection.selectAll('.surface')
            .call(breathe.off)
            .on('click.restrictions', null)
            .on('mouseover.restrictions', null);

        d3_select(window)
            .on('resize.restrictions', null);
    };


    return utilRebind(restrictions, dispatch, 'on');
}

uiFieldRestrictions.supportsMultiselection = false;
